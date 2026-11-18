import { getSetting } from "./settings";
import { DEFAULT_CAMPAIGN_1111, normalizeCampaign1111, isCampaignLive, type Campaign1111Config } from "./campaign-1111-config";

// Null while the campaign is switched off OR past its own endsAt, so callers
// can pass the result straight to productCampaign() without checking either
// condition themselves.
export async function getActiveCampaign1111(): Promise<Campaign1111Config | null> {
  const config = normalizeCampaign1111(await getSetting("campaign-1111", DEFAULT_CAMPAIGN_1111));
  return isCampaignLive(config) ? config : null;
}
