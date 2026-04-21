import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();
  const expected = process.env.APP_PASSCODE;
  const secret = process.env.APP_SECRET;

  if (!expected || !secret) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  if (String(passcode) !== String(expected)) {
    return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("aio_auth", secret, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production"
  });
  return res;
}
