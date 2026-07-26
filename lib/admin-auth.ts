const ADMIN_TOKEN_COOKIE = "supatida_admin";

function parseCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

export function isAdminRequest(request: Request): boolean {
  const token = parseCookie(request.headers.get("cookie"), ADMIN_TOKEN_COOKIE);
  const expected = Buffer.from(
    process.env.ADMIN_PASSWORD || "supatida2024"
  ).toString("base64");
  return token === expected;
}
