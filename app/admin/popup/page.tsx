import PopupAdmin from "@/components/admin/PopupAdmin";

export default function PopupPage() {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "var(--cream)" }}>
      <div className="max-w-xl mx-auto">
        <h1 className="text-lg tracking-widest uppercase font-sans mb-8" style={{ color: "var(--charcoal)" }}>
          Popup Banner
        </h1>
        <PopupAdmin />
      </div>
    </div>
  );
}
