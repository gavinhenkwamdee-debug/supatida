import Link from "next/link";
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

          <div className="mb-5">
            {section.image && (
              <div className="w-full mb-4" style={{ backgroundColor: "var(--img-bg)" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={section.image} alt={section.title} className="w-full h-auto" />
              </div>
            )}

            {section.body && (
              <p className="text-sm font-sans whitespace-pre-line leading-relaxed" style={{ color: "var(--charcoal)" }}>
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
            section.mapEmbedUrl.includes("/maps/embed") ? (
              <div className="w-full overflow-hidden" style={{ aspectRatio: "16/9", border: "1px solid var(--border)" }}>
                <iframe
                  src={section.mapEmbedUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="ที่ตั้งร้าน Supatida"
                />
              </div>
            ) : (
              // Google refuses to render a plain maps.google.com/share link
              // inside an iframe (X-Frame-Options) — only a real
              // /maps/embed?pb=... URL can be embedded, so anything else
              // becomes a plain link instead of a broken frame.
              <a
                href={section.mapEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center py-3.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
                style={{ border: "1px solid var(--border)", color: "var(--charcoal)" }}
              >
                เปิดแผนที่ Google Maps ↗
              </a>
            )
          )}

          {!section.body && !section.address && !section.hours && !section.mapEmbedUrl && (
            <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>ยังไม่มีเนื้อหา</p>
          )}
        </div>
      </div>
    </div>
  );
}
