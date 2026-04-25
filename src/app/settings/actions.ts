"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { put } from "@vercel/blob";
import { setActiveCompanyCookie } from "@/lib/activeCompany";

async function uploadIfPresent(file: File | null, prefix: string): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  const ext = file.name.split(".").pop() || "png";
  const fname = `${prefix}-${Date.now()}.${ext}`;
  const blob = await put(fname, file, { access: "public", addRandomSuffix: false });
  return blob.url;
}

export async function saveCompany(formData: FormData) {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "");
  const address = String(formData.get("address") || "");
  const phone = String(formData.get("phone") || "");
  const email = String(formData.get("email") || "");
  const website = String(formData.get("website") || "");
  const taxId = String(formData.get("taxId") || "");
  const bankDetails = String(formData.get("bankDetails") || "");
  const currency = String(formData.get("currency") || "NGN");

  const logoPath = await uploadIfPresent(formData.get("logo") as File | null, "logo");
  const letterheadPath = await uploadIfPresent(formData.get("letterhead") as File | null, "letterhead");
  const signaturePath = await uploadIfPresent(formData.get("signature") as File | null, "signature");

  if (id) {
    await prisma.company.update({
      where: { id },
      data: {
        name, address, phone, email, website, taxId, bankDetails, currency,
        ...(logoPath && { logoPath }),
        ...(letterheadPath && { letterheadPath }),
        ...(signaturePath && { signaturePath })
      }
    });
  } else {
    const created = await prisma.company.create({
      data: { name, address, phone, email, website, taxId, bankDetails, currency, logoPath, letterheadPath, signaturePath }
    });
    const count = await prisma.company.count();
    if (count === 1) {
      await prisma.company.update({ where: { id: created.id }, data: { isActive: true } });
      await setActiveCompanyCookie(created.id);
    }
  }
  revalidatePath("/settings");
  redirect("/settings");
}

export async function setActive(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.$transaction([
    prisma.company.updateMany({ data: { isActive: false } }),
    prisma.company.update({ where: { id }, data: { isActive: true } })
  ]);
  await setActiveCompanyCookie(id);
  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/settings");
}

export async function deleteCompany(formData: FormData) {
  const id = String(formData.get("id"));
  await prisma.company.delete({ where: { id } });
  revalidatePath("/settings");
  redirect("/settings");
}
