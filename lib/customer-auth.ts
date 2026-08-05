import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "crypto";

const SESSION_COOKIE = "supatida_customer";
const SESSION_SECRET = process.env.CUSTOMER_SESSION_SECRET || "supatida-crm-session-secret";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

function sign(customerId: number): string {
  const sig = createHmac("sha256", SESSION_SECRET).update(String(customerId)).digest("hex");
  return `${customerId}.${sig}`;
}

export function sessionCookieValue(customerId: number): string {
  return sign(customerId);
}

function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

export function getCustomerIdFromRequest(request: Request): number | null {
  const token = parseCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (!token) return null;
  const [idStr, sig] = token.split(".");
  if (!idStr || !sig) return null;
  const id = Number(idStr);
  if (!Number.isInteger(id)) return null;
  if (sign(id) !== token) return null;
  return id;
}

export { SESSION_COOKIE };
