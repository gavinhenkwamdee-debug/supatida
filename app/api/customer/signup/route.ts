import { NextResponse } from "next/server";
import { createCustomer, getCustomerByPhone, getTierForPoints } from "@/lib/crm";
import { hashPassword, sessionCookieValue, SESSION_COOKIE } from "@/lib/customer-auth";
import { getCrmTiers } from "@/lib/crm-settings";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const password = String(body?.password ?? "");

  if (!name || !phone || password.length < 6) {
    return NextResponse.json({ error: "กรอกชื่อ เบอร์โทร และรหัสผ่าน (อย่างน้อย 6 ตัว) ให้ครบ" }, { status: 400 });
  }

  const existing = await getCustomerByPhone(phone);
  if (existing) {
    return NextResponse.json({ error: "เบอร์โทรนี้สมัครสมาชิกไว้แล้ว กรุณาเข้าสู่ระบบ" }, { status: 409 });
  }

  const customer = await createCustomer(name, phone, hashPassword(password));
  const tiers = await getCrmTiers();

  const response = NextResponse.json({ customer, tier: getTierForPoints(customer.points, tiers) });
  response.cookies.set(SESSION_COOKIE, sessionCookieValue(customer.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
