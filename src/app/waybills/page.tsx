import { DocumentList } from "@/components/DocumentList";
export const dynamic = "force-dynamic";
export default function Page() {
  return <DocumentList type="WAYBILL" newPath="/waybills/new" title="Waybills" />;
}
