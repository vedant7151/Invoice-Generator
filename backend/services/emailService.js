const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

function formatDate(dateInput) {
  if (!dateInput) return "—";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput));
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatAmount(amount = 0, currency = "INR") {
  const num = Number(amount);
  if (currency === "INR") return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${currency} ${num.toFixed(2)}`;
}

/**
 * Build subject and HTML body for invoice email from invoice document.
 * @param {Object} inv - Invoice document
 * @returns {{ subject: string, htmlBody: string }}
 */
export function buildInvoiceEmailContent(inv) {
  const invNum = inv.invoiceNumber || inv.id || "—";
  const companyName = inv.fromBusinessName || "Company";
  const clientName = (inv.client && inv.client.name) ? inv.client.name : "Client";
  const issueDate = formatDate(inv.issueDate);
  const dueDate = formatDate(inv.dueDate);
  const total = formatAmount(inv.total, inv.currency || "INR");
  const companyEmail = inv.fromEmail || "";
  const companyPhone = inv.fromPhone || "";

  const subject = `Invoice ${invNum} from ${companyName}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1d4ed8;">Invoice Details</h2>
  <p>Dear ${escapeHtml(clientName)},</p>
  <p>We hope you are doing well.</p>
  <p>Please find attached the invoice <strong>${escapeHtml(String(invNum))}</strong> issued on <strong>${escapeHtml(issueDate)}</strong> for the total amount of <strong>${escapeHtml(total)}</strong>.</p>
  <table style="border-collapse: collapse; width: 100%; margin: 20px 0; font-size: 14px;">
    <tr style="background: #f3f4f6;"><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Invoice Number</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(String(invNum))}</td></tr>
    <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Issue Date</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(issueDate)}</td></tr>
    <tr style="background: #f9fafb;"><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Due Date</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(dueDate)}</td></tr>
    <tr><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Total Amount</td><td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${escapeHtml(total)}</td></tr>
  </table>
  <p>Kindly ensure that the payment is completed on or before the due date.</p>
  <p>If you have already processed the payment, please disregard this message.</p>
  <p>Should you have any questions regarding this invoice, feel free to contact us.</p>
  <p style="margin-top: 24px;">Best regards,<br><strong>${escapeHtml(companyName)}</strong><br>${escapeHtml(companyEmail)}<br>${escapeHtml(companyPhone)}</p>
</body>
</html>`.trim();

  return { subject, htmlBody };
}

function escapeHtml(str) {
  if (str == null) return "";
  const s = String(str);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Send transactional email with optional PDF attachment via Brevo API.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.htmlBody - HTML content of the email
 * @param {string} options.pdfBase64 - Base64-encoded PDF content
 * @param {string} options.pdfFileName - Attachment filename (e.g. Invoice-INV-001.pdf)
 * @param {string} [options.senderEmail] - From address (default: process.env.SENDER_EMAIL)
 * @param {string} [options.senderName] - From name (e.g. company name)
 */
export async function sendInvoiceEmail({
  to,
  subject,
  htmlBody,
  pdfBase64,
  pdfFileName,
  senderEmail = process.env.SENDER_EMAIL,
  senderName,
}) {
  const apiKey = (process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("Email service is not configured");
    err.code = "MISSING_API_KEY";
    throw err;
  }
  const fromEmail = (senderEmail || "").trim();
  if (!fromEmail) {
    const err = new Error("Sender email is not configured");
    err.code = "MISSING_SENDER";
    throw err;
  }

  const payload = {
    sender: {
      email: fromEmail,
      name: senderName || fromEmail.split("@")[0],
    },
    to: [{ email: to }],
    subject,
    htmlContent: htmlBody,
    attachment: [
      {
        content: pdfBase64,
        name: pdfFileName,
      },
    ],
  };

  const response = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { message: text };
    }
    if (response.status === 401) {
      console.error(
        "[emailService] Brevo 401 Key not found. Check BREVO_API_KEY in .env: use an API key from Brevo → SMTP & API → API Keys (starts with xkeysib-). Restart the server after changing .env."
      );
    } else {
      console.error("[emailService] Brevo error:", response.status, parsed?.message || text);
    }
    const err = new Error("Failed to send invoice email");
    err.code = "BREVO_ERROR";
    err.status = response.status;
    throw err;
  }
}
