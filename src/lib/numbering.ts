import { prisma } from "./prisma";
import { DocumentType } from "@prisma/client";

const prefix: Record<DocumentType, string> = {
  QUOTATION: "QT",
  INVOICE: "INV",
  WAYBILL: "WB",
  LETTER: "LTR"
};

export async function nextDocumentNumber(type: DocumentType): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.document.count({ where: { type } });
  const seq = String(count + 1).padStart(4, "0");
  return `${prefix[type]}-${year}-${seq}`;
}
