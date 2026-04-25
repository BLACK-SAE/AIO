import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import OffsetSlider from "@/components/OffsetSlider";

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
          <CardTitle>Branding</CardTitle>
          <CardDescription>Logo, letterhead & signature images</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <F l="Logo">
            <Input type="file" name="logo" accept="image/*" />
            {c?.logoPath && <img src={c.logoPath} alt="logo" className="h-20 mt-2 border rounded p-1 bg-white" />}
          </F>
          <F l="Letterhead">
            <Input type="file" name="letterhead" accept="image/*" />
            {c?.letterheadPath && <img src={c.letterheadPath} alt="letterhead" className="h-20 mt-2 border rounded p-1 bg-white" />}
          </F>
          <F l="Letterhead Top Offset">
            <OffsetSlider name="letterheadOffset" defaultValue={c?.letterheadOffset || 0} />
          </F>
          <F l="Signature (for letters)">
            <Input type="file" name="signature" accept="image/*" />
            {c?.signaturePath && <img src={c.signaturePath} alt="signature" className="h-20 mt-2 border rounded p-1 bg-white" />}
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
