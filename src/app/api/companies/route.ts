import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, isActive: true }
  });
  return NextResponse.json(companies);
}
