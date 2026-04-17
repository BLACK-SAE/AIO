import { DocumentList } from "@/components/DocumentList";
export const dynamic = "force-dynamic";
export default function Page() {
  return <DocumentList type="LETTER" newPath="/letters/new" title="Letters" />;
}
