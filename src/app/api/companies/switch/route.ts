import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setActiveCompanyCookie } from "@/lib/activeCompany";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { id } = await req.json();
  const c = await prisma.company.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await setActiveCompanyCookie(id);
  return NextResponse.json({ ok: true, name: c.name });
}
