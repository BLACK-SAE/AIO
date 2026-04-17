"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Plus, Trash2, Save, Loader2 } from "lucide-react";

type Item = { description: string; quantity: number; unitPrice: number; model?: string; unit?: string; serialNumber?: string; remarks?: string };
type Extra = { vehicle?: string; driver?: string; deliveryAddress?: string; validUntil?: string | null; itemsHeading?: string };
type Draft = {
  type: "INVOICE" | "QUOTATION" | "WAYBILL";
  clientName: string; clientAddress: string; clientEmail: string; clientPhone: string;
  issueDate: string; dueDate: string | null; notes: string; taxRate: number;
  items: Item[]; extra: Extra;
};

export default function DocumentForm({ type, listPath }: { type: Draft["type"]; listPath: string }) {
  const r = useRouter();
  const initial: Draft = {
    type,
    clientName: "", clientAddress: "", clientEmail: "", clientPhone: "",
    issueDate: new Date().toISOString().slice(0, 10), dueDate: null, notes: "",
    taxRate: 0, items: [{ description: "", quantity: 1, unitPrice: 0, model: "", unit: "", serialNumber: "", remarks: "" }],
    extra: { vehicle: "", driver: "", deliveryAddress: "", validUntil: null, itemsHeading: "" }
  };
  const [draft, setDraft] = useState<Draft>(initial);
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string | null; phone: string | null; address: string | null }>>([]);
  useEffect(() => { fetch("/api/clients").then((r) => r.json()).then(setClients).catch(() => {}); }, []);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isWaybill = type === "WAYBILL";
  const isQuotation = type === "QUOTATION";
  const subtotal = draft.items.reduce((s, i) => s + (+i.quantity || 0) * (+i.unitPrice || 0), 0);
  const tax = (subtotal * (+draft.taxRate || 0)) / 100;
  const total = subtotal + tax;

  async function askAi() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/assist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, docType: type })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.toString() || "AI failed");
      setDraft({ ...initial, ...j.draft, type });
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  }

  async function save() {
    setSaving(true); setErr(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });
      const j = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(j.error));
      r.push(`/documents/${j.id}`);
    } catch (e: any) { setErr(e.message); } finally { setSaving(false); }
  }

  const upd = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const updExtra = (patch: Partial<Extra>) => upd({ extra: { ...draft.extra, ...patch } });
  const updItem = (i: number, patch: Partial<Item>) => {
    const items = [...draft.items]; items[i] = { ...items[i], ...patch }; upd({ items });
  };

  const title = type.charAt(0) + type.slice(1).toLowerCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New {title}</h1>
        <p className="text-muted-foreground text-sm">Draft with AI or fill manually.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Assistant</CardTitle>
            <CardDescription>Describe the {title.toLowerCase()} in plain English.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g. "Invoice Acme Ltd, 10 bags of rice at 25000 each, 7.5% VAT, due in 14 days"`} />
            <Button onClick={askAi} disabled={loading || !prompt} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Thinking...</> : <><Sparkles className="h-4 w-4" /> Draft with AI</>}
            </Button>
            {err && <p className="text-destructive text-xs">{err}</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-5">
            {clients.length > 0 && (
              <F l="Select Existing Client (optional)">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value=""
                  onChange={(e) => {
                    const c = clients.find((x) => x.id === e.target.value);
                    if (c) upd({ clientName: c.name, clientEmail: c.email || "", clientPhone: c.phone || "", clientAddress: c.address || "" });
                  }}
                >
                  <option value="">— Pick a client —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </F>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F l="Client Name"><Input value={draft.clientName} onChange={(e) => upd({ clientName: e.target.value })} /></F>
              <F l="Client Email"><Input value={draft.clientEmail} onChange={(e) => upd({ clientEmail: e.target.value })} /></F>
              <F l="Client Phone"><Input value={draft.clientPhone} onChange={(e) => upd({ clientPhone: e.target.value })} /></F>
              <F l="Client Address"><Input value={draft.clientAddress} onChange={(e) => upd({ clientAddress: e.target.value })} /></F>
              <F l="Issue Date"><Input type="date" value={draft.issueDate} onChange={(e) => upd({ issueDate: e.target.value })} /></F>
              {!isWaybill && <F l={isQuotation ? "Valid Until" : "Due Date"}><Input type="date" value={draft.dueDate || ""} onChange={(e) => upd({ dueDate: e.target.value || null })} /></F>}
              {!isWaybill && <F l="Tax Rate %"><Input type="number" value={draft.taxRate} onChange={(e) => upd({ taxRate: +e.target.value })} /></F>}
              {isWaybill && <F l="Delivery Address"><Input value={draft.extra.deliveryAddress || ""} onChange={(e) => updExtra({ deliveryAddress: e.target.value })} /></F>}
              {isWaybill && <F l="Vehicle"><Input value={draft.extra.vehicle || ""} onChange={(e) => updExtra({ vehicle: e.target.value })} /></F>}
              {isWaybill && <F l="Driver"><Input value={draft.extra.driver || ""} onChange={(e) => updExtra({ driver: e.target.value })} /></F>}
            </div>

            <F l="Items Section Heading (optional)">
              <Input placeholder="e.g. Quotation for items requested" value={draft.extra.itemsHeading || ""} onChange={(e) => updExtra({ itemsHeading: e.target.value })} />
            </F>

            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Items</Label>
                <Button variant="outline" size="sm" onClick={() => upd({ items: [...draft.items, { description: "", quantity: 1, unitPrice: 0, model: "", unit: "", serialNumber: "", remarks: "" }] })}>
                  <Plus className="h-3 w-3" /> Add Item
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
                        <div className="col-span-4"><Input placeholder="Unit (pc, kg)" value={it.unit || ""} onChange={(e) => updItem(i, { unit: e.target.value })} /></div>
                        <div className="col-span-4"><Input placeholder="Remarks" value={it.remarks || ""} onChange={(e) => updItem(i, { remarks: e.target.value })} /></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground px-1">
                      <div className="col-span-5">Description</div>
                      <div className="col-span-2">Qty</div>
                      <div className="col-span-2">Unit Price</div>
                      <div className="col-span-2 text-right">Amount</div>
                      <div className="col-span-1"></div>
                    </div>
                    {draft.items.map((it, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-center">
                        <Input className="col-span-5" value={it.description} onChange={(e) => updItem(i, { description: e.target.value })} />
                        <Input className="col-span-2" type="number" value={it.quantity} onChange={(e) => updItem(i, { quantity: +e.target.value })} />
                        <Input className="col-span-2" type="number" value={it.unitPrice} onChange={(e) => updItem(i, { unitPrice: +e.target.value })} />
                        <div className="col-span-2 text-right text-sm">{(it.quantity * it.unitPrice || 0).toLocaleString()}</div>
                        <Button className="col-span-1" variant="ghost" size="icon" onClick={() => upd({ items: draft.items.filter((_, j) => j !== i) })}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <F l="Notes"><Textarea rows={3} value={draft.notes} onChange={(e) => upd({ notes: e.target.value })} /></F>

            {!isWaybill && (
              <div className="flex justify-end">
                <div className="w-72 space-y-1 text-sm">
                  <Row l="Subtotal" v={subtotal} />
                  <Row l={`Tax (${draft.taxRate}%)`} v={tax} />
                  <Row l="Total" v={total} bold />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={saving} size="lg">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save & Generate PDF</>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{l}</Label>{children}</div>;
}
function Row({ l, v, bold }: { l: string; v: number; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "font-bold border-t pt-2 text-base" : ""}`}><span>{l}</span><span>{v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>;
}
