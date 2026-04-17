import { z } from "zod";

export const ItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative().default(0),
  model: z.string().optional().default(""),
  unit: z.string().optional().default(""),
  serialNumber: z.string().optional().default(""),
  remarks: z.string().optional().default("")
});

export const DocumentDraftSchema = z.object({
  type: z.enum(["INVOICE", "QUOTATION", "WAYBILL", "LETTER"]),
  clientName: z.string().min(1),
  clientAddress: z.string().optional().default(""),
  clientEmail: z.string().optional().default(""),
  clientPhone: z.string().optional().default(""),
  issueDate: z.string(),
  dueDate: z.string().optional().nullable(),
  notes: z.string().optional().default(""),
  taxRate: z.number().min(0).max(100).default(0),
  items: z.array(ItemSchema).default([]),
  extra: z
    .object({
      vehicle: z.string().optional().default(""),
      driver: z.string().optional().default(""),
      deliveryAddress: z.string().optional().default(""),
      validUntil: z.string().optional().nullable(),
      itemsHeading: z.string().optional().default(""),
      subject: z.string().optional().default(""),
      body: z.string().optional().default(""),
      closing: z.string().optional().default("Yours sincerely"),
      recipientTitle: z.string().optional().default("")
    })
    .optional()
});

export type DocumentDraft = z.infer<typeof DocumentDraftSchema>;
export type DocType = "INVOICE" | "QUOTATION" | "WAYBILL" | "LETTER";

export const TYPE_TITLES: Record<DocType, string> = {
  INVOICE: "Invoice",
  QUOTATION: "Quotation",
  WAYBILL: "Waybill",
  LETTER: "Letter"
};

export const TYPE_PATHS: Record<DocType, string> = {
  INVOICE: "invoices",
  QUOTATION: "quotations",
  WAYBILL: "waybills",
  LETTER: "letters"
};
