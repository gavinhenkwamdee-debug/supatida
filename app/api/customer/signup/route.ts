import { NextResponse } from "next/server";
import { createCustomer, getCustomerByPhone, getTierForPoints, grantPrivilege } from "@/lib/crm";
import { hashPassword, sessionCookieValue, SESSION_COOKIE } from "@/lib/customer-auth";
import { getCrmTiers, getWelcomePerks } from "@/lib/crm-settings";
import { checkPasswordStrength } from "@/lib/password-policy";
import { normalizePhone, isValidThaiPhone } from "@/lib/phone";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const phone = normalizePhone(String(body?.phone ?? "").trim());
  const password = String(body?.password ?? "");
  const birthday = body?.birthday ? String(body.birthday) : null;
  const budgetRange = body?.budgetRange ? String(body.budgetRange) : null;
  const interests = Array.isArray(body?.interests) ? body.interests.map((i: unknown) => String(i)) : [];
  const interestsOther = body?.interestsOther ? String(body.interestsOther).trim() : null;
  const pdpaConsent = Boolean(body?.pdpaConsent);

  if (!name) {
    return NextResponse.json({ error: "กรอกชื่อให้ครบ" }, { status: 400 });
  }

  if (!isValidThaiPhone(phone)) {
    return NextResponse.json({ error: "กรอกเบอร์โทรศัพท์ให้ถูกต้อง (ตัวเลข 10 หลัก ขึ้นต้นด้วย 0)" }, { status: 400 });
  }

  const passwordCheck = checkPasswordStrength(password);
  if (!passwordCheck.ok) {
    return NextResponse.json({ error: `รหัสผ่านต้อง: ${passwordCheck.issues.join(", ")}` }, { status: 400 });
  }

  if (!pdpaConsent) {
    return NextResponse.json({ error: "กรุณายินยอมให้เก็บข้อมูลส่วนบุคคลก่อนสมัครสมาชิก" }, { status: 400 });
  }

  const existing = await getCustomerByPhone(phone);
  if (existing) {
    return NextResponse.json({ error: "เบอร์โทรนี้สมัครสมาชิกไว้แล้ว กรุณาเข้าสู่ระบบ" }, { status: 409 });
  }

  const customer = await createCustomer({
    name,
    phone,
    passwordHash: hashPassword(password),
    birthday,
    budgetRange,
    interests,
    interestsOther,
    pdpaConsent,
  });

  const welcomePerks = await getWelcomePerks();
  for (const perk of welcomePerks) {
    await grantPrivilege(customer.id, perk.title, "signup", null, "", perk.image);
  }

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
