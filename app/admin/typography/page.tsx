import TypographyAdmin from "@/components/admin/TypographyAdmin";

export default function TypographyPage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "var(--cream)" }}>
      <div className="max-w-xl mx-auto">
        <h1 className="text-lg tracking-widest uppercase font-sans mb-8" style={{ color: "var(--charcoal)" }}>
          Typography
        </h1>
        <TypographyAdmin />
      </div>
    </div>
  );
}
