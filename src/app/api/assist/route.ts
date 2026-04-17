import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { llmJson } from "@/lib/llm";

export async function POST(req: NextRequest) {
  const { prompt, docType } = await req.json();
  const type = (docType || "INVOICE") as "INVOICE" | "QUOTATION" | "WAYBILL" | "LETTER";
  const company = await prisma.companySettings.findUnique({ where: { id: 1 } });
  const clients = await prisma.client.findMany({ take: 50 });
  const products = await prisma.product.findMany({ take: 100 });

  const isWaybill = type === "WAYBILL";
  const isLetter = type === "LETTER";

  let system: string;

  if (isLetter) {
    system = `You are a professional letter writer for ${company?.name || "the company"}.
Return ONLY valid JSON (no prose, no code fences) with this shape:
{
  "type": "LETTER",
  "clientName": string (recipient name),
  "clientAddress": string (recipient address),
  "clientEmail": string,
  "clientPhone": string,
  "issueDate": "YYYY-MM-DD",
  "dueDate": null,
  "notes": "",
  "taxRate": 0,
  "items": [],
  "extra": {
    "subject": string (letter subject line),
    "body": string (the full letter body text - multiple paragraphs separated by \\n\\n),
    "closing": string (e.g. "Yours sincerely", "Best regards", "Yours faithfully"),
    "recipientTitle": string (e.g. "Dear Sir/Madam", "Dear Mr. Smith", "To Whom It May Concern")
  }
}

Known clients: ${JSON.stringify(clients.map((c) => ({ name: c.name, address: c.address, email: c.email, phone: c.phone })))}

Company info:
- Name: ${company?.name || ""}
- Address: ${company?.address || ""}
- Phone: ${company?.phone || ""}
- Email: ${company?.email || ""}

Rules:
- Match known client names when mentioned.
- Today is ${new Date().toISOString().slice(0, 10)}.
- Write the letter body in a professional, formal tone unless instructed otherwise.
- The body should be well-structured with proper paragraphs.
- Include appropriate opening and closing.
- The subject should be concise and descriptive.
- Always include all fields; use empty string or null when unknown.`;
  } else {
    system = `You are preparing a ${type} for ${company?.name || "the company"}.
Return ONLY valid JSON (no prose, no code fences) with this shape:
{
  "type": "${type}",
  "clientName": string,
  "clientAddress": string,
  "clientEmail": string,
  "clientPhone": string,
  "issueDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD" or null,
  "notes": string,
  "taxRate": number,
  "items": [ { "description": string, "quantity": number, "unitPrice": number, "model": string, "unit": string, "serialNumber": string, "remarks": string } ],
  "extra": { "vehicle": string, "driver": string, "deliveryAddress": string, "validUntil": "YYYY-MM-DD" or null }
}

Known clients: ${JSON.stringify(clients.map((c) => ({ name: c.name, address: c.address, email: c.email, phone: c.phone })))}
Known products: ${JSON.stringify(products.map((p) => ({ name: p.name, unitPrice: p.unitPrice, unit: p.unit })))}

Rules:
- Match known client/product names when mentioned.
- Today is ${new Date().toISOString().slice(0, 10)}.
- ${isWaybill ? "For WAYBILL, set unitPrice=0. Fill extra.vehicle, extra.driver, extra.deliveryAddress. For each item populate model (part number), unit (pcs/kg/etc), serialNumber, and remarks when mentioned; use empty string when unknown." : "Default taxRate is 0 unless specified. For non-waybill items, leave model/unit/serialNumber/remarks as empty strings."}
- ${type === "QUOTATION" ? "For QUOTATION, put the 'valid until' date in dueDate." : ""}
- Always include all fields; use empty string or null when unknown.`;
  }

  try {
    const draft = await llmJson(system, prompt);
    return NextResponse.json({ draft });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
