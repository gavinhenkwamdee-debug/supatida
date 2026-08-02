import { notFound } from "next/navigation";
import { getCustomRingById } from "@/lib/customRings";
import CustomRingForm from "@/components/admin/CustomRingForm";

type Params = { params: Promise<{ id: string }> };

export default async function EditCustomRingPage({ params }: Params) {
  const { id } = await params;
  const ring = await getCustomRingById(parseInt(id));
  if (!ring) notFound();

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl tracking-wider mb-1" style={{ color: "var(--charcoal)" }}>Edit Custom Ring</h1>
      <p className="text-sm mb-8 font-sans" style={{ color: "var(--muted)" }}>{ring.name}</p>
      <CustomRingForm ring={ring} />
    </div>
  );
}
