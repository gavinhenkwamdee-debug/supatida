import { NextResponse } from "next/server";
import { getCustomerByPhone, getTierForPoints } from "@/lib/crm";
import { verifyPassword, sessionCookieValue, SESSION_COOKIE } from "@/lib/customer-auth";
import { getCrmTiers } from "@/lib/crm-settings";
import { normalizePhone } from "@/lib/phone";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = normalizePhone(String(body?.phone ?? "").trim());
  const password = String(body?.password ?? "");

  const customer = await getCustomerByPhone(phone);
  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    return NextResponse.json({ error: "เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }

  const tiers = await getCrmTiers();
  const publicCustomer = {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    points: customer.points,
    birthday: customer.birthday,
    budgetRange: customer.budgetRange,
    interests: customer.interests,
    interestsOther: customer.interestsOther,
    createdAt: customer.createdAt,
  };

  const response = NextResponse.json({ customer: publicCustomer, tier: getTierForPoints(customer.points, tiers) });
  response.cookies.set(SESSION_COOKIE, sessionCookieValue(customer.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
