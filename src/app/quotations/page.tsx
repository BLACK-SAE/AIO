import { DocumentList } from "@/components/DocumentList";
export const dynamic = "force-dynamic";
export default function Page() {
  return <DocumentList type="QUOTATION" newPath="/quotations/new" title="Quotations" />;
}
