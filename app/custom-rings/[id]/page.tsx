import { notFound } from "next/navigation";
import { getCustomRingById } from "@/lib/customRings";
import CustomRingConfigurator from "@/components/CustomRingConfigurator";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function CustomRingPage({ params }: Params) {
  const { id } = await params;
  const ring = await getCustomRingById(parseInt(id));
  if (!ring || !ring.enabled) notFound();

  return <CustomRingConfigurator ring={ring} />;
}
