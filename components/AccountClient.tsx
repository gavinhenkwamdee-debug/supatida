"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Customer, CrmTier, PrivilegeGrant } from "@/lib/crm";
import { BUDGET_RANGES, INTEREST_REASONS, PDPA_CONSENT_TEXT } from "@/lib/crm-options";
import { checkPasswordStrength } from "@/lib/password-policy";

type Me = { customer: Customer; tier: CrmTier; nextTier: CrmTier | null; privileges: PrivilegeGrant[] };

const inputClass = "w-full px-3 py-2.5 text-sm font-sans outline-none";
const inputStyle = { border: "1px solid var(--border)", color: "var(--charcoal)" };

export default function AccountClient() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [birthday, setBirthday] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [interestsOther, setInterestsOther] = useState("");
  const [pdpaConsent, setPdpaConsent] = useState(false);
  const [signupBanner, setSignupBanner] = useState<string | null>(null);

  const passwordCheck = checkPasswordStrength(password);

  function loadMe() {
    fetch("/api/customer/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setMe(d))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }

  useEffect(loadMe, []);
  useEffect(() => {
    fetch("/api/settings/crm-signup-banner")
      .then((r) => r.json())
      .then((d) => setSignupBanner(d.image ?? null))
      .catch(() => {});
  }, []);

  function toggleInterest(reason: string) {
    setInterests((prev) => (prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "signup" && !passwordCheck.ok) {
      setError(`รหัสผ่านต้อง: ${passwordCheck.issues.join(", ")}`);
      return;
    }
    if (mode === "signup" && !pdpaConsent) {
      setError("กรุณายินยอมให้เก็บข้อมูลส่วนบุคคลก่อนสมัครสมาชิก");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/customer/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "signup"
            ? { name, phone, password, birthday: birthday || null, budgetRange: budgetRange || null, interests, interestsOther, pdpaConsent }
            : { phone, password }
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาด");
        return;
      }
      loadMe();
    } catch {
      setError("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/customer/logout", { method: "POST" });
    setMe(null);
    setName("");
    setPhone("");
    setPassword("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
            <p className="text-xs tracking-[0.3em] uppercase mt-1 font-sans" style={{ color: "var(--muted)" }}>
              Lab Grown Diamond Jewelry
            </p>
          </Link>
        </div>

        {loading ? (
          <p className="text-center text-sm font-sans" style={{ color: "var(--muted)" }}>กำลังโหลด…</p>
        ) : me ? (
          <Dashboard me={me} onLogout={handleLogout} />
        ) : (
          <div className="bg-white p-8" style={{ border: "1px solid var(--border)" }}>
            {mode === "signup" && signupBanner && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signupBanner} alt="" className="w-full mb-6" style={{ border: "1px solid var(--border)" }} />
            )}
            <div className="flex mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={() => { setMode("login"); setError(""); }}
                className="flex-1 pb-3 text-xs tracking-widest uppercase font-sans"
                style={{
                  color: mode === "login" ? "var(--gold-dark)" : "var(--muted)",
                  borderBottom: mode === "login" ? "2px solid var(--gold-dark)" : "2px solid transparent",
                }}
              >
                เข้าสู่ระบบ
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(""); }}
                className="flex-1 pb-3 text-xs tracking-widest uppercase font-sans"
                style={{
                  color: mode === "signup" ? "var(--gold-dark)" : "var(--muted)",
                  borderBottom: mode === "signup" ? "2px solid var(--gold-dark)" : "2px solid transparent",
                }}
              >
                สมัครสมาชิก
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div>
                  <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>ชื่อ-นามสกุล</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} style={inputStyle} />
                </div>
              )}
              <div>
                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>เบอร์โทรศัพท์</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>รหัสผ่าน</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={inputClass}
                  style={inputStyle}
                />
                {mode === "signup" && password.length > 0 && !passwordCheck.ok && (
                  <p className="text-xs font-sans mt-1" style={{ color: "#C0392B" }}>
                    ต้องมี: {passwordCheck.issues.join(", ")}
                  </p>
                )}
              </div>

              {mode === "signup" && (
                <>
                  <div>
                    <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>วันเกิด (ไม่บังคับ)</label>
                    <input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} className={inputClass} style={inputStyle} />
                  </div>

                  <div>
                    <label className="text-xs font-sans block mb-1" style={{ color: "var(--muted)" }}>งบประมาณแหวนที่สนใจ (ไม่บังคับ)</label>
                    <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} className={inputClass} style={inputStyle}>
                      <option value="">ไม่ระบุ</option>
                      {BUDGET_RANGES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-sans block mb-2" style={{ color: "var(--muted)" }}>ทำไมถึงสนใจ Supatida (เลือกได้หลายข้อ, ไม่บังคับ)</label>
                    <div className="grid grid-cols-2 gap-2">
                      {INTEREST_REASONS.map((reason) => (
                        <label key={reason} className="flex items-center gap-2 text-xs font-sans" style={{ color: "var(--charcoal)" }}>
                          <input type="checkbox" checked={interests.includes(reason)} onChange={() => toggleInterest(reason)} />
                          {reason}
                        </label>
                      ))}
                    </div>
                    {interests.includes("อื่นๆ") && (
                      <input
                        value={interestsOther}
                        onChange={(e) => setInterestsOther(e.target.value)}
                        placeholder="ระบุเหตุผลอื่นๆ"
                        className={`${inputClass} mt-2`}
                        style={inputStyle}
                      />
                    )}
                  </div>

                  <label className="flex items-start gap-2 text-xs font-sans" style={{ color: "var(--charcoal)" }}>
                    <input type="checkbox" checked={pdpaConsent} onChange={(e) => setPdpaConsent(e.target.checked)} className="mt-0.5" required />
                    <span>
                      {PDPA_CONSENT_TEXT}{" "}
                      <Link href="/privacy-policy" target="_blank" className="underline" style={{ color: "var(--gold-dark)" }}>
                        อ่านนโยบายความเป็นส่วนตัว
                      </Link>
                    </span>
                  </label>
                </>
              )}

              {error && <p className="text-xs font-sans" style={{ color: "#C0392B" }}>{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
              >
                {submitting ? "กำลังดำเนินการ…" : mode === "login" ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const { customer, tier, nextTier, privileges } = me;
  const progressPct = nextTier
    ? Math.min(100, Math.round(((customer.points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100))
    : 100;

  return (
    <div className="bg-white p-8" style={{ border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>สวัสดีค่ะ</p>
        <button type="button" onClick={onLogout} className="text-xs font-sans underline" style={{ color: "var(--muted)" }}>
          ออกจากระบบ
        </button>
      </div>
      <h2 className="text-xl tracking-wide mb-6" style={{ color: "var(--charcoal)" }}>{customer.name}</h2>

      <div className="p-5 mb-5 text-center" style={{ backgroundColor: "#FAF8F4", border: "1px solid var(--border)" }}>
        <p className="text-xs tracking-[0.3em] uppercase font-sans mb-1" style={{ color: "var(--gold-dark)" }}>ระดับสมาชิก</p>
        <p className="text-2xl mb-2" style={{ color: "var(--charcoal)" }}>{tier.name}</p>
        <p className="text-3xl font-light mb-1" style={{ color: "var(--gold)" }}>{customer.points.toLocaleString()} <span className="text-sm font-sans">แต้ม</span></p>

        {nextTier && (
          <div className="mt-4">
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
              <div className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: "var(--gold)" }} />
            </div>
            <p className="text-xs font-sans mt-2" style={{ color: "var(--muted)" }}>
              อีก {(nextTier.minPoints - customer.points).toLocaleString()} แต้มถึงระดับ {nextTier.name}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-2">
        <p className="text-xs tracking-widest uppercase font-sans" style={{ color: "var(--gold-dark)" }}>สิทธิพิเศษของคุณ</p>
        {tier.discountPercent > 0 && (
          <p className="text-sm font-sans" style={{ color: "var(--charcoal)" }}>✓ ส่วนลด {tier.discountPercent}% ทุกการสั่งซื้อ (ระดับ {tier.name})</p>
        )}
        {tier.discountPercent === 0 && privileges.length === 0 && (
          <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>สะสมแต้มเพิ่มเพื่อปลดล็อกสิทธิพิเศษ</p>
        )}
      </div>

      {privileges.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {privileges.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm font-sans">
              <span className="flex items-center gap-2">
                {p.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="w-8 h-8 object-cover flex-shrink-0" style={{ border: "1px solid var(--border)", opacity: p.used ? 0.5 : 1 }} />
                )}
                <span style={{ color: p.used ? "var(--muted)" : "var(--charcoal)", textDecoration: p.used ? "line-through" : "none" }}>
                  {p.used ? "" : "✓ "}{p.title}
                </span>
              </span>
              {p.used && <span className="text-xs font-sans flex-shrink-0" style={{ color: "var(--muted)" }}>ใช้แล้ว</span>}
            </div>
          ))}
        </div>
      )}

      <a
        href="https://lin.ee/U9D2iyG"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center justify-center gap-2 py-3 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
        style={{ backgroundColor: "#06C755", color: "white" }}
      >
        แจ้งแอดมินเพื่อใช้สิทธิ์
      </a>
    </div>
  );
}
