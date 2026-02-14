import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

// Match InvoicePreview print layout: A4, 1.5cm padding ≈ 43pt
const MARGIN = 43;
const PAGE_WIDTH = 595;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  blue700: "#1d4ed8",
  gray900: "#111827",
  gray800: "#1f2937",
  gray600: "#4b5563",
  gray500: "#6b7280",
  gray400: "#9ca3af",
  gray200: "#e5e7eb",
  gray100: "#f3f4f6",
  gray50: "#f9fafb",
};

/**
 * Format date for display (DD/MM/YYYY) - same as InvoicePreview.
 */
function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Format currency - same as InvoicePreview (en-IN for INR, en-US for USD).
 */
function formatCurrency(amount = 0, currency = "INR") {
  const num = Number(amount);
  if (currency === "INR") {
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (currency === "USD") {
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${currency} ${num.toFixed(2)}`;
}

/**
 * Normalize client object from invoice - same as InvoicePreview.
 */
function normalizeClient(raw) {
  if (!raw || typeof raw !== "object") {
    return { name: "", email: "", address: "", phone: "" };
  }
  return {
    name: raw.name ?? raw.company ?? "",
    email: raw.email ?? "",
    address: raw.address ?? "",
    phone: raw.phone ?? "",
  };
}

/**
 * Load image as Buffer from data URL or /uploads/ path. Returns null if invalid.
 */
function loadImageBuffer(src) {
  if (!src || typeof src !== "string") return null;
  const s = src.trim();
  const dataMatch = s.match(/^data:([^;]+);base64,(.+)$/);
  if (dataMatch) {
    try {
      return Buffer.from(dataMatch[2], "base64");
    } catch {
      return null;
    }
  }
  const uploadsMatch = s.match(/\/(uploads\/[^?#]+)/);
  if (uploadsMatch) {
    try {
      const filePath = path.join(process.cwd(), uploadsMatch[1]);
      if (fs.existsSync(filePath)) return fs.readFileSync(filePath);
    } catch {
      // ignore
    }
  }
  return null;
}

/**
 * Generate invoice PDF as a Buffer, matching InvoicePreview print layout.
 * @param {Object} invoiceDoc - Invoice document or plain object.
 * @returns {Promise<Buffer>}
 */
export function generateInvoicePdfBuffer(invoiceDoc) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    const chunks = [];
    doc.on("data", chunks.push.bind(chunks));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const inv = invoiceDoc || {};
    const client = normalizeClient(inv.client);
    const items = Array.isArray(inv.items) ? inv.items : [];
    const currency = inv.currency || "INR";
    const taxPercent = Number(inv.taxPercent ?? 18);
    // Compute totals from items (same as InvoicePreview) so values are never blank
    const computedSubtotal = items.reduce(
      (s, it) => s + Number(it.qty || 0) * Number(it.unitPrice || 0),
      0
    );
    const computedTax = (computedSubtotal * taxPercent) / 100;
    const computedTotal = computedSubtotal + computedTax;
    const subtotal = Number(inv.subtotal ?? computedSubtotal);
    const tax = Number(inv.tax ?? computedTax);
    const total = Number(inv.total ?? computedTotal);
    const companyName = inv.fromBusinessName || "Business Name";
    const companyAddress = (inv.fromAddress || "").trim();
    const companyEmail = inv.fromEmail || "";
    const companyPhone = inv.fromPhone || "";
    const companyGst = inv.fromGst || "";
    const signatureName = inv.signatureName || companyName;
    const terms = inv.terms || "Thank you for your business!";

    let y = MARGIN;

    // ----- Top: INVOICE title + #number (left), Date / Due Date (right) -----
    doc.fontSize(24).fillColor(COLORS.blue700).font("Helvetica-Bold");
    doc.text("INVOICE", MARGIN, y);
    doc.fontSize(10).fillColor(COLORS.gray600).font("Helvetica");
    doc.text(`#${inv.invoiceNumber || inv.id || "—"}`, MARGIN, y + 28);

    const dateLabelW = 70;
    const dateValX = PAGE_WIDTH - MARGIN - 90;
    doc.fontSize(10).fillColor(COLORS.gray900).font("Helvetica-Bold");
    doc.text("Date:", dateValX - dateLabelW, y);
    doc.fillColor(COLORS.gray600).font("Helvetica");
    doc.text(formatDate(inv.issueDate), dateValX, y, { width: 90, align: "right" });
    doc.fillColor(COLORS.gray900).font("Helvetica-Bold");
    doc.text("Due Date:", dateValX - dateLabelW, y + 16);
    doc.fillColor(COLORS.gray600).font("Helvetica");
    doc.text(formatDate(inv.dueDate), dateValX, y + 16, { width: 90, align: "right" });

    y += 52;

    // ----- Divider line (h-px bg-gray-200), mb-8 -----
    doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor(COLORS.gray200).stroke();
    y += 32;

    // ----- Billed From (left) / Billed To (right) -----
    const colWidth = CONTENT_WIDTH / 2 - 24;
    const leftColX = MARGIN;
    const rightColX = MARGIN + CONTENT_WIDTH / 2 + 12;
    const sectionStartY = y;

    doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold");
    doc.text("BILLED FROM", leftColX, y);
    y += 16;
    doc.fontSize(11).fillColor(COLORS.gray900);
    doc.text(companyName, leftColX, y, { width: colWidth });
    y += 14;
    doc.fontSize(10).fillColor(COLORS.gray600);
    if (companyAddress) {
      companyAddress.split("\n").forEach((line) => {
        doc.text(line.trim(), leftColX, y, { width: colWidth });
        y += 14;
      });
    }
    doc.text(companyEmail, leftColX, y, { width: colWidth });
    y += 14;
    doc.text(companyPhone, leftColX, y, { width: colWidth });
    y += 14;
    if (companyGst) {
      doc.fontSize(9).fillColor(COLORS.gray500);
      doc.text(`GST: ${companyGst}`, leftColX, y, { width: colWidth });
      y += 14;
    }

    let yRight = sectionStartY;
    doc.fontSize(9).fillColor(COLORS.gray900).font("Helvetica-Bold");
    doc.text("BILLED TO", rightColX, yRight);
    yRight += 16;
    doc.fontSize(11).fillColor(COLORS.gray900);
    doc.text(client.name || "—", rightColX, yRight, { width: colWidth });
    yRight += 14;
    doc.fontSize(10).fillColor(COLORS.gray600);
    const clientAddr = (client.address || "No address provided").trim();
    if (clientAddr) {
      clientAddr.split("\n").forEach((line) => {
        doc.text(line.trim(), rightColX, yRight, { width: colWidth });
        yRight += 14;
      });
    }
    doc.text(client.email || "—", rightColX, yRight, { width: colWidth });
    yRight += 14;
    doc.text(client.phone || "—", rightColX, yRight, { width: colWidth });

    y += 24;

    // ----- Items table: full width, header bg gray-50, borders gray-200 -----
    const tableLeft = MARGIN;
    const tableWidth = CONTENT_WIDTH;
    const descW = tableWidth * 0.5;
    const qtyW = 60;
    const priceW = 85;
    const totalW = 95;
    const thH = 28;
    const tdH = 26;

    doc.rect(tableLeft, y, tableWidth, thH).fillAndStroke(COLORS.gray50, COLORS.gray200);
    doc.fontSize(9).fillColor(COLORS.gray500).font("Helvetica-Bold");
    doc.text("Description", tableLeft + 12, y + 8, { width: descW - 16 });
    doc.text("QTY.", tableLeft + descW + 8, y + 8, { width: qtyW, align: "right" });
    doc.text("PRICE", tableLeft + descW + qtyW + 8, y + 8, { width: priceW, align: "right" });
    doc.text("TOTAL", tableLeft + descW + qtyW + priceW + 8, y + 8, { width: totalW, align: "right" });
    doc.font("Helvetica");
    y += thH;

    if (items.length === 0) {
      doc.rect(tableLeft, y, tableWidth, tdH).strokeColor(COLORS.gray200).stroke();
      doc.fontSize(10).fillColor(COLORS.gray400).text("No items added", tableLeft + 12, y + 8, { width: tableWidth - 24 });
      y += tdH;
    } else {
      items.forEach((item) => {
        if (y + tdH > 720) {
          doc.addPage({ size: "A4", margin: MARGIN });
          y = MARGIN;
        }
        doc.moveTo(tableLeft, y).lineTo(tableLeft + tableWidth, y).strokeColor(COLORS.gray100).stroke();
        const desc = String(item.description ?? "").slice(0, 80);
        const qty = String(item.qty ?? "");
        const unitPrice = Number(item.unitPrice ?? 0);
        const lineTotal = Number(item.qty ?? 0) * unitPrice;
        doc.fontSize(10).fillColor(COLORS.gray900);
        doc.text(desc, tableLeft + 12, y + 6, { width: descW - 16 });
        doc.text(qty, tableLeft + descW + 8, y + 6, { width: qtyW, align: "right" });
        doc.fillColor(COLORS.gray600);
        doc.text(formatCurrency(unitPrice, currency), tableLeft + descW + qtyW + 8, y + 6, { width: priceW, align: "right" });
        doc.fillColor(COLORS.gray900).font("Helvetica-Bold");
        doc.text(formatCurrency(lineTotal, currency), tableLeft + descW + qtyW + priceW + 8, y + 6, { width: totalW, align: "right" });
        doc.font("Helvetica");
        y += tdH;
      });
      doc.moveTo(tableLeft, y).lineTo(tableLeft + tableWidth, y).strokeColor(COLORS.gray200).stroke();
    }

    y += 24;

    // ----- Totals: right-aligned block (w-80 style), Subtotal, Tax, Total Amount in blue -----
    const totalsBlockW = 220;
    const totalsLeft = PAGE_WIDTH - MARGIN - totalsBlockW;
    let ty = y;
    doc.fontSize(10).fillColor(COLORS.gray600);
    doc.text("Subtotal", totalsLeft, ty);
    doc.text(formatCurrency(subtotal, currency), totalsLeft, ty, { width: totalsBlockW - 10, align: "right" });
    ty += 18;
    doc.text(`Tax (${taxPercent}%)`, totalsLeft, ty);
    doc.text(formatCurrency(tax, currency), totalsLeft, ty, { width: totalsBlockW - 10, align: "right" });
    ty += 22;
    doc.moveTo(totalsLeft, ty).lineTo(PAGE_WIDTH - MARGIN, ty).strokeColor(COLORS.gray200).stroke();
    ty += 18;
    doc.fontSize(11).fillColor(COLORS.gray900).font("Helvetica-Bold");
    doc.text("TOTAL AMOUNT", totalsLeft, ty);
    doc.fillColor(COLORS.blue700).font("Helvetica-Bold");
    doc.text(formatCurrency(total, currency), totalsLeft, ty - 1, { width: totalsBlockW - 10, align: "right" });
    doc.font("Helvetica").fillColor(COLORS.gray900);
    y = ty + 28;

    // ----- Signatures & Stamp: border-t, flex justify-between -----
    doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor(COLORS.gray100).stroke();
    y += 20;

    const sigBlockW = 200;
    const imgH = 50;
    const signatureRowY = y;

    const signatureBuf = loadImageBuffer(inv.signatureDataUrl ?? inv.signatureUrl);
    if (signatureBuf) {
      try {
        doc.image(signatureBuf, MARGIN, y, { width: 120, height: imgH });
      } catch {
        // ignore
      }
    }
    const stampBuf = loadImageBuffer(inv.stampDataUrl ?? inv.stampUrl);
    if (stampBuf) {
      try {
        doc.image(stampBuf, PAGE_WIDTH - MARGIN - 80, signatureRowY, { width: 80, height: 48 });
      } catch {
        // ignore
      }
    }

    y += imgH + 8;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + sigBlockW, y).strokeColor(COLORS.gray200).stroke();
    y += 10;
    doc.fontSize(10).fillColor(COLORS.gray800).font("Helvetica-Bold");
    doc.text("Authorized Signature", MARGIN, y);
    y += 12;
    doc.fontSize(9).fillColor(COLORS.gray500).font("Helvetica");
    doc.text(signatureName, MARGIN, y);

    y += 28;

    // ----- Footer: border-t, text-center, terms -----
    doc.moveTo(MARGIN, y).lineTo(PAGE_WIDTH - MARGIN, y).strokeColor(COLORS.gray100).stroke();
    y += 14;
    doc.fontSize(9).fillColor(COLORS.gray400);
    doc.text(terms, MARGIN, y, { width: CONTENT_WIDTH, align: "center" });

    doc.end();
  });
}
