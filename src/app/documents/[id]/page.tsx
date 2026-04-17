import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DocumentEditor from "@/components/DocumentEditor";
import { TYPE_PATHS } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { client: true, items: { orderBy: { position: "asc" } } }
  });
  if (!doc) return notFound();

  const initial = {
    type: doc.type as "INVOICE" | "QUOTATION" | "WAYBILL" | "LETTER",
    clientName: doc.client?.name || "",
    clientAddress: doc.client?.address || "",
    clientEmail: doc.client?.email || "",
    clientPhone: doc.client?.phone || "",
    issueDate: doc.issueDate.toISOString().slice(0, 10),
    dueDate: doc.dueDate ? doc.dueDate.toISOString().slice(0, 10) : null,
    notes: doc.notes || "",
    taxRate: Number(doc.taxRate),
    items: doc.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
      model: i.model || "",
      unit: i.unit || "",
      serialNumber: i.serialNumber || "",
      remarks: i.remarks || ""
    })),
    extra: { vehicle: "", driver: "", deliveryAddress: "", validUntil: null, itemsHeading: "", subject: "", body: "", closing: "Yours sincerely", recipientTitle: "", ...((doc.data as any) || {}) }
  };

  const listPath = "/" + TYPE_PATHS[doc.type];

  return <DocumentEditor docId={doc.id} number={doc.number} initial={initial} listPath={listPath} />;
}
