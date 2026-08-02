import CustomRingForm from "@/components/admin/CustomRingForm";

export default function NewCustomRingPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl tracking-wider mb-8" style={{ color: "var(--charcoal)" }}>New Custom Ring</h1>
      <CustomRingForm />
    </div>
  );
}
