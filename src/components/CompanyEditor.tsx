import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import OffsetSlider from "@/components/OffsetSlider";
import RemovableImage from "@/components/RemovableImage";

type Company = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  bankDetails: string | null;
  currency: string;
  logoPath: string | null;
  letterheadPath: string | null;
  letterheadOffset: number;
  signaturePath: string | null;
  invoiceTemplate: string;
};

export default function CompanyEditor({
  company,
  action
}: {
  company: Company | null;
  action: (formData: FormData) => Promise<void>;
}) {
  const c = company;
  return (
    <form action={action}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Identity and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <F l="Company Name"><Input name="name" defaultValue={c?.name || ""} required /></F>
          <F l="Address"><Textarea name="address" defaultValue={c?.address || ""} rows={2} /></F>
          <div className="grid grid-cols-2 gap-4">
            <F l="Phone"><Input name="phone" defaultValue={c?.phone || ""} /></F>
            <F l="Email"><Input name="email" defaultValue={c?.email || ""} /></F>
            <F l="Website"><Input name="website" defaultValue={c?.website || ""} /></F>
            <F l="Tax ID"><Input name="taxId" defaultValue={c?.taxId || ""} /></F>
            <F l="Currency"><Input name="currency" defaultValue={c?.currency || "NGN"} /></F>
          </div>
          <F l="Bank / Payment Details"><Textarea name="bankDetails" defaultValue={c?.bankDetails || ""} rows={3} /></F>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Invoice & Quotation Template</CardTitle>
          <CardDescription>Pick a visual style for invoices and quotations.</CardDescription>
        </CardHeader>
        <CardContent>
          <TemplatePicker name="invoiceTemplate" defaultValue={c?.invoiceTemplate || "modern"} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Logo, letterhead & signature images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <F l="Logo">
            <Input type="file" name="logo" accept="image/*" />
            {c?.logoPath && <RemovableImage src={c.logoPath} alt="logo" removeName="removeLogo" />}
          </F>
          <F l="Letterhead">
            <Input type="file" name="letterhead" accept="image/*" />
            {c?.letterheadPath && <RemovableImage src={c.letterheadPath} alt="letterhead" removeName="removeLetterhead" />}
          </F>
          <F l="Letterhead Top Offset">
            <OffsetSlider name="letterheadOffset" defaultValue={c?.letterheadOffset || 0} />
          </F>
          <F l="Signature (for letters)">
            <Input type="file" name="signature" accept="image/*" />
            {c?.signaturePath && <RemovableImage src={c.signaturePath} alt="signature" removeName="removeSignature" />}
          </F>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-4">
        <Button type="submit" size="lg">{c ? "Save Changes" : "Create Company"}</Button>
      </div>
    </form>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{l}</Label>{children}</div>;
}

function TemplatePicker({ name, defaultValue }: { name: string; defaultValue: string }) {
  const templates = [
    { id: "modern", title: "Modern", desc: "Dark navy header, alternating rows, bold totals bar." },
    { id: "classic", title: "Classic", desc: "Conservative double rules, gray accents, traditional invoice look." },
    { id: "minimal", title: "Minimal", desc: "Lots of white space, light typography, subtle separators." },
    { id: "elegant", title: "Elegant", desc: "Green accent, serif title, project bar, signature block." }
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {templates.map((t) => (
        <label
          key={t.id}
          className="cursor-pointer relative border rounded-lg p-3 hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:ring-2 has-[:checked]:ring-primary/30"
        >
          <input
            type="radio"
            name={name}
            value={t.id}
            defaultChecked={defaultValue === t.id}
            className="absolute top-3 right-3 accent-primary"
          />
          <TemplatePreview kind={t.id as "modern" | "classic" | "minimal"} />
          <div className="font-medium text-sm">{t.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
        </label>
      ))}
    </div>
  );
}

function TemplatePreview({ kind }: { kind: "modern" | "classic" | "minimal" | "elegant" }) {
  if (kind === "elegant") {
    return (
      <div className="aspect-[4/3] bg-white border rounded mb-3 p-2 overflow-hidden">
        <div className="flex justify-between items-start mb-1">
          <div className="w-7 h-2.5 bg-muted rounded-sm" />
          <div className="text-[6px] font-bold tracking-[0.15em] bg-[#e7f0e9] text-[#2d6e3e] px-1 rounded-sm">OFFICIAL</div>
        </div>
        <div className="h-px bg-[#2d6e3e] mb-1" />
        <div className="text-[8px] font-bold leading-tight" style={{ fontFamily: "Georgia, serif" }}>
          <span className="text-black">Quotation for</span>
          <span className="text-[#2d6e3e] block">Services</span>
        </div>
        <div className="bg-[#eef4ef] border-l-2 border-[#2d6e3e] pl-1 py-0.5 my-1 text-[5px]">
          <div className="text-[#2d6e3e] font-bold">BILL TO</div>
          <div className="font-bold">Client</div>
        </div>
        <div className="h-2 bg-black mb-1" />
        <div className="bg-[#eef4ef] h-1.5 mb-px" />
        <div className="h-px bg-gray-200" />
        <div className="h-1.5 mb-px" />
        <div className="h-px bg-gray-200" />
        <div className="h-1.5" />
        <div className="bg-black h-2 mt-1" />
      </div>
    );
  }
  if (kind === "modern") {
    return (
      <div className="aspect-[4/3] bg-white border rounded mb-3 p-2 overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div className="w-8 h-3 bg-muted rounded-sm" />
          <div className="text-[8px] font-bold tracking-widest">QUOTATION</div>
        </div>
        <div className="h-[8px] bg-[#1a1a2e] mb-1" />
        <div className="h-[4px] bg-[#fafafa] mb-0.5" />
        <div className="h-[4px] bg-white mb-0.5 border-b border-muted/30" />
        <div className="h-[4px] bg-[#fafafa] mb-0.5" />
        <div className="h-[4px] bg-white mb-2 border-b border-muted/30" />
        <div className="flex justify-end">
          <div className="bg-[#1a1a2e] h-3 w-12 rounded-sm" />
        </div>
      </div>
    );
  }
  if (kind === "classic") {
    return (
      <div className="aspect-[4/3] bg-white border rounded mb-3 p-2 overflow-hidden">
        <div className="flex justify-between items-start mb-1">
          <div className="w-8 h-3 bg-muted rounded-sm" />
          <div className="text-[8px] font-bold tracking-[0.2em]">QUOTATION</div>
        </div>
        <div className="h-px bg-gray-700 mb-px" />
        <div className="h-px bg-gray-700 mb-2" />
        <div className="text-[6px] font-bold text-gray-700 tracking-widest mb-1">DESCRIPTION</div>
        <div className="h-px bg-gray-700 mb-1" />
        <div className="h-[3px] mb-1 border-b border-gray-200" />
        <div className="h-[3px] mb-1 border-b border-gray-200" />
        <div className="h-[3px] mb-2 border-b border-gray-700" />
        <div className="flex justify-end">
          <div className="text-[7px] font-bold border-y-2 border-double border-gray-700 px-2">TOTAL</div>
        </div>
      </div>
    );
  }
  return (
    <div className="aspect-[4/3] bg-white border rounded mb-3 p-2 overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <div className="w-7 h-2.5 bg-muted rounded-sm" />
        <div className="text-[10px] font-light tracking-[0.3em] text-gray-300">QUOTATION</div>
      </div>
      <div className="text-[5px] tracking-widest text-gray-400 mb-0.5">DESCRIPTION</div>
      <div className="h-px bg-gray-900 mb-1" />
      <div className="h-[3px] mb-px" />
      <div className="h-px bg-gray-100" />
      <div className="h-[3px] mb-px" />
      <div className="h-px bg-gray-100" />
      <div className="h-[3px]" />
      <div className="h-px bg-gray-900 mt-1 mb-2" />
      <div className="flex justify-end items-baseline gap-1">
        <div className="text-[6px] tracking-widest text-gray-400">TOTAL</div>
        <div className="text-[10px] font-bold">$</div>
      </div>
    </div>
  );
}
