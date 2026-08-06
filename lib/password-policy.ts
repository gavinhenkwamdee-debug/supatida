export interface PasswordCheck {
  ok: boolean;
  issues: string[];
}

// Pure, no Node-only imports — safe to use from both client and server code.
export function checkPasswordStrength(password: string): PasswordCheck {
  const issues: string[] = [];
  if (password.length < 8) issues.push("อย่างน้อย 8 ตัวอักษร");
  if (!/[a-z]/.test(password)) issues.push("มีตัวพิมพ์เล็ก (a-z)");
  if (!/[A-Z]/.test(password)) issues.push("มีตัวพิมพ์ใหญ่ (A-Z)");
  if (!/[0-9]/.test(password)) issues.push("มีตัวเลข (0-9)");
  if (!/[^A-Za-z0-9]/.test(password)) issues.push("มีอักขระพิเศษ เช่น ! @ # $ %");
  return { ok: issues.length === 0, issues };
}
