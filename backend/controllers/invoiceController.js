import mongoose from "mongoose";
import Invoice from "../models/invoiceModel.js";
import BusinessProfile from "../models/businessModel.js";
import { getAuth } from "@clerk/express";
import path from 'path'
import { generateInvoicePdfBuffer } from "../services/pdfService.js";
import { sendInvoiceEmail, buildInvoiceEmailContent } from "../services/emailService.js";

const API_BASE = "http://localhost:4000";

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

//Parse FormData items

function parseItemsField(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val;
  }
  if (typeof val == "string") {
    try {
      return JSON.parse(val);
    } catch (error) {
      return [];
    }
  }

  return val;
}

// check if string is Obj id
function isObjectIdString(val) {
  return typeof val === "string" && /^[0-9a-fA-F]{24}$/.test(val);
}

const EMAIL_RATE_LIMIT = 10;
const EMAIL_RATE_WINDOW_MS = 60 * 1000;
const emailRateMap = new Map();

function checkEmailRateLimit(userId) {
  const now = Date.now();
  const entry = emailRateMap.get(userId);
  if (!entry) {
    emailRateMap.set(userId, { count: 1, resetAt: now + EMAIL_RATE_WINDOW_MS });
    return true;
  }
  if (now >= entry.resetAt) {
    entry.count = 1;
    entry.resetAt = now + EMAIL_RATE_WINDOW_MS;
    return true;
  }
  if (entry.count >= EMAIL_RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(str) {
  return typeof str === "string" && EMAIL_REGEX.test(str.trim());
}

//Helper functions for uploading files to pubic url
function uploadedFilesToUrls(req) {
  const urls = {};
  if (!req.files) return urls;
  const mapping = {
    logoName: "logoDataUrl",
    stampName: "stampDataUrl",
    signatureNameMeta: "signatureDataUrl",
    logo: "logoDataUrl",
    stamp: "stampDataUrl",
    signature: "signatureDataUrl",
  };
  Object.keys(mapping).forEach((field) => {
    const arr = req.files[field];
    if (Array.isArray(arr) && arr[0]) {
      const filename =
        arr[0].filename || (arr[0].path && path.basename(arr[0].path));
      if (filename) urls[mapping[field]] = `${API_BASE}/uploads/${filename}`;
    }
  });
  return urls;
}

//generate unique number for each invoice to avoid collission
async function generateUniqueInvoiceNumber(attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    const ts = Date.now().toString();
    const suffix = Math.floor(Math.random() * 900000)
      .toString()
      .padStart(6, "0");
    const candidate = `INV-${ts.slice(-6)}-${suffix}`;

    const exists = await Invoice.exists({ invoiceNumber: candidate });
    if (!exists) return candidate;
    await new Promise((r) => setTimeout(r, 2));
  }
  return new mongoose.Types.ObjectId().toString();
}

// Create Invoice


export async function createInvoice(req, res) {
  try {
    // 1. Authentication Check
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const body = req.body || {};
    console.log("Backend received body:", body);
    console.log("Status from backend:", body.status);
    console.log("Currency from backend:", body.currency);

    // 2. Input Sanitization & Totals
    const items = Array.isArray(body.items) 
      ? body.items 
      : (typeof parseItemsField === 'function' ? parseItemsField(body.items) : []);
      
    const taxPercent = Math.max(0, Number(body.taxPercent ?? body.tax ?? body.defaultTaxPercent ?? 0));
    
    // Ensure computeTotals is safe
    const totals = computeTotals(items, taxPercent) || { subtotal: 0, tax: 0, total: 0 };
    const fileUrls = typeof uploadedFilesToUrls === 'function' ? uploadedFilesToUrls(req) : {};

    // 3. Handle Invoice Number Logic
    const rawInvoiceNumber = String(body.invoiceNumber || "").trim();
    const isUserProvidedNumber = rawInvoiceNumber.length > 0;
    
    let invoiceNumber = isUserProvidedNumber 
      ? rawInvoiceNumber 
      : await generateUniqueInvoiceNumber();

    // 4. Initial Duplicate Check (Scoped to User)
    if (isUserProvidedNumber) {
      const duplicate = await Invoice.exists({
        owner: userId,
        invoiceNumber: invoiceNumber,
      });
      if (duplicate) {
        return res.status(409).json({ 
          success: false, 
          message: `Invoice number "${invoiceNumber}" is already in use.` 
        });
      }
    }

    // 5. Build Document
    const doc = new Invoice({
      _id: new mongoose.Types.ObjectId(),
      owner: userId,
      invoiceNumber,
      issueDate: body.issueDate || new Date().toISOString().slice(0, 10),
      dueDate: body.dueDate || "",
      fromBusinessName: body.fromBusinessName || "",
      fromEmail: body.fromEmail || "",
      fromAddress: body.fromAddress || "",
      fromPhone: body.fromPhone || "",
      fromGst: body.fromGst || "",
      client: typeof body.client === "string" && body.client.trim()
          ? { name: body.client }
          : body.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency || "INR",
      status: body.status ? String(body.status).toLowerCase() : "draft",
      taxPercent,
      logoDataUrl: fileUrls.logoDataUrl || body.logoDataUrl || body.logo || null,
      stampDataUrl: fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || null,
      signatureDataUrl: fileUrls.signatureDataUrl || body.signatureDataUrl || body.signature || null,
      signatureName: body.signatureName || "",
      signatureTitle: body.signatureTitle || "",
      notes: body.notes || body.aiSource || "",
    });

    console.log("Document to be saved:", {
      status: doc.status,
      currency: doc.currency,
      owner: doc.owner,
      invoiceNumber: doc.invoiceNumber
    });

    // 6. Save Logic with Smart Retry
    let saved = null;
    let attempts = 0;
    const maxSaveAttempts = 5;

    while (attempts < maxSaveAttempts) {
      try {
        saved = await doc.save();
        break; 
      } catch (err) {
        const isDuplicateError = err.code === 11000;
        
        if (isDuplicateError) {
          // If the USER provided the number, we stop and error out.
          // If WE generated the number, we try to generate a new one.
          if (isUserProvidedNumber) {
            return res.status(409).json({ success: false, message: "Invoice number already exists" });
          }

          attempts += 1;
          doc.invoiceNumber = await generateUniqueInvoiceNumber();
          continue; 
        }
        throw err; // Rethrow other DB errors (validation, connection, etc)
      }
    }

    if (!saved) {
      return res.status(500).json({ success: false, message: "Conflict resolution failed after retries" });
    }

    return res.status(201).json({ success: true, message: "Invoice created", data: saved });

  } catch (err) {
    console.error("createInvoice error:", err);

    if (err.type === "entity.too.large") {
      return res.status(413).json({ success: false, message: "Payload too large (check image sizes)" });
    }

    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

// List all INVOICES
export async function getInvoices(req, res) {
  try {
    // 1. Fix: Ensure req is passed to getAuth
    const { userId } = getAuth(req) || {};

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authorization required",
      });
    }

    // 2. Fix: Use req.query directly since we are in a controller
    // If this is a Next.js App Router server action, the logic changes entirely.
    // Assuming this is a standard API route (Pages router or Express):
    const q = { owner: userId };

    if (req.query.status) {
      q.status = req.query.status;
    }

    if (req.query.invoiceNumber) {
      q.invoiceNumber = req.query.invoiceNumber;
    }

    // for filter
    if (req.query.search) {
      const search = req.query.search.trim();
      
      // 3. Optimization: Escape special regex characters to prevent crashing
      // (Optional but recommended) function to escape regex
      const escapeRegex = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const safeSearch = escapeRegex(search);

      q.$or = [
        { fromEmail: { $regex: safeSearch, $options: "i" } },
        { "client.email": { $regex: safeSearch, $options: "i" } },
        { "client.name": { $regex: safeSearch, $options: "i" } },
        { invoiceNumber: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(q).sort({ createdAt: -1 }).lean();
    
    return res.status(200).json({
      success: true,
      data: invoices,
    });

  } catch (error) {
    console.error("GETINVOICES ERROR", error);
    return res.status(500).json({ // Changed to 500 for server errors
      success: false,
      message: "Error in Get invoices",
    });
  }
}

//GET INVOICE BY ID

export async function getInvoiceById(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authorization required",
      });
    }
    let inv;
    const { id } = req.params;
    if (isObjectIdString(id)) {
      inv = await Invoice.findById(id);
    } else {
      inv = await Invoice.findOne({ invoiceNumber: id });
    }

    if (!inv) {
      return res.status(400).json({
        success: false,
        message: "Invoice Not Found",
      });
    }

    if (inv.owner && String(inv.owner) !== String(userId)) {
      return res.status(400).json({
        success: false,
        message: "Forbidden Not your Invoice",
      });
    }

    return res.status(200).json({
      success: true,
      data: inv,
    });
  } catch (error) {
    console.error("GET INVOICES by ID ERROR", error);
    return res.status(400).json({
      success: false,
      message: "Error in Get invoices by ID",
    });
  }
}

// Update AN INVOICE

export async function updateInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authorization required",
      });
    }

    const { id } = req.params;
    const body = req.body || {};

    const query = isObjectIdString(id)
      ? { _id: id, owner: userId }
      : { invoiceNumber: id, owner: userId };
    const existing = await Invoice.findOne(query);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Invoice Not Found",
      });
    }

    //if user changes invoice Number
    // Ensure that it does not exists already or not in use

    if (
      body.invoiceNumber &&
      String(body.invoiceNumber).trim() !== existing.invoiceNumber
    ) {
      const conflict = await Invoice.findOne({
        invoiceNumber: String(body.invoiceNumber).trim(),
      });
      if (conflict && String(conflict._id) !== String(existing._id)) {
        return res
          .status(409)
          .json({ success: false, message: "Invoice number already exists" });
      }
    }

    let items = [];
    if (Array.isArray(body.items)) items = body.items;
    else if (typeof body.items === "string" && body.items.length) {
      try {
        items = JSON.parse(body.items);
      } catch {
        items = [];
      }
    }

    const taxPercent = Number(
      body.taxPercent ??
        body.tax ??
        body.defaultTaxPercent ??
        existing.taxPercent ??
        0
    );
    const totals = computeTotals(items, taxPercent);
    const fileUrls = uploadedFilesToUrls(req);

    // To update
    const update = {
      invoiceNumber: body.invoiceNumber,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      fromBusinessName: body.fromBusinessName,
      fromEmail: body.fromEmail,
      fromAddress: body.fromAddress,
      fromPhone: body.fromPhone,
      fromGst: body.fromGst,
      client:
        typeof body.client === "string" && body.client.trim()
          ? { name: body.client }
          : body.client || existing.client || {},
      items,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      currency: body.currency,
      status: body.status ? String(body.status).toLowerCase() : undefined,
      taxPercent,
      logoDataUrl:
        fileUrls.logoDataUrl || body.logoDataUrl || body.logo || undefined,
      stampDataUrl:
        fileUrls.stampDataUrl || body.stampDataUrl || body.stamp || undefined,
      signatureDataUrl:
        fileUrls.signatureDataUrl ||
        body.signatureDataUrl ||
        body.signature ||
        undefined,
      signatureName: body.signatureName,
      signatureTitle: body.signatureTitle,
      notes: body.notes,
    };

    Object.keys(update).forEach(
      (k) => update[k] === undefined && delete update[k]
    );

    const updated = await Invoice.findOneAndUpdate(
      { _id: existing._id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: "Failed to update invoice",
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Updated invoice Successfully",
    });
  } catch (error) {
    console.error("updateInvoice error:", err);
    if (
      err &&
      err.code === 11000 &&
      err.keyPattern &&
      err.keyPattern.invoiceNumber
    ) {
      return res
        .status(409)
        .json({ success: false, message: "Invoice number already exists" });
    }
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

//Delete an Invoice
// Change params to (req, res) for Express
export async function deleteInvoice(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authorization required",
      });
    }

    const { id } = req.params;
    
    // Determine if we are searching by MongoDB ID or Invoice Number
    const query = isObjectIdString(id)
      ? { _id: id, owner: userId }
      : { invoiceNumber: id, owner: userId };

    // Use findOneAndDelete to do it in one database hit
    const deletedInvoice = await Invoice.findOneAndDelete(query);

    if (!deletedInvoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or you do not have permission",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });

  } catch (error) {
    // Corrected variable name from 'err' to 'error'
    console.error("Delete Invoice error:", error);
    
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}

// Send invoice email (PDF attached via Brevo)
export async function sendInvoiceEmailHandler(req, res) {
  try {
    const { userId } = getAuth(req) || {};
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authorization required",
      });
    }

    if (!checkEmailRateLimit(userId)) {
      return res.status(429).json({
        success: false,
        message: "Too many email requests. Please try again later.",
      });
    }

    const { id } = req.params;
    const body = req.body || {};
    let inv;
    if (isObjectIdString(id)) {
      inv = await Invoice.findById(id);
    } else {
      inv = await Invoice.findOne({ invoiceNumber: id });
    }

    if (!inv) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (inv.owner && String(inv.owner) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. Not your invoice.",
      });
    }

    const recipientEmail = (body.customerEmail && body.customerEmail.trim())
      ? body.customerEmail.trim()
      : (inv.client && inv.client.email) ? String(inv.client.email).trim() : "";

    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      return res.status(400).json({
        success: false,
        message: "Valid recipient email is required",
      });
    }

    const senderEmail = process.env.SENDER_EMAIL;
    if (!senderEmail) {
      console.error("[sendInvoiceEmail] SENDER_EMAIL not configured");
      return res.status(500).json({
        success: false,
        message: "Failed to send invoice email",
      });
    }

    // Merge business profile as fallback (same as InvoicePreview)
    let invForPdf = inv.toObject ? inv.toObject() : { ...inv };
    const profile = await BusinessProfile.findOne({ owner: inv.owner }).lean();
    if (profile) {
      invForPdf = {
        ...invForPdf,
        fromBusinessName: invForPdf.fromBusinessName || profile.businessName,
        fromAddress: invForPdf.fromAddress ?? profile.address,
        fromEmail: invForPdf.fromEmail ?? profile.email,
        fromPhone: invForPdf.fromPhone ?? profile.phone,
        fromGst: invForPdf.fromGst ?? profile.gst,
        logoDataUrl: invForPdf.logoDataUrl ?? profile.logoUrl,
        stampDataUrl: invForPdf.stampDataUrl ?? profile.stampUrl,
        signatureDataUrl: invForPdf.signatureDataUrl ?? profile.signatureUrl,
        signatureName: invForPdf.signatureName ?? profile.signatureOwnerName,
        taxPercent: invForPdf.taxPercent ?? profile.defaultTaxPercent ?? 18,
      };
    }
    // Compute totals from items (same as InvoicePreview) so values are never blank
    const { subtotal, tax, total } = computeTotals(
      invForPdf.items || [],
      invForPdf.taxPercent ?? 18
    );
    invForPdf.subtotal = subtotal;
    invForPdf.tax = tax;
    invForPdf.total = total;

    const pdfBuffer = await generateInvoicePdfBuffer(invForPdf);
    const pdfBase64 = pdfBuffer.toString("base64");
    const pdfFileName = `Invoice-${inv.invoiceNumber || inv.id || "invoice"}.pdf`;

    const { subject, htmlBody } = buildInvoiceEmailContent(invForPdf);
    await sendInvoiceEmail({
      to: recipientEmail,
      subject,
      htmlBody,
      pdfBase64,
      pdfFileName,
      senderEmail,
      senderName: inv.fromBusinessName || undefined,
    });

    console.log("[sendInvoiceEmail] Sent successfully", { invoiceId: id, to: recipientEmail });
    return res.status(200).json({
      success: true,
      message: "Invoice email sent successfully",
    });
  } catch (err) {
    console.error("[sendInvoiceEmail] Error", err?.message || err);
    return res.status(500).json({
      success: false,
      message: "Failed to send invoice email",
    });
  }
}