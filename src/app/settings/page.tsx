import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function save(formData: FormData) {
  "use server";
  const name = String(formData.get("name") || "");
  const address = String(formData.get("address") || "");
  const phone = String(formData.get("phone") || "");
  const email = String(formData.get("email") || "");
  const website = String(formData.get("website") || "");
  const taxId = String(formData.get("taxId") || "");
  const bankDetails = String(formData.get("bankDetails") || "");
  const currency = String(formData.get("currency") || "NGN");
  const logo = formData.get("logo") as File | null;
  const letterhead = formData.get("letterhead") as File | null;

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  let logoPath: string | undefined;
  let letterheadPath: string | undefined;

  if (logo && logo.size > 0) {
    const ext = logo.name.split(".").pop() || "png";
    const fname = `logo-${Date.now()}.${ext}`;
    await writeFile(path.join(uploadDir, fname), Buffer.from(await logo.arrayBuffer()));
    logoPath = `/uploads/${fname}`;
  }
  if (letterhead && letterhead.size > 0) {
    const ext = letterhead.name.split(".").pop() || "png";
    const fname = `letterhead-${Date.now()}.${ext}`;
    await writeFile(path.join(uploadDir, fname), Buffer.from(await letterhead.arrayBuffer()));
    letterheadPath = `/uploads/${fname}`;
  }

  await prisma.companySettings.upsert({
    where: { id: 1 },
    update: { name, address, phone, email, website, taxId, bankDetails, currency, ...(logoPath && { logoPath }), ...(letterheadPath && { letterheadPath }) },
    create: { id: 1, name, address, phone, email, website, taxId, bankDetails, currency, logoPath, letterheadPath }
  });
  revalidatePath("/settings");
}

export default async function Settings() {
  const c = await prisma.companySettings.findUnique({ where: { id: 1 } });
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground text-sm">These appear on every generated document.</p>
      </div>
      <form action={save}>
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
            <CardDescription>Logo & letterhead images</CardDescription>
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
          </CardContent>
        </Card>

        <div className="flex justify-end mt-4">
          <Button type="submit" size="lg">Save Settings</Button>
        </div>
      </form>
    </div>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">{l}</Label>{children}</div>;
}
