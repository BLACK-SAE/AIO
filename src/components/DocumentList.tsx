import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, FileDown } from "lucide-react";

export async function DocumentList({ type, newPath, title }: { type: "INVOICE" | "QUOTATION" | "WAYBILL" | "LETTER"; newPath: string; title: string }) {
  const docs = await prisma.document.findMany({
    where: { type }, orderBy: { createdAt: "desc" }, include: { client: true }
  });
  const showTotal = type !== "WAYBILL" && type !== "LETTER";
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{docs.length} {docs.length === 1 ? "record" : "records"}</p>
        </div>
        <Button asChild><Link href={newPath}><Plus className="h-4 w-4" /> New</Link></Button>
      </div>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              {showTotal && <TableHead className="text-right">Total</TableHead>}
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-mono text-xs">{d.number}</TableCell>
                <TableCell>{d.client?.name}</TableCell>
                <TableCell>{d.issueDate.toISOString().slice(0, 10)}</TableCell>
                {showTotal && <TableCell className="text-right">{Number(d.total).toLocaleString()}</TableCell>}
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm"><Link href={`/documents/${d.id}`}><Pencil className="h-3 w-3" /> Edit</Link></Button>
                  <Button asChild variant="ghost" size="sm"><a href={`/api/documents/${d.id}/pdf?download=1`}><FileDown className="h-3 w-3" /> PDF</a></Button>
                </TableCell>
              </TableRow>
            ))}
            {docs.length === 0 && (
              <TableRow><TableCell colSpan={showTotal ? 5 : 4} className="text-center text-muted-foreground py-8">None yet.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
