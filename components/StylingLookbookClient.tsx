"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface ResolvedLookItem {
  id: number;
  name: string;
  price: number;
  image: string;
}

export interface ResolvedLook {
  id: string;
  image: string;
  theme: string;
  items: ResolvedLookItem[];
}

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

const ALL = "ทั้งหมด";

export default function StylingLookbookClient({ looks }: { looks: ResolvedLook[] }) {
  const themes = useMemo(
    () => [ALL, ...Array.from(new Set(looks.map((l) => l.theme).filter(Boolean)))],
    [looks]
  );
  const [active, setActive] = useState(ALL);
  const filtered = active === ALL ? looks : looks.filter((l) => l.theme === active);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="max-w-xl mx-auto text-center mb-8">
        <p className="text-xs tracking-[0.4em] uppercase mb-3 font-sans" style={{ color: "#C0392B" }}>11.11 · Styling Guide</p>
        <h2 className="text-3xl tracking-[0.05em]" style={{ color: "var(--charcoal)" }}>แต่งแบบไหนดี</h2>
        <p className="text-sm font-sans mt-3 leading-relaxed" style={{ color: "var(--muted)" }}>
          ไอเดียการจัดวางเครื่องประดับ แตะดูแต่ละลุคเพื่อดูว่ามีชิ้นไหนบ้าง แล้วกดไปเลือกซื้อได้ทันที
        </p>
        <p className="text-xs font-sans mt-2 italic" style={{ color: "var(--muted)", opacity: 0.85 }}>
          ภาพประกอบตกแต่งด้วยคอมพิวเตอร์กราฟิก เพื่อถ่ายทอดโทนและมู้ดของการจัดสไตล์ สัดส่วนเครื่องประดับในภาพอาจแตกต่างจากชิ้นงานจริงเล็กน้อย
        </p>
      </div>

      {themes.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {themes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActive(t)}
              className="px-4 py-2 text-xs font-sans rounded-full transition-colors"
              style={
                active === t
                  ? { backgroundColor: "var(--charcoal)", color: "var(--gold-light)", border: "1px solid var(--charcoal)" }
                  : { backgroundColor: "white", color: "var(--charcoal)", border: "1px solid var(--border)" }
              }
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-center text-sm font-sans py-12" style={{ color: "var(--muted)" }}>ยังไม่มีลุคในธีมนี้</p>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5">
          {filtered.map((look) => (
            <div key={look.id} className="break-inside-avoid mb-5 bg-white overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={look.image} alt={look.theme || "styling look"} className="w-full h-auto block" />
              {look.items.length > 0 && (
                <div className="p-3">
                  {look.theme && (
                    <p className="text-[11px] tracking-[0.1em] uppercase font-sans mb-2" style={{ color: "var(--gold-dark)" }}>{look.theme}</p>
                  )}
                  <div className="space-y-1">
                    {look.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.id}`}
                        className="flex items-center gap-2.5 py-1.5 transition-colors hover:bg-gray-50"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <span
                          className="flex-shrink-0 overflow-hidden"
                          style={{ width: 26, height: 26, borderRadius: 999, backgroundColor: "var(--img-bg)", border: "1px solid var(--border)" }}
                        >
                          {item.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          )}
                        </span>
                        <span className="flex-1 min-w-0 text-xs font-sans truncate" style={{ color: "var(--charcoal)" }}>{item.name}</span>
                        <span className="flex-shrink-0 text-xs font-sans" style={{ color: "var(--gold)" }}>{THB(item.price)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
