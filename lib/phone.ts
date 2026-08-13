// Pure, no Node-only imports — safe to use from both client and server code.

export function normalizePhone(input: string): string {
  return input.replace(/[\s-]/g, "");
}

// Thai phone numbers: 10 digits starting with 0 (e.g. 0812345678).
export function isValidThaiPhone(input: string): boolean {
  return /^0\d{9}$/.test(normalizePhone(input));
}
