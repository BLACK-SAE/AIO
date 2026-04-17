"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Save, Loader2 } from "lucide-react";

type LetterExtra = {
  subject: string;
  body: string;
  closing: string;
  recipientTitle: string;
};

type LetterDraft = {
  type: "LETTER";
  clientName: string;
  clientAddress: string;
  clientEmail: string;
  clientPhone: string;
  issueDate: string;
  dueDate: null;
  notes: string;
  taxRate: 0;
  items: [];
  extra: LetterExtra;
};

const initialDraft: LetterDraft = {
  type: "LETTER",
  clientName: "",
  clientAddress: "",
  clientEmail: "",
  clientPhone: "",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: null,
  notes: "",
  taxRate: 0,
  items: [],
  extra: { subject: "", body: "", closing: "Yours sincerely", recipientTitle: "Dear Sir/Madam" }
};

export default function LetterForm() {
  const r = useRouter();
  const [draft, setDraft] = useState<LetterDraft>(initialDraft);
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string | null; phone: string | null; address: string | null }>>([]);
  useEffect(() => { fetch("/api/clients").then((r) => r.json()).then(setClients).catch(() => {}); }, []);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function askAi() {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/assist", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, docType: "LETTER" })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.toString() || "AI failed");
      setDraft({ ...initialDraft, ...j.draft, type: "LETTER", items: [], taxRate: 0, dueDate: null });
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

  const upd = (patch: Partial<LetterDraft>) => setDraft({ ...draft, ...patch });
  const updExtra = (patch: Partial<LetterExtra>) => upd({ extra: { ...draft.extra, ...patch } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Letter</h1>
        <p className="text-muted-foreground text-sm">Describe the letter and let AI draft it, or write it manually.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit lg:sticky lg:top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Assistant</CardTitle>
            <CardDescription>Describe what the letter should say.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)}
              placeholder={`e.g. "Write a letter to Acme Ltd requesting payment for outstanding invoice INV-2026-0012, amount ₦450,000, due 30 days ago"`} />
            <Button onClick={askAi} disabled={loading || !prompt} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting...</> : <><Sparkles className="h-4 w-4" /> Draft with AI</>}
            </Button>
            {err && <p className="text-destructive text-xs">{err}</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-5">
            {clients.length > 0 && (
              <F l="Select Existing Recipient (optional)">
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value=""
                  onChange={(e) => {
                    const c = clients.find((x) => x.id === e.target.value);
                    if (c) upd({ clientName: c.name, clientEmail: c.email || "", clientPhone: c.phone || "", clientAddress: c.address || "" });
                  }}
                >
                  <option value="">— Pick a recipient —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </F>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <F l="Recipient Name"><Input value={draft.clientName} onChange={(e) => upd({ clientName: e.target.value })} /></F>
              <F l="Recipient Email"><Input value={draft.clientEmail} onChange={(e) => upd({ clientEmail: e.target.value })} /></F>
              <F l="Recipient Phone"><Input value={draft.clientPhone} onChange={(e) => upd({ clientPhone: e.target.value })} /></F>
              <F l="Recipient Address"><Input value={draft.clientAddress} onChange={(e) => upd({ clientAddress: e.target.value })} /></F>
              <F l="Date"><Input type="date" value={draft.issueDate} onChange={(e) => upd({ issueDate: e.target.value })} /></F>
              <F l="Closing"><Input value={draft.extra.closing} onChange={(e) => updExtra({ closing: e.target.value })} placeholder="e.g. Yours sincerely" /></F>
            </div>

            <F l="Salutation">
              <Input value={draft.extra.recipientTitle} onChange={(e) => updExtra({ recipientTitle: e.target.value })} placeholder="e.g. Dear Mr. Smith" />
            </F>

            <F l="Subject">
              <Input value={draft.extra.subject} onChange={(e) => updExtra({ subject: e.target.value })} placeholder="Letter subject line" />
            </F>

            <F l="Letter Body">
              <Textarea rows={14} value={draft.extra.body} onChange={(e) => updExtra({ body: e.target.value })}
                placeholder="Write or let AI draft the letter content..." className="font-serif text-sm leading-relaxed" />
            </F>

            {err && <p className="text-destructive text-xs">{err}</p>}

            <div className="flex justify-end pt-2">
              <Button onClick={save} disabled={saving || !draft.clientName || !draft.extra.body} size="lg">
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
