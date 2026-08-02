import Link from "next/link";
import { getEnabledCustomRings } from "@/lib/customRings";

export const dynamic = "force-dynamic";

const THB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", maximumFractionDigits: 0 }).format(n);

export default async function CustomRingsGalleryPage() {
  const rings = await getEnabledCustomRings();

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

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.4em] uppercase mb-3 font-sans" style={{ color: "var(--gold)" }}>Design Your Own</p>
          <h2 className="text-2xl tracking-[0.1em]" style={{ color: "var(--charcoal)" }}>ออกแบบแหวนของคุณเอง</h2>
          <div className="mx-auto mt-4 w-16 h-px" style={{ backgroundColor: "var(--gold)" }} />
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
                <div className="relative w-full aspect-square" style={{ backgroundColor: "var(--img-bg)" }}>
                  {ring.baseImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ring.baseImage} alt={ring.name} className="w-full h-full object-contain" />
                  )}
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="text-xs sm:text-sm tracking-wide" style={{ color: "var(--charcoal)" }}>{ring.name}</h3>
                  <p className="text-xs font-sans mt-1" style={{ color: "var(--gold)" }}>จาก {THB(ring.basePrice)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
