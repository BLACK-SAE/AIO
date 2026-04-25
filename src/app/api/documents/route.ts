import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DocumentDraftSchema } from "@/lib/types";
import { nextDocumentNumber } from "@/lib/numbering";
import { getActiveCompany } from "@/lib/activeCompany";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = DocumentDraftSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const company = await getActiveCompany();
  if (!company) return NextResponse.json({ error: "No active company. Set one up in Settings." }, { status: 400 });

  let client = await prisma.client.findFirst({ where: { name: d.clientName } });
  if (!client) {
    client = await prisma.client.create({
      data: { name: d.clientName, address: d.clientAddress, email: d.clientEmail, phone: d.clientPhone }
    });
  }

  const isWaybill = d.type === "WAYBILL";
  const isLetter = d.type === "LETTER";
  const noFinancials = isWaybill || isLetter;
  const subtotal = noFinancials ? 0 : d.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = noFinancials ? 0 : (subtotal * d.taxRate) / 100;
  const total = subtotal + taxAmount;
  const number = await nextDocumentNumber(d.type);

  const doc = await prisma.document.create({
    data: {
      number,
      type: d.type,
      status: "ISSUED",
      clientId: client.id,
      companyId: company.id,
      issueDate: new Date(d.issueDate),
      dueDate: d.dueDate ? new Date(d.dueDate) : null,
      notes: d.notes,
      subtotal,
      taxRate: noFinancials ? 0 : d.taxRate,
      taxAmount,
      total,
      data: d.extra || {},
      ...(d.items.length > 0 ? {
        items: {
          create: d.items.map((it, idx) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            amount: it.quantity * it.unitPrice,
            model: it.model || null,
            unit: it.unit || null,
            serialNumber: it.serialNumber || null,
            remarks: it.remarks || null,
            position: idx
          }))
        }
      } : {})
    }
  });

  return NextResponse.json({ id: doc.id, number: doc.number });
}
