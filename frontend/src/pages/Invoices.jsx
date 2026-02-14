/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useMemo, useState, useEffect, useCallback } from "react";
import StatusBadge from "../components/StatusBadge";
import AiInvoiceModal from "../components/AiInvoiceModal";
import GeminiIcon from "../components/GeminiIcon";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { Search, ArrowUpDown, Filter, Plus, Eye, RotateCcw, Mail } from "lucide-react";
import api from "../api/axiosConfig.js";
import { resolveImageUrl } from "../utils/imageUrl.js";
import toast from "react-hot-toast";

function normalizeInvoiceFromServer(inv = {}) {
  const id = inv.invoiceNumber || inv.id || inv._id || String(inv._id || "");
  const amount =
    inv.total ??
    inv.amount ??
    (inv.subtotal !== undefined ? inv.subtotal + (inv.tax ?? 0) : 0);
  const status = inv.status ?? inv.statusLabel ?? "Draft";

  // Resolve any image/url fields so frontend doesn't try to load localhost from deployed client
  const logo = resolveImageUrl(
    inv.logoDataUrl ?? inv.logoUrl ?? inv.logo ?? null
  );
  const stamp = resolveImageUrl(
    inv.stampDataUrl ?? inv.stampUrl ?? inv.stamp ?? null
  );
  const signature = resolveImageUrl(
    inv.signatureDataUrl ?? inv.signatureUrl ?? inv.signature ?? null
  );

  return {
    ...inv,
    id,
    amount,
    status,
    // normalized image fields (safe for deployed frontend)
    logo,
    stamp,
    signature,
  };
}

function normalizeClient(raw) {
  if (!raw) return { name: "", email: "", address: "", phone: "" };
  if (typeof raw === "string")
    return { name: raw, email: "", address: "", phone: "" };
  if (typeof raw === "object") {
    return {
      name: raw.name ?? raw.company ?? raw.client ?? "",
      email: raw.email ?? raw.emailAddress ?? "",
      address: raw.address ?? "",
      phone: raw.phone ?? raw.contact ?? "",
    };
  }
  return { name: "", email: "", address: "", phone: "" };
}

function formatCurrency(amount = 0, currency = "INR") {
  try {
    if (currency === "INR") {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
    }
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

/* ---------- date formatting helper: DD/MM/YYYY (e.g. 07/12/2025) ---------- */
function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/* icons (same as you had) */


/* Pagination component */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200/60">
      <div className="text-sm text-gray-600">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 ${
                p === page
                  ? "bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          Next
        </button>
      </div>
    </div>
  );
}



/* ---------- Component ---------- */
export default function InvoicesPage() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();

  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [perPage, setPerPage] = useState(6);

  const [sortBy, setSortBy] = useState({ key: "issueDate", dir: "desc" });
  const [page, setPage] = useState(1);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sendingEmailId, setSendingEmailId] = useState(null);

  const fetchInvoices = useCallback(
    async (isRetry = false) => {
      setLoading(true);
      if (!isRetry) setError(null);
      try {
        const res = await api.get("/api/invoice");
        const raw = Array.isArray(res.data?.data) ? res.data.data : res.data ?? [];
        const mapped = raw.map(normalizeInvoiceFromServer);
        setAllInvoices(mapped);
      } catch (err) {
        if (err?.status === 401) {
          // When signed in, token can be briefly unavailable after navigation (e.g. Clerk rehydration). Retry once.
          if (isSignedIn && !isRetry) {
            setTimeout(() => fetchInvoices(true), 400);
            return;
          }
          setError("Unauthorized. Please sign in.");
          setAllInvoices([]);
        } else {
          setError(err?.message || "Failed to load invoices");
        }
      } finally {
        setLoading(false);
      }
    },
    [isSignedIn]
  );

  useEffect(() => {
    if (isLoaded) fetchInvoices();
  }, [fetchInvoices, isSignedIn, isLoaded]);

  // client-side filtering/sorting (same logic)
  const filtered = useMemo(() => {
    let arr = Array.isArray(allInvoices) ? allInvoices.slice() : [];

    if (search.trim()) {
      const q = search.toLowerCase();
      arr = arr.filter((i) => {
        const client = normalizeClient(i.client);
        return (
          (client.name && client.name.toLowerCase().includes(q)) ||
          (i.id && i.id.toLowerCase().includes(q)) ||
          String(i.email || "")
            .toLowerCase()
            .includes(q) ||
          String(i.company || "")
            .toLowerCase()
            .includes(q)
        );
      });
    }

    if (status !== "all")
      arr = arr.filter(
        (i) =>
          (i.status || "").toString().toLowerCase() ===
          status.toString().toLowerCase()
      );

    if (from || to) {
      arr = arr.filter((i) => {
        const d = new Date(i.issueDate || i.date || i.createdAt).setHours(
          0,
          0,
          0,
          0
        );
        if (from) {
          const f = new Date(from).setHours(0, 0, 0, 0);
          if (d < f) return false;
        }
        if (to) {
          const t = new Date(to).setHours(23, 59, 59, 999);
          if (d > t) return false;
        }
        return true;
      });
    }

    arr.sort((a, b) => {
      const ak = a[sortBy.key];
      const bk = b[sortBy.key];

      if (typeof ak === "number" && typeof bk === "number")
        return sortBy.dir === "asc" ? ak - bk : bk - ak;

      const ad = Date.parse(ak || a.issueDate || a.dueDate || "");
      const bd = Date.parse(bk || b.issueDate || b.dueDate || "");
      if (!isNaN(ad) && !isNaN(bd))
        return sortBy.dir === "asc" ? ad - bd : bd - ad;

      const as = (ak || "").toString().toLowerCase();
      const bs = (bk || "").toString().toLowerCase();
      if (as < bs) return sortBy.dir === "asc" ? -1 : 1;
      if (as > bs) return sortBy.dir === "asc" ? 1 : -1;
      return 0;
    });

    return arr;
  }, [allInvoices, search, status, from, to, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const startIndex = (page - 1) * perPage;
  const pageData = filtered.slice(startIndex, startIndex + perPage);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages]);

  function handleSort(key) {
    setSortBy((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  function openInvoice(inv) {
    const found = allInvoices.find((x) => x && x.id === inv.id) || inv;
    navigate(`/app/invoices/${inv.id}/preview`, { state: { invoice: found } });
  }

  async function handleDeleteInvoice(inv) {
    if (!inv?.id) return;
    if (!confirm(`Delete invoice ${inv.id}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/invoice/${encodeURIComponent(inv.id)}`);
      await fetchInvoices();
      alert("Invoice deleted.");
    } catch (err) {
      if (err?.status === 401) {
        alert("Unauthorized. Please sign in.");
        navigate("/login");
      } else {
        alert(err?.message || "Failed to delete invoice.");
      }
    }
  }

  const handleSendEmail = async (inv) => {
    const client = normalizeClient(inv.client);
    const email = client.email || inv.email || inv.client?.email;
    if (!email) {
      toast.error("No email address found for this client.");
      return;
    }
    setSendingEmailId(inv.id);
    try {
      await api.post(`/api/invoice/${inv.id}/send-email`, {
        customerEmail: email,
      });
      toast.success("Invoice email sent successfully");
    } catch (err) {
      toast.error("Failed to send invoice email");
    } finally {
      setSendingEmailId(null);
    }
  };

  async function handleGenerateFromAI(rawText) {
    setAiLoading(true);
    try {
      const aiRes = await api.post("/api/ai/generate", { prompt: rawText });
      const aiInvoice = aiRes.data?.data ?? aiRes.data;
      if (!aiInvoice) {
        throw new Error("AI returned no invoice data (unexpected response).");
      }

      const createRes = await api.post("/api/invoice", aiInvoice);
      const saved = normalizeInvoiceFromServer(
        createRes.data?.data ?? createRes.data
      );
      await fetchInvoices();
      setAiOpen(false);
      navigate(`/app/invoices/${saved.id}/edit`, {
        state: { invoice: saved },
      });
    } catch (err) {
      if (err?.status === 401) {
        throw new Error(
          "Creating invoice requires sign-in. Please sign in to save the AI-generated invoice."
        );
      }
      if (err?.status === 429 || /quota|exhausted|resource_exhausted/i.test(String(err?.message || ""))) {
        throw new Error(`AI provider quota/exhausted: ${err?.message || "Unknown"}`);
      }
      throw err;
    } finally {
      setAiLoading(false);
    }
  }

  // Helper: client initial
  const getClientInitial = (client) => {
    const c = normalizeClient(client);
    return c.name ? c.name.charAt(0).toUpperCase() : "C";
  };

  return (
    <div className="space-y-8 font-[pacifico]">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Invoice Management</h1>
          <p className="mt-2 text-lg text-gray-600 max-w-3xl">
            Search, filter, and manage your invoices with powerful AI tools
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setAiOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium shadow-sm group"
          >
            <GeminiIcon className="w-6 h-6 group-hover:scale-110 transition-transform flex-none" />
            Create with AI
          </button>

          <button
            type="button"
            onClick={() => navigate("/app/create-invoice")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: 12,
            background: "#fff4f4",
            color: "#7f1d1d",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>{error}</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => fetchInvoices()}
                style={{
                  padding: "6px 10px",
                  background: "#efefef",
                  borderRadius: 4,
                }}
              >
                Retry
              </button>
              {String(error).toLowerCase().includes("unauthorized") && (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  style={{
                    padding: "6px 10px",
                    background: "#111827",
                    color: "white",
                    borderRadius: 4,
                  }}
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/60 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">{allInvoices.length}</div>
          <div className="text-sm text-gray-600 mt-1">Total Invoices</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/60 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">
            {
              allInvoices.filter(
                (inv) => (inv.status || "").toString().toLowerCase() === "paid"
              ).length
            }
          </div>
          <div className="text-sm text-gray-600 mt-1">Paid</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/60 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">
            {
              allInvoices.filter((inv) =>
                ["unpaid", "overdue"].includes(
                  (inv.status || "").toString().toLowerCase()
                )
              ).length
            }
          </div>
          <div className="text-sm text-gray-600 mt-1">Unpaid</div>
        </div>
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/60 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">
            {
              allInvoices.filter(
                (inv) => (inv.status || "").toString().toLowerCase() === "draft"
              ).length
            }
          </div>
          <div className="text-sm text-gray-600 mt-1">Drafts</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/60 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Filter className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Filters & Search</h2>
          </div>
          <div className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-bold text-gray-900">
              {filtered.length}
            </span>{" "}
            of {allInvoices.length} invoices
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <label
              htmlFor="invoice-search"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Search Invoices
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="invoice-search"
                name="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
                placeholder="Search by client, invoice ID, email..."
                className="w-full rounded-xl border border-gray-300 pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Status
            </label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <input
                id="from-date"
                name="from"
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:flex-1 min-w-0 rounded-xl border border-gray-300 px-4 py-3 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                aria-label="Start date"
              />
              <div className="flex items-center justify-center">
                <span className="text-gray-400 text-sm">to</span>
              </div>
              <input
                id="to-date"
                name="to"
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:flex-1 min-w-0 rounded-xl border border-gray-300 px-4 py-3 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                aria-label="End date"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 pt-6 border-t border-gray-200/60">
          <div className="flex items-center gap-3">
            <label htmlFor="per-page" className="text-sm font-medium text-gray-700">
              Show
            </label>
            <select
              id="per-page"
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-gray-300 px-4 py-2 bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value={6}>6 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setFrom("");
                setTo("");
                setPage(1);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              <RotateCcw className="w-4 h-4" /> Reset Filters
            </button>
            <button
              type="button"
              onClick={() => fetchInvoices()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">All Invoices</h3>
              <p className="text-sm text-gray-600 mt-1">
                Sorted by{" "}
                <span className="font-medium text-gray-900">{sortBy.key}</span>{" "}·{" "}
                <span className="font-medium text-gray-900">{sortBy.dir === "asc" ? "Ascending" : "Descending"}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/60">
                <th
                  onClick={() => handleSort("client")}
                  className="cursor-pointer px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100/50 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    Client{" "}
                    <ArrowUpDown
                      className={`w-4 h-4 ${
                        sortBy.key === "client" && sortBy.dir === "desc"
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("amount")}
                  className="cursor-pointer px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100/50 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    Amount{" "}
                    <ArrowUpDown
                      className={`w-4 h-4 ${
                        sortBy.key === "amount" && sortBy.dir === "desc"
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="cursor-pointer px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100/50 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    Status{" "}
                    <ArrowUpDown
                      className={`w-4 h-4 ${
                        sortBy.key === "status" && sortBy.dir === "desc"
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("dueDate")}
                  className="cursor-pointer px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-100/50 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    Due Date{" "}
                    <ArrowUpDown
                      className={`w-4 h-4 ${
                        sortBy.key === "dueDate" && sortBy.dir === "desc"
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/60">
              {pageData.map((inv) => {
                const client = normalizeClient(inv.client);
                const clientInitial = getClientInitial(inv.client);
                return (
                  <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors duration-150 group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-medium group-hover:scale-110 transition-transform duration-200">
                          {clientInitial}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                            {client.name || inv.company || inv.id}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {inv.id}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 hidden md:block">
                            {client.email || inv.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatCurrency(inv.amount || 0, inv.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={inv.status}
                        size="default"
                        showIcon
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openInvoice(inv)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group/btn"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendEmail(inv)}
                          disabled={sendingEmailId === inv.id}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" /> {sendingEmailId === inv.id ? "Sending…" : "Email"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteInvoice(inv)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 group/btn bg-[#ffefef] text-[#b91c1c] border-[#fca5a5]"
                          title="Delete invoice"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageData.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500 space-y-3">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="font-medium text-lg">
                        No invoices found
                      </div>
                      <p className="text-sm max-w-md mx-auto">
                        Try adjusting your search filters or create a new
                        invoice to get started.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate("/app/create-invoice")}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Create your first invoice
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="5" style={{ padding: 40, textAlign: "center" }}>
                    Loading invoices...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pageData.length > 0 && (
          <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-200/60">
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* AI modal */}
      <AiInvoiceModal
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onGenerate={handleGenerateFromAI}
        initialText=""
      />
    </div>
  );
}