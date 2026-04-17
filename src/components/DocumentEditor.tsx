"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Loader2, Download, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Item = { description: string; quantity: number; unitPrice: number; model?: string; unit?: string; serialNumber?: string; remarks?: string };
type Extra = { vehicle?: string; driver?: string; deliveryAddress?: string; validUntil?: string | null; itemsHeading?: string; subject?: string; body?: string; closing?: string; recipientTitle?: string };
type Draft = {
  type: "INVOICE" | "QUOTATION" | "WAYBILL" | "LETTER";
  clientName: string; clientAddress: string; clientEmail: string; clientPhone: string;
  issueDate: string; dueDate: string | null; notes: string; taxRate: number;
  items: Item[]; extra: Extra;
};

export default function DocumentEditor({
  docId, number, initial, listPath
}: { docId: string; number: string; initial: Draft; listPath: string }) {
  const r = useRouter();
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pdfKey, setPdfKey] = useState(0);

  const isWaybill = draft.type === "WAYBILL";
  const isQuotation = draft.type === "QUOTATION";
  const isLetter = draft.type === "LETTER";
  const showFinancials = !isWaybill && !isLetter;
  const subtotal = draft.items.reduce((s, i) => s + (+i.quantity || 0) * (+i.unitPrice || 0), 0);
  const tax = (subtotal * (+draft.taxRate || 0)) / 100;
  const total = subtotal + tax;

  async function save() {
    setSaving(true); setErr(null);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });
      const text = await res.text();
      if (!text) throw new Error("Server returned empty response");
      const j = JSON.parse(text);
      if (!res.ok) throw new Error(JSON.stringify(j.error));
      setPdfKey((k) => k + 1);
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  }

  async function del() {
    if (!confirm("Delete this document?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/documents/${docId}`, { method: "DELETE" });
      r.push(listPath);
    } catch (e: any) { setErr(e.message); setDeleting(false); }
  }

  const upd = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const updExtra = (patch: Partial<Extra>) => upd({ extra: { ...draft.extra, ...patch } });
  const updItem = (i: number, patch: Partial<Item>) => {
    const items = [...draft.items]; items[i] = { ...items[i], ...patch }; upd({ items });
  };

  const title = draft.type.charAt(0) + draft.type.slice(1).toLowerCase();
  const pdfUrl = `/api/documents/${docId}/pdf?v=${pdfKey}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon"><Link href={listPath}><ArrowLeft className="h-4 w-4" /></Link></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title} {number}</h1>
            <p className="text-muted-foreground text-sm">Edit and regenerate the PDF</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={async () => {
            const res = await fetch(`/api/documents/${docId}/pdf?download=1&v=${pdfKey}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = `${number}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }}><Download className="h-4 w-4" /> Download PDF</Button>
          <Button variant="destructive" onClick={del} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Edit {title}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F l={isLetter ? "Recipient Name" : "Client Name"}><Input value={draft.clientName} onChange={(e) => upd({ clientName: e.target.value })} /></F>
              <F l={isLetter ? "Recipient Email" : "Client Email"}><Input value={draft.clientEmail} onChange={(e) => upd({ clientEmail: e.target.value })} /></F>
              <F l={isLetter ? "Recipient Phone" : "Client Phone"}><Input value={draft.clientPhone} onChange={(e) => upd({ clientPhone: e.target.value })} /></F>
              <F l={isLetter ? "Recipient Address" : "Client Address"}><Input value={draft.clientAddress} onChange={(e) => upd({ clientAddress: e.target.value })} /></F>
              <F l={isLetter ? "Date" : "Issue Date"}><Input type="date" value={draft.issueDate} onChange={(e) => upd({ issueDate: e.target.value })} /></F>
              {showFinancials && <F l={isQuotation ? "Valid Until" : "Due Date"}><Input type="date" value={draft.dueDate || ""} onChange={(e) => upd({ dueDate: e.target.value || null })} /></F>}
              {showFinancials && <F l="Tax Rate %"><Input type="number" value={draft.taxRate} onChange={(e) => upd({ taxRate: +e.target.value })} /></F>}
              {isWaybill && <F l="Delivery Address"><Input value={draft.extra.deliveryAddress || ""} onChange={(e) => updExtra({ deliveryAddress: e.target.value })} /></F>}
              {isWaybill && <F l="Vehicle"><Input value={draft.extra.vehicle || ""} onChange={(e) => updExtra({ vehicle: e.target.value })} /></F>}
              {isWaybill && <F l="Driver"><Input value={draft.extra.driver || ""} onChange={(e) => updExtra({ driver: e.target.value })} /></F>}
              {isLetter && <F l="Closing"><Input value={draft.extra.closing || ""} onChange={(e) => updExtra({ closing: e.target.value })} /></F>}
            </div>

            {isLetter ? (
              <>
                <F l="Salutation">
                  <Input value={draft.extra.recipientTitle || ""} onChange={(e) => updExtra({ recipientTitle: e.target.value })} placeholder="e.g. Dear Mr. Smith" />
                </F>
                <F l="Subject">
                  <Input value={draft.extra.subject || ""} onChange={(e) => updExtra({ subject: e.target.value })} placeholder="Letter subject line" />
                </F>
                <F l="Letter Body">
                  <Textarea rows={12} value={draft.extra.body || ""} onChange={(e) => updExtra({ body: e.target.value })}
                    className="font-serif text-sm leading-relaxed" />
                </F>
              </>
            ) : (
              <>
                {!isLetter && (
                  <F l="Items Section Heading (optional)">
                    <Input placeholder="e.g. Quotation for items requested" value={draft.extra.itemsHeading || ""} onChange={(e) => updExtra({ itemsHeading: e.target.value })} />
                  </F>
                )}

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <Label>Items</Label>
                    <Button variant="outline" size="sm" onClick={() => upd({ items: [...draft.items, { description: "", quantity: 1, unitPrice: 0, model: "", unit: "", serialNumber: "", remarks: "" }] })}>
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {isWaybill ? (
                      draft.items.map((it, i) => (
                        <div key={i} className="border rounded-md p-3 space-y-2 bg-muted/30">
                          <div className="flex justify-between items-center">
                            <Label className="text-xs">Item {i + 1}</Label>
                            <Button variant="ghost" size="icon" onClick={() => upd({ items: draft.items.filter((_, j) => j !== i) })}>
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-12"><Input placeholder="Description" value={it.description} onChange={(e) => updItem(i, { description: e.target.value })} /></div>
                            <div className="col-span-6"><Input placeholder="Model / Part #" value={it.model || ""} onChange={(e) => updItem(i, { model: e.target.value })} /></div>
                            <div className="col-span-6"><Input placeholder="Serial Number" value={it.serialNumber || ""} onChange={(e) => updItem(i, { serialNumber: e.target.value })} /></div>
                            <div className="col-span-4"><Input type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updItem(i, { quantity: +e.target.value })} /></div>
                            <div className="col-span-4"><Input placeholder="Unit" value={it.unit || ""} onChange={(e) => updItem(i, { unit: e.target.value })} /></div>
                            <div className="col-span-4"><Input placeholder="Remarks" value={it.remarks || ""} onChange={(e) => updItem(i, { remarks: e.target.value })} /></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      draft.items.map((it, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center">
                          <Input className="col-span-5" placeholder="Description" value={it.description} onChange={(e) => updItem(i, { description: e.target.value })} />
                          <Input className="col-span-2" type="number" placeholder="Qty" value={it.quantity} onChange={(e) => updItem(i, { quantity: +e.target.value })} />
                          <Input className="col-span-2" type="number" placeholder="Price" value={it.unitPrice} onChange={(e) => updItem(i, { unitPrice: +e.target.value })} />
                          <div className="col-span-2 text-right text-sm">{(it.quantity * it.unitPrice || 0).toLocaleString()}</div>
                          <Button className="col-span-1" variant="ghost" size="icon" onClick={() => upd({ items: draft.items.filter((_, j) => j !== i) })}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}

            <F l="Notes"><Textarea rows={3} value={draft.notes} onChange={(e) => upd({ notes: e.target.value })} /></F>

            {showFinancials && (
              <div className="flex justify-end">
                <div className="w-72 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between"><span>Tax ({draft.taxRate}%)</span><span>{tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2 text-base"><span>Total</span><span>{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                </div>
              </div>
            )}

            {err && <p className="text-destructive text-xs">{err}</p>}

            <Button onClick={save} disabled={saving} size="lg" className="w-full">
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save Changes</>}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> PDF Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe key={pdfKey} src={pdfUrl} className="w-full h-[800px] border rounded-md bg-white" title="PDF preview" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{l}</Label>{children}</div>;
}
