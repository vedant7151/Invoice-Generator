/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {useNavigate} from 'react-router-dom'
import {useAuth} from '@clerk/clerk-react'
import api from '../api/axiosConfig.js'
import KpiCard from '../components/KpiCard';
import StatusBadge from '../components/StatusBadge';
import { TrendingUp, DollarSign, Clock, Brain, FileText, Eye, Plus, User, ArrowRight } from "lucide-react";

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

function currencyFmt(amount = 0, currency = "INR") {
  try {
    const n = Number(amount || 0);
    if (currency === "INR")
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(n);
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `${currency} ${amount}`;
  }
}

//Icons


/* small helpers to make letters tto upper case*/
function capitalize(s) {
  if (!s) return s;
  return String(s).charAt(0).toUpperCase() + String(s).slice(1);
}

/* ---------- date formatting helper: DD/MM/YYYY ---------- */
function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}


const DashBoard = () => {
  const navigate = useNavigate()
  const { isSignedIn, isLoaded } = useAuth()

  const [storedInvoices , setStoredInvoices] = useState([])
  const [loading , setLoading] = useState(true)
  const [error , setError] = useState(null)

  const [businessProfile , setBusinessProfile] = useState(null)

  const fetchInvoice = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get("/api/invoice")
      const raw = res.data?.data ?? res.data ?? []
      const mapped = (Array.isArray(raw) ? raw : []).map((inv) => {
        const clientObj = inv.client ?? {}
        const amountVal = Number(inv.total ?? inv.amount ?? 0)
        const currency = (inv.currency || "INR").toUpperCase()
        return {
          ...inv,
          id: inv.invoiceNumber || inv._id || String(inv._id || ""),
          client: clientObj,
          amount: amountVal,
          currency,
          status:
            typeof inv.status === "string"
              ? capitalize(inv.status)
              : inv.status || "Draft",
        }
      })
      setStoredInvoices(mapped)
    } catch (err) {
      if (err.status === 401) {
        setError("Unauthorized. Please sign in.")
        setStoredInvoices([])
      } else {
        setError(err?.message || "Failed to load invoices")
        setStoredInvoices([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBusinessProfile = useCallback(async () => {
    try {
      const res = await api.get("/api/businessProfile/me")
      const data = res.data?.data ?? res.data ?? null
      if (data) setBusinessProfile(data)
    } catch (err) {
      if (err.status !== 401) {
        console.warn("Failed to fetch business profile:", err)
      }
    }
  }, [])

  useEffect(()=>{
    if (!isLoaded) return;
    fetchInvoice()
    fetchBusinessProfile()


    function onStorage(e){
      if(e.key === "invoice_v1") fetchInvoice()
    }

    window.addEventListener("storage" , onStorage)
    return ()=> window.removeEventListener("storage" , onStorage)
  }, [fetchBusinessProfile , fetchInvoice , isSignedIn, isLoaded])


  const HARD_RATES = {
    USD_TO_INR: 83, 
  };

  function convertToINR(amount = 0, currency = "INR") {
    const n = Number(amount || 0);
    const curr = String(currency || "INR")
      .trim()
      .toUpperCase();

    if (curr === "INR") return n;
    if (curr === "USD") return n * HARD_RATES.USD_TO_INR;
    return n;
  }

  const kpis = useMemo(() => {
    const totalInvoices = storedInvoices.length;
    let totalPaid = 0; // in INR
    let totalUnpaid = 0; // in INR
    let paidCount = 0;
    let unpaidCount = 0;

    storedInvoices.forEach((inv) => {
      const rawAmount =
        typeof inv.amount === "number"
          ? inv.amount
          : Number(inv.total ?? inv.amount ?? 0);
      const invCurrency = inv.currency || "INR";
      const amtInINR = convertToINR(rawAmount, invCurrency);

      if (inv.status === "Paid") {
        totalPaid += amtInINR;
        paidCount++;
      }
      if (inv.status === "Unpaid" || inv.status === "Overdue") {
        totalUnpaid += amtInINR;
        unpaidCount++;
      }
    });

    const totalAmount = totalPaid + totalUnpaid;
    const paidPercentage =
      totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
    const unpaidPercentage =
      totalAmount > 0 ? (totalUnpaid / totalAmount) * 100 : 0;

    return {
      totalInvoices,
      totalPaid,
      totalUnpaid,
      paidCount,
      unpaidCount,
      paidPercentage,
      unpaidPercentage,
    };
  }, [storedInvoices]);


  const recent = useMemo(() => {
    return storedInvoices
      .slice()
      .sort(
        (a, b) =>
          (Date.parse(b.issueDate || 0) || 0) -
          (Date.parse(a.issueDate || 0) || 0)
      )
      .slice(0, 5);
  }, [storedInvoices]);


  const getClientName = (inv) => {
    if (!inv) return "";
    if (typeof inv.client === "string") return inv.client;
    if (typeof inv.client === "object")
      return inv.client?.name || inv.client?.company || inv.company || "";
    return inv.company || "Client";
  };

  const getClientInitial = (inv) => {
    const clientName = getClientName(inv);
    return clientName ? clientName.charAt(0).toUpperCase() : "C";
  };

  function openInvoice(invRow) {
    const payload = invRow;
    navigate(`/app/invoices/${invRow.id}`, { state: { invoice: payload } });
  }


  return (
    <div className="space-y-8 font-sans">
      <div className="text-center lg:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">Dashboard Overview</h1>

        <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0">
          Track your invoicing performance and business insights
        </p>

      </div>

      {/* Loading and error state */}

      {
        loading ? (<div className={`p-6`}>Loading Invoices...</div>) : error ? (
          <div className='p-6'>
            <div className='text-red-600'>Error : {error}</div>
            <div className='flex gap-2'>
              <button onClick={fetchInvoice} className='px-3 py-1 bg-blue-600 text-white rounded'>Retry</button>

              {String(error).toLocaleLowerCase().includes("unauthorized") && (
                <button onClick={()=> navigate("/login")} className='px-3 py-1 bg-gray-700 text-white rounded'>Sign In</button>
              )}
            </div>
          </div>
        ) : (
          null
        )
      }

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        <KpiCard title="Total Invoices" value={kpis.totalInvoices} hint="Active Invoices" iconType="document" />
        <KpiCard title="Total Paid" value={currencyFmt(kpis.totalPaid, "INR")} hint="Recieved amount (INR)" iconType="revenue" />
        <KpiCard title="Total Unpaid" value={currencyFmt(kpis.totalUnpaid, "INR")} hint="Outstanding Balance" iconType="clock" />
        <KpiCard 
          title="Paid Rate" 
          value={`${kpis.totalInvoices > 0 ? ((kpis.paidCount/kpis.totalInvoices)*100).toFixed(1) : 0}%`} 
          hint="Collection Efficiency" 
          iconType="activity" 
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Full Width Recent Invoices */}
        <div className="col-span-1">


          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                  <p className="text-sm text-gray-600 mt-1">Latest 5 Invoices from your account</p>
                </div>

                <button onClick={()=>navigate("/app/invoices")} className="mt-3 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client & ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200/60" >
                  {
                    recent.map((inv) =>{
                      const clientName = getClientName(inv)
                      const clientInitial = getClientInitial(inv)

                      return(
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors duration-150 group cursor-pointer" onClick={()=> openInvoice(inv)}>
                          <td className="px-6 py-4">
                            <div className='flex items-center gap-3'>
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-medium group-hover:scale-110 transition-transform duration-200">{clientInitial}</div>
                              <div>
                                <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">{clientName}</div>
                                <div className="text-sm text-gray-500">{inv.id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {currencyFmt(inv.amount , inv.currency)}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge status={inv.status} size = "default" showIcon = {true} />
                          </td>

                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {inv.dueDate ? formatDate(inv.dueDate) : "-"}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <div className='text-right'>
                              <button onClick={(e) =>{
                                e.stopPropagation()
                                openInvoice(inv)
                              }} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group/btn">
                                <Eye className='w-4 h-4 group-hover:scale-110 transition-transform'/>
                                view
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  }

                  {/* If No Invoice */}

                  {recent.length === 0 && !loading &&(
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="text-gray-500 space-y-2">
                          <FileText className="w-12 h-12 mx-auto text-gray-300"/>
                          <div className="font-medium">No invoice yet</div>
                          <button onClick={()=> navigate("/app/create-invoice") } className="text-blue-600 hover:text-blue-700 font-medium">Create Your First Invoice</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashBoard