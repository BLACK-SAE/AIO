import { cookies } from "next/headers";
import { prisma } from "./prisma";

const COOKIE = "aio_active_company";

export async function getActiveCompany() {
  const jar = await cookies();
  const id = jar.get(COOKIE)?.value;

  if (id) {
    const c = await prisma.company.findUnique({ where: { id } });
    if (c) return c;
  }
  // Fallback: any company marked active
  const active = await prisma.company.findFirst({ where: { isActive: true } });
  if (active) return active;
  // Final fallback: most recently created
  return prisma.company.findFirst({ orderBy: { createdAt: "desc" } });
}

export async function setActiveCompanyCookie(id: string) {
  const jar = await cookies();
  jar.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}
