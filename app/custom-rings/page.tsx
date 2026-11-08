import type { ReactNode } from "react";
import Link from "next/link";
import { getEnabledCustomRings } from "@/lib/customRings";
import { getSetting } from "@/lib/settings";
import { DEFAULT_CUSTOM_RINGS_BANNER, type CustomRingsBannerConfig } from "@/lib/custom-rings-banner-config";

export const dynamic = "force-dynamic";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const FEATURES: { label: string; icon: ReactNode }[] = [
  {
    label: "เพชร Lab-Grown แท้ 100%",
    icon: (
      <>
        <path d="M12 2 2 9l10 13L22 9Z" />
        <path d="M2 9h20M8.5 2 7 9l5 13 5-13-1.5-7" />
      </>
    ),
  },
  { label: "พลอยสีธรรมชาติแท้", icon: <path d="M12 3 4 9l3.2 11h9.6L20 9Z" /> },
  {
    label: "ปรับแต่งได้ตามใจทุกรายละเอียด",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
  {
    label: "สั่งทำง่าย ๆ ผ่านแชทไลน์",
    icon: <path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4 8.6 8.6 0 0 1-3.2-.6L3 21l1.7-5.1a8.3 8.3 0 0 1-.7-3.4A8.4 8.4 0 0 1 12.5 3a8.4 8.4 0 0 1 8.4 8.4Z" />,
  },
];

const STEPS = [
  { n: "01", title: "เลือกแบบแหวนที่ชอบ", body: "เลือกจากคอลเลกชันของเรา แต่ละแบบมีเอกลักษณ์และความหมายของตัวเอง" },
  { n: "02", title: "ปรับพลอย วัสดุ และไซส์", body: "เลือกพลอยความหมายที่ใช่สำหรับคุณ พร้อมดูตัวอย่างแบบเรียลไทม์ทันที" },
  { n: "03", title: "แคปหน้าจอ ส่งแอดมินทางไลน์", body: "ส่งสรุปแบบที่ออกแบบไว้ให้แอดมิน แล้วรอรับแหวนที่ออกแบบเองได้เลย" },
];

export default async function CustomRingsGalleryPage() {
  const [rings, banner] = await Promise.all([
    getEnabledCustomRings(),
    getSetting<CustomRingsBannerConfig>("custom-rings-banner", DEFAULT_CUSTOM_RINGS_BANNER),
  ]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="text-center py-6" style={{ borderBottom: "1px solid var(--border)", backgroundColor: "white" }}>
        <Link href="/" className="inline-block">
          <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
          <p className="text-xs tracking-[0.3em] uppercase mt-1 font-sans" style={{ color: "var(--muted)" }}>
            Lab Grown Diamond Jewelry
          </p>
        </Link>
      </div>

      {/* Hero banner — admin-uploadable photo behind the headline (see
          /admin/custom-rings), dark scrim keeps the text legible regardless
          of the photo; falls back to this gradient when none is set. */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "21/9",
          minHeight: 280,
          background: banner.imageUrl
            ? undefined
            : "linear-gradient(135deg, #E9E0CC 0%, #D9CBA8 55%, #C9B27E 100%)",
        }}
      >
        {banner.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={banner.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <svg
          className="absolute"
          style={{ right: "-4%", top: "50%", transform: "translateY(-50%)", opacity: 0.35 }}
          width="46%"
          viewBox="0 0 100 100"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.1"
        >
          <ellipse cx="50" cy="58" rx="26" ry="22" />
          <path d="M38 40 44 18 56 18 62 40" />
          <circle cx="50" cy="20" r="4.5" fill="#FFFFFF" stroke="none" />
        </svg>
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(90deg, rgba(20,18,12,0.55) 0%, rgba(20,18,12,0.28) 45%, rgba(20,18,12,0.05) 75%)" }}
        />
        <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-center gap-3">
          <p className="text-xs tracking-[0.4em] uppercase font-sans" style={{ color: "var(--gold-light)" }}>Design Your Own</p>
          <h2 className="text-3xl sm:text-4xl leading-tight max-w-md" style={{ color: "white" }}>
            ออกแบบแหวนของคุณเอง<br />ให้เป็นเรื่องราวของคุณ
          </h2>
          <p className="text-sm font-sans leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.88)" }}>
            เลือกทรงแหวนที่ใช่ ฝังพลอยที่มีความหมายสำหรับคุณโดยเฉพาะ ปรับวัสดุและไซส์ได้อิสระ
            พร้อมดูตัวอย่างแบบเรียลไทม์ก่อนสั่งทำจริง
          </p>
        </div>
      </div>

      {/* Feature strip */}
      <div className="max-w-4xl mx-auto px-6 py-9 flex justify-center flex-wrap gap-x-7 gap-y-4">
        {FEATURES.map((f) => (
          <div key={f.label} className="flex items-center gap-2.5 whitespace-nowrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.4" className="flex-shrink-0">
              {f.icon}
            </svg>
            <span className="text-xs font-sans" style={{ color: "var(--charcoal)" }}>{f.label}</span>
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={{ backgroundColor: "var(--img-bg)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-3xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col gap-2">
              <span className="text-3xl" style={{ color: "var(--gold-light)" }}>{s.n}</span>
              <p className="text-sm font-sans font-medium" style={{ color: "var(--charcoal)" }}>{s.title}</p>
              <p className="text-xs font-sans leading-relaxed" style={{ color: "var(--muted)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.35em] uppercase mb-2 font-sans" style={{ color: "var(--gold)" }}>Our Collection</p>
          <h3 className="text-2xl tracking-[0.05em]" style={{ color: "var(--charcoal)" }}>เลือกแบบแหวนของคุณ</h3>
        </div>

        {rings.length === 0 ? (
          <p className="text-center text-sm font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีแหวนให้ออกแบบตอนนี้</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
            {rings.map((ring) => (
              <Link
                key={ring.id}
                href={`/custom-rings/${ring.id}`}
                className="group flex flex-col bg-white overflow-hidden transition-shadow duration-300 hover:shadow-xl"
                style={{ border: "1px solid var(--border)" }}
              >
                <div className="relative w-full aspect-square overflow-hidden" style={{ backgroundColor: "var(--img-bg)" }}>
                  {ring.baseImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ring.baseImage}
                      alt={ring.name}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                </div>
                <div className="p-3 sm:p-4 flex flex-col flex-grow">
                  <h3 className="text-xs sm:text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>{ring.name}</h3>
                  {ring.description && (
                    <p
                      className="text-xs font-sans mt-1 leading-relaxed hidden sm:block"
                      style={{
                        color: "var(--muted)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {ring.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="text-xs font-sans" style={{ color: "var(--gold)" }}>จาก {THB(ring.basePrice)}</p>
                    <span
                      className="text-[10px] tracking-[0.08em] uppercase font-sans items-center gap-1 transition-transform duration-200 group-hover:translate-x-0.5 hidden sm:flex"
                      style={{ color: "var(--charcoal)" }}
                    >
                      ออกแบบเลย →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
