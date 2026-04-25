import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderDocumentPdf } from "@/lib/pdf/document";
import { getActiveCompany } from "@/lib/activeCompany";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const download = req.nextUrl.searchParams.get("download") === "1";
  const doc = await prisma.document.findUnique({
    where: { id },
    include: { client: true, items: { orderBy: { position: "asc" } } , company: true }
  });
  if (!doc) return new Response("Not found", { status: 404 });
  // Use document's snapshotted company; fall back to active for legacy docs
  const company = doc.company ?? (await getActiveCompany());
  const buffer = await renderDocumentPdf(doc, company);
  const bytes = new Uint8Array(buffer);
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${doc.number}.pdf"`,
      "Cache-Control": "no-store"
    }
  });
}
