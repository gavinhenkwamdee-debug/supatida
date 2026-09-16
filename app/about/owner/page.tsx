import Link from "next/link";
import Image from "next/image";
import AboutNav from "@/components/AboutNav";
import { getSetting } from "@/lib/settings";
import { DEFAULT_ABOUT, type AboutConfig } from "@/lib/about-config";

export const metadata = { title: "Get to Know the Owner" };

export default async function AboutOwnerPage() {
  const about = await getSetting<AboutConfig>("about", DEFAULT_ABOUT);
  const section = about.owner;

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
          </Link>
        </div>

        <AboutNav active="owner" />

        <div className="bg-white p-8" style={{ border: "1px solid var(--border)" }}>
          <h2 className="text-lg tracking-wide mb-4" style={{ color: "var(--charcoal)" }}>{section.title}</h2>

          {section.image && (
            <div className="relative w-full mb-6 overflow-hidden" style={{ aspectRatio: "4/3", backgroundColor: "var(--img-bg)" }}>
              <Image src={section.image} alt={section.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
            </div>
          )}

          {section.body ? (
            <p className="text-sm font-sans whitespace-pre-line leading-relaxed" style={{ color: "var(--charcoal)" }}>
              {section.body}
            </p>
          ) : (
            <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีเนื้อหา</p>
          )}
        </div>
      </div>
    </div>
  );
}
