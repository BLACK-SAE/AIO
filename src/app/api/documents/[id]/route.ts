import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DocumentDraftSchema } from "@/lib/types";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { client: true, items: { orderBy: { position: "asc" } } }
  });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = DocumentDraftSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;

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

    const updated = await prisma.$transaction(async (tx) => {
      await tx.documentItem.deleteMany({ where: { documentId: id } });
      return tx.document.update({
        where: { id },
        data: {
          clientId: client!.id,
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
    });

    return NextResponse.json({ id: updated.id });
  } catch (e: any) {
    console.error("PATCH /api/documents/[id] error:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
