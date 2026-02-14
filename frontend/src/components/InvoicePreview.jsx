/* eslint-disable no-unsafe-finally */
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Printer, Edit, ArrowLeft, FileX, FileText } from "lucide-react";
import api from "../api/axiosConfig.js";
import { resolveImageUrl } from "../utils/imageUrl.js";

function readJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function writeJSON(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}
function getStoredInvoices() {
  return readJSON("invoices_v1", []) || [];
}

const defaultProfile = {
  businessName: "",
  email: "",
  address: "",
  phone: "",
  gst: "",
  stampDataUrl: null,
  signatureDataUrl: null,
  logoDataUrl: null,
  defaultTaxPercent: 18,
  signatureName: "",
  signatureTitle: "",
};

function currencyFmt(amount = 0, currency = "INR") {
  try {
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}

function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function normalizeClient(raw) {
  if (!raw) return { name: "", email: "", address: "", phone: "" };
  if (typeof raw === "string")
    return { name: raw, email: "", address: "", phone: "" };
  if (typeof raw === "object") {
    return {
      name: raw.name ?? raw.company ?? raw.client ?? "",
      email: raw.email ?? raw.emailAddress ?? "",
      address: raw.address ?? raw.addr ?? raw.clientAddress ?? "",
      phone: raw.phone ?? raw.contact ?? raw.mobile ?? "",
    };
  }
  return { name: "", email: "", address: "", phone: "" };
}

/* ----------------- icons ----------------- */


/* ----------------- component ----------------- */
export default function InvoicePreview() {
  const { id } = useParams();
  const loc = useLocation();
  const navigate = useNavigate();

  const invoiceFromState = loc?.state?.invoice ?? null;
  const [invoice, setInvoice] = useState(() =>
    invoiceFromState ? invoiceFromState : null
  );
  const [loadingInvoice, setLoadingInvoice] = useState(
    !invoiceFromState && Boolean(id)
  );
  const [invoiceError, setInvoiceError] = useState(null);

  const [profile, setProfile] = useState(
    () => readJSON("business_profile", defaultProfile) || defaultProfile
  );
  const [profileLoading, setProfileLoading] = useState(false);

  const prevTitleRef = useRef(document.title);

  useEffect(() => {
    let mounted = true;
    async function fetchInvoice() {
      if (!id || invoiceFromState) return;
      setLoadingInvoice(true);
      setInvoiceError(null);
      try {
        const res = await api.get(`/api/invoice/${id}`);
        const data = res.data?.data ?? res.data ?? null;
        if (mounted && data) {
          const normalized = {
            ...data,
            id: data._id ?? data.id ?? id,
            items: Array.isArray(data.items)
              ? data.items
              : data.items
              ? [...data.items]
              : [],
            invoiceNumber: data.invoiceNumber ?? data.invoiceNumber ?? "",
            currency: data.currency || "INR",
          };
          setInvoice(normalized);
        }
      } catch (err) {
        if (mounted) {
          setInvoiceError(err?.message ?? "Invoice not found");
          const all = getStoredInvoices();
          const found = all.find(
            (x) => x && (x.id === id || x._id === id || x.invoiceNumber === id)
          );
          if (found) setInvoice(found);
        }
      } finally {
        if (mounted) setLoadingInvoice(false);
      }
    }
    fetchInvoice();
    return () => {
      mounted = false;
    };
  }, [id, invoiceFromState]);

  useEffect(() => {
    let mounted = true;
    async function fetchProfile() {
      setProfileLoading(true);
      try {
        const res = await api.get("/api/businessProfile/me");
        const data = res.data?.data ?? res.data ?? null;
        if (mounted && data && typeof data === "object") {
          const normalized = {
            businessName:
              data.businessName ?? data.name ?? defaultProfile.businessName,
            email: data.email ?? defaultProfile.email,
            address: data.address ?? defaultProfile.address,
            phone: data.phone ?? defaultProfile.phone,
            gst: data.gst ?? defaultProfile.gst,
            stampDataUrl:
              data.stampUrl ?? data.stampDataUrl ?? defaultProfile.stampDataUrl,
            signatureDataUrl:
              data.signatureUrl ??
              data.signatureDataUrl ??
              defaultProfile.signatureDataUrl,
            logoDataUrl:
              data.logoUrl ?? data.logoDataUrl ?? defaultProfile.logoDataUrl,
            defaultTaxPercent: Number.isFinite(Number(data.defaultTaxPercent))
              ? Number(data.defaultTaxPercent)
              : defaultProfile.defaultTaxPercent,
            signatureName:
              data.signatureOwnerName ??
              data.signatureName ??
              defaultProfile.signatureName,
            signatureTitle:
              data.signatureOwnerTitle ??
              data.signatureTitle ??
              defaultProfile.signatureTitle,
          };
          setProfile(normalized);
          try {
            writeJSON("business_profile", normalized);
          } catch {}
        }
      } catch (err) {
        if (mounted && err?.status !== 401) {
          console.warn("Error fetching profile:", err);
        }
      } finally {
        if (mounted) setProfileLoading(false);
      }
    }

    const stored = readJSON("business_profile", null);
    if (!stored) fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);


  useEffect(() => {
    if (!invoice) return;
    const invoiceNumber =
      invoice.invoiceNumber || invoice.id || `invoice-${Date.now()}`;
    const safe = `Invoice-${String(invoiceNumber).replace(
      /[^\w\-_.() ]/g,
      "_"
    )}`;
    const prev = prevTitleRef.current ?? document.title;
    if (document.title !== safe) document.title = safe;
    return () => {
      try {
        document.title = prev;
      } catch {}
    };
  }, [invoice]);


  const handlePrint = useCallback(() => {
    const invoiceNumber =
      (invoice && (invoice.invoiceNumber || invoice.id)) ||
      `invoice-${Date.now()}`;
    const safe = `Invoice-${String(invoiceNumber).replace(
      /[^\w\-_.() ]/g,
      "_"
    )}`;

    const prevTitle = document.title;
    document.title = safe;
    window.print();

    // Restore title after a delay
    setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  }, [invoice]);

  if (!invoice && (loadingInvoice || profileLoading)) {
    return <div className="p-6">Loading…</div>;
  }
  if (!invoice) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-200/60 shadow-sm text-center">
            <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4">
              <FileX className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Invoice Not Found
            </h3>
            <p className="text-gray-600 mt-2 max-w-md mx-auto">
              The invoice you're looking for doesn't exist or may have been
              deleted.
            </p>
            <div className="mt-6">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Invoices
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const items = (
    invoice.items && Array.isArray(invoice.items) ? invoice.items : []
  ).filter(Boolean);
  const subtotal = items.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  const taxPercent = Number(
    invoice.taxPercent ?? profile.defaultTaxPercent ?? 18
  );
  const tax = (subtotal * taxPercent) / 100;
  const total = subtotal + tax;

  const logo = resolveImageUrl(
    invoice.logoDataUrl ?? profile.logoDataUrl ?? null
  );
  const stamp = resolveImageUrl(
    invoice.stampDataUrl ?? profile.stampDataUrl ?? null
  );
  const signature = resolveImageUrl(
    invoice.signatureDataUrl ?? profile.signatureDataUrl ?? null
  );

  const signatureName = invoice.signatureName ?? profile.signatureName ?? "";
  const signatureTitle = invoice.signatureTitle ?? profile.signatureTitle ?? "";

  const client = normalizeClient(invoice.client);
  const invoiceCurrency = invoice.currency || "INR";


  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50/50">
      <div className="max-w-5xl mx-auto">
        {/* Header Actions - No Print */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 no-print">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <FileText className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Invoice Preview
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-1">
              Ref: <span className="font-medium text-gray-900">{invoice.invoiceNumber || invoice.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                navigate(`/app/invoices/${invoice.id}/edit`, {
                  state: { invoice },
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm"
            >
              <Edit className="w-4 h-4" /> Edit
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium shadow-md shadow-indigo-200"
            >
              <Printer className="w-4 h-4" /> Print PDF
            </button>
          </div>
        </div>

        {/* PRINT AREA */}
        <div
          id="print-area"
          className="bg-white shadow-xl shadow-gray-200/40 rounded-xl overflow-hidden print-preview-container flex flex-col min-h-[29.7cm] print:min-h-0"
        >
          {/* Top Section: INVOICE title and Dates */}
          <div className="p-8 md:p-10 pb-4">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-4xl font-bold text-blue-700 uppercase tracking-wide mb-2 leading-none">
                  INVOICE
                </h1>
                <p className="text-gray-600 text-lg font-medium">
                  #{invoice.invoiceNumber || invoice.id}
                </p>
              </div>
              <div className="text-right">
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <div className="flex justify-end items-center gap-6">
                    <span className="font-semibold text-gray-900 w-20 text-right">Date:</span>
                    <span className="w-24 text-right">{formatDate(invoice.issueDate)}</span>
                  </div>
                  <div className="flex justify-end items-center gap-6">
                    <span className="font-semibold text-gray-900 w-20 text-right">Due Date:</span>
                    <span className="w-24 text-right">{formatDate(invoice.dueDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-200 w-full mb-8"></div>

            {/* Billing Details: From (Left) & To (Right) */}
            <div className="flex flex-row justify-between items-start gap-12 mb-8">
              {/* Billed From */}
              <div className="flex-1 max-w-[45%]">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">
                  Billed From
                </h3>
                <div className="text-gray-600 text-sm space-y-1 leading-relaxed">
                  <p className="font-bold text-gray-900 text-base mb-1">
                    {invoice.fromBusinessName || profile.businessName || "Business Name"}
                  </p>
                  <p className="whitespace-pre-line">
                    {invoice.fromAddress || profile.address}
                  </p>
                  <p>{invoice.fromEmail || profile.email}</p>
                  <p>{invoice.fromPhone || profile.phone}</p>
                  {(invoice.fromGst || profile.gst) && (
                    <p className="mt-2 text-xs font-medium text-gray-500">
                      GST: {invoice.fromGst || profile.gst}
                    </p>
                  )}
                </div>
              </div>

              {/* Billed To */}
              <div className="flex-1 max-w-[45%]">
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-4">
                  Billed To
                </h3>
                <div className="text-gray-600 text-sm space-y-1 leading-relaxed">
                  {client.name ? (
                    <>
                      <p className="font-bold text-gray-900 text-base mb-1">
                        {client.name}
                      </p>
                      <p className="whitespace-pre-line">
                        {client.address || "No address provided"}
                      </p>
                      <p>{client.email}</p>
                      <p>{client.phone}</p>
                    </>
                  ) : (
                    <p className="text-gray-400 italic">Client details not available</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-y border-gray-200">
                  <th className="py-3 px-8 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">
                    Description
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    QTY.
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    PRICE
                  </th>
                  <th className="py-3 px-8 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/30">
                    <td className="py-4 px-8 font-medium text-gray-900 align-top">
                      {item.description}
                    </td>
                    <td className="py-4 px-4 text-right align-top">{item.qty}</td>
                    <td className="py-4 px-4 text-right align-top text-gray-600">
                      {currencyFmt(item.unitPrice, invoiceCurrency)}
                    </td>
                    <td className="py-4 px-8 text-right align-top font-bold text-gray-900">
                      {currencyFmt(
                        (item.qty || 0) * (item.unitPrice || 0),
                        invoiceCurrency
                      )}
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400 italic">
                      No items added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals & Footer */}
          <div className="p-6 md:p-8 pt-2">
            <div className="flex flex-col gap-4">
              {/* Totals Area */}
              <div className="flex justify-end">
                <div className="w-80 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-gray-900">
                      {currencyFmt(subtotal, invoiceCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 pb-3 border-b border-gray-200">
                    <span>Tax ({taxPercent}%)</span>
                    <span className="font-medium text-gray-900">
                      {currencyFmt(tax, invoiceCurrency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-base font-bold text-gray-900 uppercase">
                      Total Amount
                    </span>
                    <span className="text-xl font-bold text-blue-700">
                      {currencyFmt(total, invoiceCurrency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Stamps */}
              <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-2">
                {/* Signature Block (Left) */}
                <div className="text-center min-w-[200px]">
                  <div className="h-14 flex items-end justify-center mb-1">
                     {signature ? (
                        <img src={signature} alt="Signature" className="h-full object-contain" />
                     ) : null}
                  </div>
                  <div className="border-t border-gray-300 w-full pt-1">
                    <p className="text-sm font-bold text-gray-800">Authorized Signature</p>
                    <p className="text-xs text-gray-500">{signatureName || invoice.fromBusinessName}</p>
                  </div>
                </div>

                {/* Stamp Block (Right) */}
                <div className="text-center min-w-[150px]">
                   {stamp && (
                      <div className="mb-1 flex justify-center">
                        <img
                          src={stamp}
                          alt="Stamp"
                          className="h-12 object-contain opacity-90 mix-blend-multiply print-preview-stamp"
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-4 pt-2 border-t border-gray-100 text-center text-xs text-gray-400">
              <p>{invoice.terms || "Thank you for your business!"}</p>
            </div>
          </div>
        </div>
        
        <div className="h-12 no-print"></div>
      </div>
    </div>
  );
}