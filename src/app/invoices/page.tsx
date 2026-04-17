import { DocumentList } from "@/components/DocumentList";
export const dynamic = "force-dynamic";
export default function Page() {
  return <DocumentList type="INVOICE" newPath="/invoices/new" title="Invoices" />;
}
