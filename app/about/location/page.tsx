import Link from "next/link";
import Image from "next/image";
import AboutNav from "@/components/AboutNav";
import { getSetting } from "@/lib/settings";
import { DEFAULT_ABOUT, type AboutConfig } from "@/lib/about-config";

export const metadata = { title: "Our Location" };

export default async function AboutLocationPage() {
  const about = await getSetting<AboutConfig>("about", DEFAULT_ABOUT);
  const section = about.location;

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
          </Link>
        </div>

        <AboutNav active="location" />

        <div className="bg-white p-8" style={{ border: "1px solid var(--border)" }}>
          <h2 className="text-lg tracking-wide mb-4" style={{ color: "var(--charcoal)" }}>{section.title}</h2>

          <div className={section.image ? "flex flex-col sm:flex-row gap-6 mb-5" : "mb-5"}>
            {section.image && (
              <div className="relative w-full sm:w-2/5 flex-shrink-0 overflow-hidden" style={{ aspectRatio: "4/3", backgroundColor: "var(--img-bg)" }}>
                <Image src={section.image} alt={section.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 269px" />
              </div>
            )}

            {section.body && (
              <p className="text-sm font-sans whitespace-pre-line leading-relaxed flex-1" style={{ color: "var(--charcoal)" }}>
                {section.body}
              </p>
            )}
          </div>

          {(section.address || section.hours) && (
            <div className="mb-5 space-y-2 text-sm font-sans" style={{ color: "var(--charcoal)" }}>
              {section.address && (
                <p><strong>ที่อยู่:</strong> <span className="whitespace-pre-line">{section.address}</span></p>
              )}
              {section.hours && (
                <p><strong>เวลาทำการ:</strong> <span className="whitespace-pre-line">{section.hours}</span></p>
              )}
            </div>
          )}

          {section.mapEmbedUrl && (
            <div className="w-full overflow-hidden" style={{ aspectRatio: "16/9", border: "1px solid var(--border)" }}>
              <iframe
                src={section.mapEmbedUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="ที่ตั้งร้าน Supatida"
              />
            </div>
          )}

          {!section.body && !section.address && !section.hours && !section.mapEmbedUrl && (
            <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีเนื้อหา</p>
          )}
        </div>
      </div>
    </div>
  );
}
