import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import PDFDocument from "pdfkit";

export type InvoiceLine = {
  name: string;
  sku: string;
  weight: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  orderNumber: string;
  orderDate: string;
  orderStatus: string;
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  items: InvoiceLine[];
};

const LINK_TTL_MS = 180 * 24 * 60 * 60 * 1000;

function getSigningSecret() {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Invoice link signing key is not configured.");
  return secret;
}

export function createInvoiceToken(orderNumber: string, now = Date.now()) {
  const expiresAt = now + LINK_TTL_MS;
  const signature = createHmac("sha256", getSigningSecret()).update(`${orderNumber}:${expiresAt}`).digest("hex");
  return `${expiresAt}.${signature}`;
}

export function verifyInvoiceToken(orderNumber: string, token: string, now = Date.now()) {
  const [expiresAtText, receivedSignature, extra] = token.split(".");
  if (extra !== undefined || !/^\d+$/.test(expiresAtText ?? "") || !/^[a-f0-9]{64}$/i.test(receivedSignature ?? "")) return false;

  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt - now > LINK_TTL_MS) return false;

  const expected = createHmac("sha256", getSigningSecret()).update(`${orderNumber}:${expiresAt}`).digest();
  const received = Buffer.from(receivedSignature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function formatAmount(value: number) {
  return `INR ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function cleanText(value: string) {
  return value.replace(/[\r\n\t]+/g, " ").trim();
}

export function generateInvoicePdf(invoice: InvoiceData) {
  return new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 48, bufferPages: true, info: { Title: `Royal Vanam invoice ${invoice.invoiceNumber}`, Author: "Royal Vanam" } });
    const chunks: Buffer[] = [];
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("error", reject);
    document.on("end", () => resolve(Buffer.concat(chunks)));

    const left = 48;
    const right = 547;
    const width = right - left;
    const drawTableHeader = (top: number) => {
      document.rect(left, top, width, 25).fill("#12372a");
      document.fillColor("#f8f3e8").font("Helvetica-Bold").fontSize(9)
        .text("ITEM", left + 10, top + 8, { width: 280 })
        .text("QTY", left + 300, top + 8, { width: 48, align: "right" })
        .text("UNIT PRICE", left + 355, top + 8, { width: 82, align: "right" })
        .text("AMOUNT", left + 440, top + 8, { width: 50, align: "right" });
      return top + 25;
    };

    const drawPageHeader = () => {
      document.rect(0, 0, 595.28, 104).fill("#12372a");
      document.fillColor("#f2d38a").font("Helvetica-Bold").fontSize(19).text("ROYAL VANAM", left,  thirty(), { characterSpacing: 2 });
      document.fillColor("#f8f3e8").font("Helvetica").fontSize(8).text("NATURE  ·  HERITAGE  ·  PURITY", left, 68, { characterSpacing: 1.5 });
      document.fillColor("#12372a").font("Helvetica-Bold").fontSize(21).text("ORDER INVOICE", left, 124);
      document.fillColor("#6b665a").font("Helvetica").fontSize(9).text("Order receipt for fulfilment", left, 151);
      document.fillColor("#12372a").font("Helvetica-Bold").fontSize(10).text(invoice.invoiceNumber, 335, 128, { width: 212, align: "right" });
      document.fillColor("#6b665a").font("Helvetica").fontSize(9).text(`Order ${invoice.orderNumber}`, 335, 146, { width: 212, align: "right" });
      document.text(`Issued ${invoice.orderDate}`, 335, 161, { width: 212, align: "right" });
      document.moveTo(left, 184).lineTo(right, 184).lineWidth(1).strokeColor("#b48f3a").stroke();
    };

    function thirty() { return 36; }

    const drawParties = () => {
      document.fillColor("#8e7a53").font("Helvetica-Bold").fontSize(8).text("BILLED TO", left, 201, { characterSpacing: 1 });
      document.fillColor("#12372a").font("Helvetica-Bold").fontSize(10).text(cleanText(invoice.customerName), left, 217, { width: 230 });
      document.fillColor("#4d5b54").font("Helvetica").fontSize(9).text(cleanText(invoice.customerEmail), left, 233, { width: 230 });
      document.text(cleanText(invoice.customerPhone), left, 247, { width: 230 });

      document.fillColor("#8e7a53").font("Helvetica-Bold").fontSize(8).text("DELIVER TO", 310, 201, { characterSpacing: 1 });
      document.fillColor("#12372a").font("Helvetica").fontSize(9);
      const address = invoice.deliveryAddress.length ? invoice.deliveryAddress : ["Address provided at checkout"];
      address.forEach((line, index) => document.text(cleanText(line), 310, 217 + index * 13, { width: 237 }));

      const statusY = Math.max(278, 217 + address.length * 13 + 15);
      document.roundedRect(left, statusY, width, 29, 6).fill("#f3eddf");
      document.fillColor("#12372a").font("Helvetica-Bold").fontSize(8).text("ORDER STATUS", left + 10, statusY + 10);
      document.fillColor("#4d5b54").font("Helvetica").fontSize(9).text(cleanText(invoice.orderStatus), left + 95, statusY + 9, { width: 145 });
      document.fillColor("#12372a").font("Helvetica-Bold").fontSize(8).text("PAYMENT", left + 278, statusY + 10);
      document.fillColor("#4d5b54").font("Helvetica").fontSize(9).text(cleanText(invoice.paymentMethod), left + 340, statusY + 9, { width: 150 });
      return statusY + 45;
    };

    drawPageHeader();
    let y = drawParties();
    y = drawTableHeader(y);

    for (const item of invoice.items) {
      const itemName = `${cleanText(item.name)}${item.weight ? ` · ${cleanText(item.weight)}` : ""}`;
      const rowHeight = 32;
      if (y + rowHeight > 730) {
        document.addPage();
        drawPageHeader();
        y = drawTableHeader(205);
      }
      document.fillColor("#12372a").font("Helvetica-Bold").fontSize(9).text(itemName, left + 10, y + 7, { width: 280, ellipsis: true });
      document.fillColor("#7a6e58").font("Helvetica").fontSize(7).text(`SKU ${cleanText(item.sku)}`, left + 10, y + 19, { width: 280, ellipsis: true });
      document.fillColor("#4d5b54").font("Helvetica").fontSize(9)
        .text(String(item.quantity), left + 300, y + 10, { width: 48, align: "right" })
        .text(formatAmount(item.unitPrice), left + 355, y + 10, { width: 82, align: "right" })
        .text(formatAmount(item.total), left + 440, y + 10, { width: 50, align: "right" });
      document.moveTo(left, y + rowHeight).lineTo(right, y + rowHeight).lineWidth(0.5).strokeColor("#e8dcc0").stroke();
      y += rowHeight;
    }

    y += 20;
    const totalRows = [
      ["Subtotal", invoice.subtotal],
      ["Tax", invoice.tax],
      ["Shipping", invoice.shipping],
    ] as const;
    for (const [label, value] of totalRows) {
      document.fillColor("#4d5b54").font("Helvetica").fontSize(9).text(label, 335, y, { width: 100 });
      document.text(formatAmount(value), 435, y, { width: 112, align: "right" });
      y += 18;
    }
    document.moveTo(335, y + 1).lineTo(right, y + 1).lineWidth(1).strokeColor("#b48f3a").stroke();
    y += 10;
    document.fillColor("#12372a").font("Helvetica-Bold").fontSize(12).text("TOTAL", 335, y, { width: 100 });
    document.text(formatAmount(invoice.total), 435, y, { width: 112, align: "right" });

    const footerY = Math.max(y + 45, 742);
    document.fillColor("#6b665a").font("Helvetica").fontSize(8)
      .text("Thank you for choosing Royal Vanam.", left, footerY, { width, align: "center" })
      .text("This order invoice is a receipt for fulfilment. A tax invoice, where applicable, will be issued according to applicable regulations.", left, footerY + 14, { width, align: "center" });

    document.end();
  });
}

function normalizeIndianPhone(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return null;
}

export async function sendInvoiceSms(phone: string, orderNumber: string, invoiceUrl: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  const to = normalizeIndianPhone(phone);
  if (!accountSid || !authToken || !from || !to) return false;

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: `Royal Vanam: your order ${orderNumber} is placed. Download your order invoice: ${invoiceUrl}`,
  });
  const authorization = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Basic ${authorization}`, "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!response.ok) {
      console.error("Invoice SMS delivery failed with HTTP status:", response.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Invoice SMS delivery failed:", error instanceof Error ? error.message : "Unknown error");
    return false;
  }
}
