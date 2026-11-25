import { notFound } from "next/navigation";
import { getCustomRingById } from "@/lib/customRings";
import { getSetting } from "@/lib/settings";
import { DEFAULT_BLESSING_CEREMONY, type BlessingCeremonyConfig } from "@/lib/blessing-ceremony-config";
import CustomRingConfigurator from "@/components/CustomRingConfigurator";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function TheWishNoteRingPage({ params }: Params) {
  const { id } = await params;
  const [ring, blessingConfig] = await Promise.all([
    getCustomRingById(parseInt(id)),
    getSetting<BlessingCeremonyConfig>("blessing-ceremony", DEFAULT_BLESSING_CEREMONY),
  ]);
  if (!ring || !ring.enabled) notFound();

  return <CustomRingConfigurator ring={ring} blessingConfig={blessingConfig} />;
}
