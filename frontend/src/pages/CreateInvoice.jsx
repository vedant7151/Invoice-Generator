/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import StatusBadge from "../components/StatusBadge";
import { Eye, Save, Upload, Trash2, Plus, FileText, Building2, User, Package } from "lucide-react";
import api from "../api/axiosConfig.js";
import { resolveImageUrl } from "../utils/imageUrl.js";
import { useBusinessProfile } from "../hooks/useBusinessProfile.js";

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
  } catch {
    
  }
}

/* ---------- local invoices helpers (fallback) ---------- */
function getStoredInvoices() {
  return readJSON("invoices_v1", []) || [];
}
function saveStoredInvoices(arr) {
  writeJSON("invoices_v1", arr);
}

/* ---------- util ---------- */
function uid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID)
      return crypto.randomUUID();
  } catch {}
  return Math.random().toString(36).slice(2, 9);
}
function currencyFmt(amount = 0, currency = "INR") {
  try {
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
function computeTotals(items = [], taxPercent = 0) {
  const safe = Array.isArray(items) ? items.filter(Boolean) : [];
  const subtotal = safe.reduce(
    (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
    0
  );
  const tax = (subtotal * Number(taxPercent || 0)) / 100;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

/* ---------- helper: convert dataURL to File ---------- */
function dataURLtoFile(dataurl, filename = "file") {
  if (!dataurl || dataurl.indexOf(",") === -1) return null;
  const arr = dataurl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  try {
    return new File([u8arr], filename, { type: mime });
  } catch {
    const blob = new Blob([u8arr], { type: mime });
    blob.name = filename;
    return blob;
  }
}

/* ---------- icons ---------- (kept same as before) */




/* ---------- Component (Create / Edit Invoice) ---------- */
export default function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams(); // if editing, id will be present
  const loc = useLocation();
  const invoiceFromState =
    loc.state && loc.state.invoice ? loc.state.invoice : null;
  const isEditing = Boolean(id && id !== "new");

  const { isSignedIn, isLoaded } = useAuth();
  const { profile: sharedProfile } = useBusinessProfile();

  // invoice & items state
  function buildDefaultInvoice() {
    // Use a safe client-side local id for previews and local storage.
    const localId = uid();
    return {
      id: localId, // local preview id (server will return _id after save)
      invoiceNumber: "", // will be set on creation by generator
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      fromBusinessName: "",
      fromEmail: "",
      fromAddress: "",
      fromPhone: "",
      fromGst: "",
      client: { name: "", email: "", address: "", phone: "" },
      items: [
        { id: uid(), description: "Service / Item", qty: 1, unitPrice: 0 },
      ],
      currency: "INR",
      status: "draft",
      stampDataUrl: null,
      signatureDataUrl: null,
      logoDataUrl: null,
      signatureName: "",
      signatureTitle: "",
      // leave taxPercent undefined so business profile default can fill it
      taxPercent: undefined,
      notes: "",
    };
  }

  const [invoice, setInvoice] = useState(() => buildDefaultInvoice());
  const [items, setItems] = useState(invoice.items || []);
  const [loading, setLoading] = useState(false);

  // profile fetched from server
  const [profile, setProfile] = useState(null);

  /* ---------- helpers for invoice editing ---------- */
  function updateInvoiceField(field, value) {
    setInvoice((inv) => (inv ? { ...inv, [field]: value } : inv));
  }
  function updateClient(field, value) {
    setInvoice((inv) =>
      inv ? { ...inv, client: { ...(inv.client || {}), [field]: value } } : inv
    );
  }

  function updateItem(idx, key, value) {
    setItems((arr) => {
      const copy = arr.slice();
      const it = { ...(copy[idx] || {}) };
      if (key === "description") it.description = value;
      else it[key] = Number(value) || 0;
      copy[idx] = it;
      setInvoice((inv) => (inv ? { ...inv, items: copy } : inv));
      return copy;
    });
  }


  function addItem() {
    const it = { id: uid(), description: "", qty: 1, unitPrice: 0 };
    setItems((arr) => {
      const next = [...arr, it];
      setInvoice((inv) => (inv ? { ...inv, items: next } : inv));
      return next;
    });
  }


  function removeItem(idx) {
    setItems((arr) => {
      const next = arr.filter((_, i) => i !== idx);
      setInvoice((inv) => (inv ? { ...inv, items: next } : inv));
      return next;
    });
  }

  /* status & currency handlers */
  function handleStatusChange(newStatus) {
    setInvoice((prev) => ({ ...prev, status: newStatus }));
  }
  function handleCurrencyChange(newCurrency) {
    setInvoice((prev) => ({ ...prev, currency: newCurrency }));
  }
  /* images - keep as data URLs in the invoice object */
  function handleImageUpload(file, kind = "logo") {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      setInvoice((inv) =>
        inv
          ? {
              ...inv,
              [`${kind}DataUrl`]: dataUrl,
              ...(kind === "logo" ? { logoDataUrl: dataUrl } : {}),
            }
          : inv
      );
    };
    reader.readAsDataURL(file);
  }
  function removeImage(kind = "logo") {
    setInvoice((inv) =>
      inv
        ? {
            ...inv,
            [`${kind}DataUrl`]: null,
            ...(kind === "logo" ? { logoDataUrl: null } : {}),
          }
        : inv
    );
  }

  /* ---------- helper: check candidate invoiceNumber exists on server/local ---------- */
  const checkInvoiceExists = useCallback(async (candidate) => {
    const local = getStoredInvoices();
    if (local.some((x) => x && x.invoiceNumber === candidate)) return true;
    try {
      const res = await api.get("/api/invoice", {
        params: { invoiceNumber: candidate },
      });
      const data = res.data?.data ?? res.data ?? [];
      return Array.isArray(data) && data.length > 0;
    } catch {
      return false;
    }
  }, []);

  /* ---------- generator: create a candidate and ensure uniqueness (tries up to N times) ---------- */
  const generateUniqueInvoiceNumber = useCallback(
    async (attempts = 10) => {
      for (let i = 0; i < attempts; i++) {
        const datePart = new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "");
        const rand = Math.floor(Math.random() * 9000) + 1000; // 4 digit
        const candidate = `INV-${datePart}-${rand}`;
        // quick local check first
        const exists = await checkInvoiceExists(candidate);
        if (!exists) return candidate;
        // else loop to try again
      }
      // fallback: use uid suffix if all attempts collide (very unlikely)
      return `INV-${new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "")}-${uid().slice(0, 4)}`;
    },
    [checkInvoiceExists]
  );

  /* ---------- fetch/merge business profile via shared hook ---------- */
  useEffect(() => {
    if (!sharedProfile) return;

    const serverProfile = {
      businessName: sharedProfile.businessName ?? "",
      email: sharedProfile.email ?? "",
      address: sharedProfile.address ?? "",
      phone: sharedProfile.phone ?? "",
      gst: sharedProfile.gst ?? "",
      defaultTaxPercent: sharedProfile.defaultTaxPercent ?? 18,
      signatureOwnerName: sharedProfile.signatureOwnerName ?? "",
      signatureOwnerTitle: sharedProfile.signatureOwnerTitle ?? "",
      logoUrl: sharedProfile.logoUrl ?? null,
      stampUrl: sharedProfile.stampUrl ?? null,
      signatureUrl: sharedProfile.signatureUrl ?? null,
      logoDisplayUrl: sharedProfile.logoDisplayUrl ?? null,
      stampDisplayUrl: sharedProfile.stampDisplayUrl ?? null,
      signatureDisplayUrl: sharedProfile.signatureDisplayUrl ?? null,
    };

    setProfile(serverProfile);

    // Merge into invoice only if those invoice fields are empty/unset
    setInvoice((prev) => {
      if (!prev) return prev;
      const shouldOverwriteBusinessName =
        !prev.fromBusinessName || prev.fromBusinessName.trim() === "";
      const shouldOverwriteEmail =
        !prev.fromEmail || prev.fromEmail.trim() === "";
      const shouldOverwriteAddress =
        !prev.fromAddress || prev.fromAddress.trim() === "";
      const shouldOverwritePhone =
        !prev.fromPhone || prev.fromPhone.trim() === "";
      const shouldOverwriteGst =
        !prev.fromGst || prev.fromGst.trim() === "";

      const merged = {
        ...prev,
        fromBusinessName: shouldOverwriteBusinessName
          ? serverProfile.businessName
          : prev.fromBusinessName,
        fromEmail: shouldOverwriteEmail
          ? serverProfile.email
          : prev.fromEmail,
        fromAddress: shouldOverwriteAddress
          ? serverProfile.address
          : prev.fromAddress,
        fromPhone: shouldOverwritePhone
          ? serverProfile.phone
          : prev.fromPhone,
        fromGst: shouldOverwriteGst ? serverProfile.gst : prev.fromGst,
        logoDataUrl:
          prev.logoDataUrl ||
          serverProfile.logoDisplayUrl ||
          resolveImageUrl(serverProfile.logoUrl) ||
          null,
        stampDataUrl:
          prev.stampDataUrl ||
          serverProfile.stampDisplayUrl ||
          resolveImageUrl(serverProfile.stampUrl) ||
          null,
        signatureDataUrl:
          prev.signatureDataUrl ||
          serverProfile.signatureDisplayUrl ||
          resolveImageUrl(serverProfile.signatureUrl) ||
          null,
        signatureName:
          prev.signatureName || serverProfile.signatureOwnerName || "",
        signatureTitle:
          prev.signatureTitle || serverProfile.signatureOwnerTitle || "",
        taxPercent:
          prev && prev.taxPercent !== undefined && prev.taxPercent !== null
            ? prev.taxPercent
            : serverProfile.defaultTaxPercent,
      };

      return merged;
    });
  }, [sharedProfile]);

  /* ---------- load invoice when editing (server first, fallback local) ---------- */
  useEffect(() => {
    let mounted = true;

    async function prepare() {
      if (!isLoaded) return;
      // If AI/Gemini passed an invoice via location.state
      if (invoiceFromState) {
        // merge then normalize any image URLs that may be `http://localhost:...`
        const base = { ...buildDefaultInvoice(), ...invoiceFromState };

        base.logoDataUrl =
          resolveImageUrl(base.logoDataUrl ?? base.logoUrl ?? base.logo) ||
          null;
        base.stampDataUrl =
          resolveImageUrl(base.stampDataUrl ?? base.stampUrl ?? base.stamp) ||
          null;
        base.signatureDataUrl =
          resolveImageUrl(
            base.signatureDataUrl ?? base.signatureUrl ?? base.signature
          ) || null;

        setInvoice(base);

        setItems(
          Array.isArray(invoiceFromState.items)
            ? invoiceFromState.items.slice()
            : invoiceFromState.items
            ? [...invoiceFromState.items]
            : buildDefaultInvoice().items
        );

        return;
      }

      // If editing and no invoiceFromState then fetch from server (or local fallback)
      if (isEditing && !invoiceFromState) {
        setLoading(true);
        try {
          const res = await api.get(`/api/invoice/${id}`);
          const data = res.data?.data ?? res.data ?? null;
          if (data && mounted) {
            const merged = { ...buildDefaultInvoice(), ...data };
            merged.id = data._id ?? data.id ?? merged.id;
            merged.invoiceNumber = data.invoiceNumber ?? merged.invoiceNumber;

            merged.logoDataUrl =
              resolveImageUrl(
                data.logoDataUrl ?? data.logoUrl ?? data.logo
              ) ||
              merged.logoDataUrl ||
              null;
            merged.stampDataUrl =
              resolveImageUrl(
                data.stampDataUrl ?? data.stampUrl ?? data.stamp
              ) ||
              merged.stampDataUrl ||
              null;
            merged.signatureDataUrl =
              resolveImageUrl(
                data.signatureDataUrl ?? data.signatureUrl ?? data.signature
              ) ||
              merged.signatureDataUrl ||
              null;

            setInvoice(merged);
            setItems(
              Array.isArray(data.items) ? data.items.slice() : merged.items
            );
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn(
            "Server invoice fetch failed, will fallback to local:",
            err
          );
        } finally {
          setLoading(false);
        }

        // fallback to local storage
        const all = getStoredInvoices();
        const found = all.find(
          (x) => x && (x.id === id || x._id === id || x.invoiceNumber === id)
        );
        if (found && mounted) {
          const fixed = { ...buildDefaultInvoice(), ...found };

          fixed.logoDataUrl =
            resolveImageUrl(found.logoDataUrl ?? found.logoUrl ?? found.logo) ||
            fixed.logoDataUrl ||
            null;
          fixed.stampDataUrl =
            resolveImageUrl(
              found.stampDataUrl ?? found.stampUrl ?? found.stamp
            ) ||
            fixed.stampDataUrl ||
            null;
          fixed.signatureDataUrl =
            resolveImageUrl(
              found.signatureDataUrl ?? found.signatureUrl ?? found.signature
            ) ||
            fixed.signatureDataUrl ||
            null;

          setInvoice(fixed);
          setItems(
            Array.isArray(found.items)
              ? found.items.slice()
              : buildDefaultInvoice().items
          );
        }

        return;
      }

      // Creating new (neither editing nor invoiceFromState)
      // Build default invoice then generate unique invoiceNumber and set it
      setInvoice((prev) => ({ ...buildDefaultInvoice(), ...prev }));
      setItems(buildDefaultInvoice().items);

      // generate unique invoice number for new invoices
      if (!isEditing) {
        try {
          const candidate = await generateUniqueInvoiceNumber(10);
          if (mounted) {
            setInvoice((inv) =>
              inv ? { ...inv, invoiceNumber: candidate } : inv
            );
          }
        } catch (err) {
          // ignore, keep empty (server will handle on save)
          console.warn("Invoice number generation failed:", err);
        }
      }
    }

    prepare();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    id,
    invoiceFromState,
    isEditing,
    generateUniqueInvoiceNumber,
    isLoaded,
  ]);

  /* ---------- Save invoice to backend (POST or PUT) using Clerk token ---------- */
  async function handleSave() {
    if (!invoice) return;
    setLoading(true);

    const currentTotals = computeTotals(items, invoice.taxPercent);
    const prepared = {
      ...invoice, // Spread the existing invoice state first
      items: items, // Ensure items from the items state are used
      taxPercent: Number(invoice.taxPercent),
      subtotal: currentTotals.subtotal,
      tax: currentTotals.tax,
      total: currentTotals.total,
      // Send exactly what user selected for status and currency
      status: invoice.status, 
      currency: invoice.currency,
      localId: invoice.id,
    };

    console.log("Invoice Data Being Sent:", prepared);
    console.log("Status being sent:", prepared.status);
    console.log("Currency being sent:", prepared.currency);

    // Clean up invoiceNumber
    if (invoice.invoiceNumber && String(invoice.invoiceNumber).trim().length > 0) {
      prepared.invoiceNumber = String(invoice.invoiceNumber).trim();
    }

    try {
      const savedRes = isEditing && invoice.id
        ? await api.put(`/api/invoice/${invoice.id}`, prepared)
        : await api.post("/api/invoice", prepared);
      const saved = savedRes.data?.data ?? savedRes.data ?? null;
      const savedId = saved?._id ?? saved?.id ?? invoice.id;

      // Use server-provided invoiceNumber (if server generated one)
      const merged = {
        ...prepared,
        id: savedId,
        invoiceNumber:
          saved?.invoiceNumber ??
          prepared.invoiceNumber ??
          invoice.invoiceNumber,
        subtotal: saved?.subtotal ?? prepared.subtotal,
        tax: saved?.tax ?? prepared.tax,
        total: saved?.total ?? prepared.total,
      };

      setInvoice((inv) => ({ ...inv, ...merged }));
      setItems(Array.isArray(saved?.items) ? saved.items : items);

      // update local stored invoices (keep local fallback in sync)
      const all = getStoredInvoices();
      if (isEditing) {
        const idx = all.findIndex(
          (x) =>
            x &&
            (x.id === invoice.id ||
              x._id === invoice.id ||
              x.invoiceNumber === invoice.invoiceNumber)
        );
        if (idx >= 0) all[idx] = merged;
        else all.unshift(merged);
      } else {
        // For newly created, use server's invoiceNumber/id if provided
        all.unshift(merged);
      }
      saveStoredInvoices(all);

      alert(`Invoice ${isEditing ? "updated" : "created"} successfully.`);
      navigate("/app/invoices");
    } catch (err) {
      console.error("Failed to save invoice to server:", err);

      // If it was a 409 conflict (duplicate invoice number provided by user), show message and let user fix.
      if (
        String(err?.message || "")
          .toLowerCase()
          .includes("invoice number")
      ) {
        alert(err.message || "Invoice number already exists. Choose another.");
        setLoading(false);
        return;
      }

      // fallback: save locally
      try {
        const all = getStoredInvoices();
        const preparedLocal = {
          ...invoice,
          items,
          subtotal: computeTotals(items, invoice.taxPercent).subtotal,
          tax: computeTotals(items, invoice.taxPercent).tax,
          total: computeTotals(items, invoice.taxPercent).total,
        };
        if (isEditing) {
          const idx = all.findIndex(
            (x) =>
              x &&
              (x.id === invoice.id ||
                x._id === invoice.id ||
                x.invoiceNumber === invoice.invoiceNumber)
          );
          if (idx >= 0) all[idx] = preparedLocal;
          else all.unshift(preparedLocal);
        } else {
          all.unshift(preparedLocal);
        }
        saveStoredInvoices(all);
        alert("Saved locally as fallback (server error).");
        navigate("/app/invoices");
      } catch (localErr) {
        console.error("Local fallback failed:", localErr);
        alert(err?.message || "Save failed. See console.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePreview() {
    const prepared = {
      ...invoice,
      items,
      subtotal: computeTotals(items, invoice.taxPercent).subtotal,
      tax: computeTotals(items, invoice.taxPercent).tax,
      total: computeTotals(items, invoice.taxPercent).total,
    };
    navigate(`/app/invoices/${invoice.id}/preview`, {
      state: { invoice: prepared },
    });
  }

  const totals = computeTotals(items, invoice?.taxPercent ?? 18);



  
  /* ---------- JSX (kept structure, invoiceNumber input prefills generated value) ---------- */
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">
            {isEditing ? "Edit Invoice" : "Create New Invoice"}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {isEditing
              ? "Update invoice details and items below"
              : "Fill in invoice details, add line items, and configure branding"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePreview}
            className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded shadow-sm"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : isEditing ? "Update Invoice" : "Create Invoice"}
          </button>
        </div>
      </div>
      {/* Invoice Header Section */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-md bg-indigo-50 text-indigo-600">
            <FileText className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-medium">Invoice Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Number</label>
            <input
              value={invoice?.invoiceNumber || ""}
              onChange={(e) =>
                updateInvoiceField("invoiceNumber", e.target.value)
              }
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
            <input
              type="date"
              value={invoice?.issueDate || ""}
              onChange={(e) => updateInvoiceField("issueDate", e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
            <input
              type="date"
              value={invoice?.dueDate || ""}
              onChange={(e) => updateInvoiceField("dueDate", e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        {/* Currency and Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Currency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleCurrencyChange("INR")}
                className={`flex items-center gap-3 border rounded p-3 w-full text-left ${
                  invoice.currency === "INR"
                    ? "bg-indigo-600 text-white"
                    : "bg-white"
                }`}
              >
                <span className="text-lg mr-2 font-medium">
                  ₹
                </span>
                <div className="text-left">
                  <div className="font-medium">Indian Rupee</div>
                  <div className="text-xs opacity-70">INR</div>
                </div>
              </button>

              <button
                onClick={() => handleCurrencyChange("USD")}
                className={`flex items-center gap-3 border rounded p-3 w-full text-left ${
                  invoice.currency === "USD"
                    ? "bg-indigo-600 text-white"
                    : "bg-white"
                }`}
              >
                <span className="text-lg mr-2 font-medium">
                  $
                </span>
                <div className="text-left">
                  <div className="font-medium">US Dollar</div>
                  <div className="text-xs opacity-70">USD</div>
                </div>
              </button>
            </div>
          </div>

          {/* Status Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex gap-2 flex-wrap">
              {([
                { value: "draft", label: "Draft" },
                { value: "unpaid", label: "Unpaid" },
                { value: "paid", label: "Paid" },
                { value: "overdue", label: "Overdue" },
              ]).map((status) => (
                <button
                  key={status.value}
                  type="button" // Add type="button" to prevent accidental form submits
                  onClick={() => handleStatusChange(status.value)}
                  className={`inline-flex ${
                    invoice.status === status.value
                      ? "bg-indigo-600 text-white px-3 py-1 rounded"
                      : "bg-gray-100 px-3 py-1 rounded"
                  }`}
                >
                  <StatusBadge
                    status={status.label}
                    size="default"
                    showIcon={true}
                  />
                </button>
              ))}
            </div>

            <div className="mt-2 md:mt-0">
              <select
                value={invoice.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full"
              >
                <option value="draft">Draft</option>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content Grid - left & right columns remain unchanged except they use `invoice` state */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Bill From */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-indigo-50 text-indigo-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-medium">Bill From</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  value={invoice?.fromBusinessName ?? ""}
                  onChange={(e) =>
                    updateInvoiceField("fromBusinessName", e.target.value)
                  }
                  placeholder="Your Business Name"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  value={invoice?.fromEmail ?? ""}
                  onChange={(e) =>
                    updateInvoiceField("fromEmail", e.target.value)
                  }
                  placeholder="business@email.com"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={invoice?.fromAddress ?? ""}
                  onChange={(e) =>
                    updateInvoiceField("fromAddress", e.target.value)
                  }
                  placeholder="Business Address"
                  rows={3}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  value={invoice?.fromPhone ?? ""}
                  onChange={(e) =>
                    updateInvoiceField("fromPhone", e.target.value)
                  }
                  placeholder="+1 (555) 123-4567"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                <input
                  value={invoice?.fromGst ?? ""}
                  onChange={(e) =>
                    updateInvoiceField("fromGst", e.target.value)
                  }
                  placeholder="27AAAPL1234C1ZV"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          </div>

          {/* Bill To */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-md bg-emerald-50 text-emerald-600">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-medium">Bill To</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                <input
                  value={invoice?.client?.name || ""}
                  onChange={(e) => updateClient("name", e.target.value)}
                  placeholder="Client Name"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Email
                </label>
                <input
                  value={invoice?.client?.email || ""}
                  onChange={(e) => updateClient("email", e.target.value)}
                  placeholder="client@email.com"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Address
                </label>
                <textarea
                  value={invoice?.client?.address || ""}
                  onChange={(e) => updateClient("address", e.target.value)}
                  placeholder="Client Address"
                  rows={3}
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Phone
                </label>
                <input
                  value={invoice?.client?.phone || ""}
                  onChange={(e) => updateClient("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white shadow-sm rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-md bg-indigo-50 text-indigo-600">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-medium">
                  Items & Services
                </h3>
              </div>
              <div className="text-sm text-gray-600">
                All amounts in {invoice.currency}
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-3 mt-4">
              {items.map((it, idx) => {
                const totalValue =
                  Number(it?.qty || 0) * Number(it?.unitPrice || 0);
                const totalLabel = currencyFmt(totalValue, invoice.currency);

                return (
                  <div
                    key={it?.id ?? idx}
                    className="grid grid-cols-12 gap-4 items-center"
                  >
                    {/* Description */}
                    <div className="col-span-6">
                      <label
                        className="text-xs text-gray-600 mb-1 block"
                        htmlFor={`desc-${idx}`}
                      >
                        Description
                      </label>
                      <input
                        id={`desc-${idx}`}
                        className="w-full border rounded px-2 py-1"
                        value={it?.description ?? ""}
                        onChange={(e) =>
                          updateItem(idx, "description", e.target.value)
                        }
                        placeholder="Item description"
                        title={it?.description ?? ""}
                        aria-label={`Item ${idx + 1} description`}
                      />
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                      <label
                        className="text-xs text-gray-600 mb-1 block"
                        htmlFor={`qty-${idx}`}
                      >
                        Quantity
                      </label>
                      <input
                        id={`qty-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full border rounded px-2 py-1 text-right"
                        value={String(it?.qty ?? "")}
                        onChange={(e) => updateItem(idx, "qty", e.target.value)}
                        title={String(it?.qty ?? "")}
                        aria-label={`Item ${idx + 1} quantity`}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2">
                      <label
                        className="text-xs text-gray-600 mb-1 block"
                        htmlFor={`price-${idx}`}
                      >
                        Unit Price
                      </label>
                      <input
                        id={`price-${idx}`}
                        type="text"
                        inputMode="decimal"
                        className="w-full border rounded px-2 py-1 text-right"
                        value={String(it?.unitPrice ?? "")}
                        onChange={(e) =>
                          updateItem(idx, "unitPrice", e.target.value)
                        }
                        title={String(it?.unitPrice ?? "")}
                        aria-label={`Item ${idx + 1} unit price`}
                      />
                    </div>

                    {/* Total */}
                    <div className="col-span-1 text-right">
                      <label
                        className="text-xs text-gray-600 mb-1 block"
                        aria-hidden
                      >
                        Total
                      </label>
                      <div
                        className="font-medium"
                        title={totalLabel}
                        aria-label={`Item ${idx + 1} total`}
                      >
                        {totalLabel}
                      </div>
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="inline-flex items-center justify-center p-2"
                        aria-label={`Remove item ${idx + 1}`}
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6">
              <button
                onClick={addItem}
                className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Logo & Branding */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Branding</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Logo
                </label>
                <div>
                  {invoice?.logoDataUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-16 bg-gray-50 rounded overflow-hidden">
                        <img
                          src={invoice.logoDataUrl}
                          alt="logo"
                          className="object-contain w-full h-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            console.warn(
                              "[CreateInvoice] failed to load logo preview:",
                              invoice.logoDataUrl
                            );
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded cursor-pointer">
                          <Upload className="w-4 h-4" /> Change
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(
                                e.target.files && e.target.files[0],
                                "logo"
                              )
                            }
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={() => removeImage("logo")}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border rounded"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="flex items-center gap-3 hover:scale-105 transition-transform">
                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">
                            Upload Logo
                          </p>
                          <p className="text-sm text-gray-500">
                            PNG, JPG up to 5MB
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(
                              e.target.files && e.target.files[0],
                              "logo"
                            )
                          }
                          className="hidden"
                        />
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary & Tax */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Summary & Tax</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="text-sm text-gray-600">Subtotal</div>
                <div className="font-medium text-gray-900">
                  {currencyFmt(totals.subtotal, invoice.currency)}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tax Percentage
                  </label>
                  <input
                    type="number"
                    value={invoice.taxPercent ?? 18}
                    onChange={(e) =>
                      updateInvoiceField(
                        "taxPercent",
                        Number(e.target.value || 0)
                      )
                    }
                    className="w-full text-center border rounded px-3 py-2"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>

                <div className="flex justify-between">
                  <div className="text-sm text-gray-600">Tax Amount</div>
                  <div className="font-medium text-gray-900">
                    {currencyFmt(totals.tax, invoice.currency)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-lg font-semibold">
                  {currencyFmt(totals.total, invoice.currency)}
                </div>
              </div>
            </div>
          </div>

          {/* Stamp & Signature */}
          <div className="bg-white shadow-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Stamp & Signature
            </h3>

            <div className="space-y-6">
              {/* Stamp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Stamp
                </label>
                <div>
                  {invoice.stampDataUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-16 bg-gray-50 rounded overflow-hidden">
                        <img
                          src={invoice.stampDataUrl}
                          alt="stamp"
                          className="object-contain w-full h-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            console.warn(
                              "[CreateInvoice] failed to load stamp preview:",
                              invoice.stampDataUrl
                            );
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded cursor-pointer">
                          <Upload className="w-4 h-4" /> Change
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(
                                e.target.files && e.target.files[0],
                                "stamp"
                              )
                            }
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={() => removeImage("stamp")}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border rounded"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="flex items-center gap-3 hover:scale-105 transition-transform">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            Upload Stamp
                          </p>
                          <p className="text-sm text-gray-500">
                            PNG with transparency
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(
                              e.target.files && e.target.files[0],
                              "stamp"
                            )
                          }
                          className="hidden"
                        />
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Signature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Digital Signature
                </label>
                <div>
                  {invoice.signatureDataUrl ? (
                    <div className="flex items-center gap-3">
                      <div className="w-40 h-24 bg-gray-50 rounded overflow-hidden">
                        <img
                          src={invoice.signatureDataUrl}
                          alt="signature"
                          className="object-contain w-full h-full"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            console.warn(
                              "[CreateInvoice] failed to load signature preview:",
                              invoice.signatureDataUrl
                            );
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-1 bg-white border rounded cursor-pointer">
                          <Upload className="w-4 h-4" /> Change
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(
                                e.target.files && e.target.files[0],
                                "signature"
                              )
                            }
                            className="hidden"
                          />
                        </label>
                        <button
                          onClick={() => removeImage("signature")}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-700 border rounded"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block">
                      <div className="flex items-center gap-3 hover:scale-105 transition-transform">
                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            Upload Signature
                          </p>
                          <p className="text-sm text-gray-500">
                            PNG with transparency
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(
                              e.target.files && e.target.files[0],
                              "signature"
                            )
                          }
                          className="hidden"
                        />
                      </div>
                    </label>
                  )}
                </div>

                {/* Signature Details */}
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signature Owner Name
                    </label>
                    <input
                      placeholder="John Doe"
                      value={invoice.signatureName || ""}
                      onChange={(e) =>
                        updateInvoiceField("signatureName", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Signature Title / Designation
                    </label>
                    <input
                      placeholder="Director / CEO"
                      value={invoice.signatureTitle || ""}
                      onChange={(e) =>
                        updateInvoiceField("signatureTitle", e.target.value)
                      }
                      className="w-full border rounded px-3 py-2 placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}