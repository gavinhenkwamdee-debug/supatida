import Link from "next/link";
import Image from "next/image";
import AboutNav from "@/components/AboutNav";
import { getSetting } from "@/lib/settings";
import { DEFAULT_ABOUT, type AboutConfig } from "@/lib/about-config";

export const metadata = { title: "Make Appointment" };

export default async function AboutAppointmentPage() {
  const about = await getSetting<AboutConfig>("about", DEFAULT_ABOUT);
  const section = about.appointment;

  return (
    <div className="min-h-screen px-4 py-12" style={{ backgroundColor: "var(--ivory)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl tracking-[0.2em]" style={{ color: "var(--charcoal)" }}>SUPATIDA</h1>
          </Link>
        </div>

        <AboutNav active="appointment" />

        <div className="bg-white p-8" style={{ border: "1px solid var(--border)" }}>
          <h2 className="text-lg tracking-wide mb-4" style={{ color: "var(--charcoal)" }}>{section.title}</h2>

          <div className={section.image ? "flex flex-col sm:flex-row gap-6 mb-6" : "mb-6"}>
            {section.image && (
              <div className="relative w-full sm:w-2/5 flex-shrink-0 overflow-hidden" style={{ aspectRatio: "4/3", backgroundColor: "var(--img-bg)" }}>
                <Image src={section.image} alt={section.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 269px" />
              </div>
            )}

            {section.body ? (
              <p className="text-sm font-sans whitespace-pre-line leading-relaxed flex-1" style={{ color: "var(--charcoal)" }}>
                {section.body}
              </p>
            ) : (
              <p className="text-sm font-sans flex-1" style={{ color: "var(--muted)" }}>ยังไม่มีเนื้อหา</p>
            )}
          </div>

          {section.lineUrl && (
            <a
              href={section.lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3.5 text-xs tracking-widest uppercase font-sans transition-opacity hover:opacity-80"
              style={{ backgroundColor: "#06C755", color: "white" }}
            >
              นัดหมายผ่าน LINE
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
