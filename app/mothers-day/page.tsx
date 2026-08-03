import Link from "next/link";
import { getAllProducts } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { DEFAULT_MOTHERSDAY, type MothersDayConfig } from "@/lib/mothersday-config";
import MothersDayProductCard from "@/components/MothersDayProductCard";

export const dynamic = "force-dynamic";

const DISCOUNT = 0.12;

const PROMO_CODES = [
  // แหวน
  "ready06", "ready14", "ready77", "ready120",
  // สร้อยคอ & สร้อยข้อมือ
  "ready50", "ready149", "ready263", "ready264",
  // ต่างหู
  "ready303", "ready306", "ready308", "ready298",
];

export default async function MothersDayPage() {
  const config = await getSetting<MothersDayConfig>("mothersday", DEFAULT_MOTHERSDAY);
  const allProducts = await getAllProducts();

  const promoProducts = allProducts
    .filter((p) => !p.hidden && PROMO_CODES.includes(p.specifications["Product Code"]))
    .sort((a, b) => a.price - b.price);

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

      {!config.enabled ? (
        <div className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>
            โปรโมชั่นนี้ปิดใช้งานชั่วคราว
          </p>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-10">
          {config.bannerImage && (
            <div className="relative w-full mb-8 overflow-hidden" style={{ aspectRatio: "3/1", backgroundColor: "var(--img-bg)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.bannerImage} alt="Mother's Day Promotion" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.4em] uppercase mb-3 font-sans" style={{ color: "#0284C7" }}>Mother&apos;s Day Promotion</p>
            <h2 className="text-2xl tracking-[0.1em]" style={{ color: "var(--charcoal)" }}>ลดพิเศษ 12% รับวันแม่</h2>
            <p className="text-sm font-sans mt-3" style={{ color: "var(--muted)" }}>
              Selective Items 12% discount special only for mother&apos;s day · 7–12 Aug 2026
            </p>
            <div className="mx-auto mt-4 w-16 h-px" style={{ backgroundColor: "#0284C7" }} />
          </div>

          {promoProducts.length === 0 ? (
            <p className="text-center text-sm font-sans" style={{ color: "var(--muted)" }}>ไม่พบสินค้าในโปรโมชั่นนี้</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {promoProducts.map((product) => (
                <MothersDayProductCard
                  key={product.id}
                  product={product}
                  promoPrice={Math.round((product.price * (1 - DISCOUNT)) / 10) * 10}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
