import { getSetting } from "./settings";
import { DEFAULT_CAMPAIGN_1111, normalizeCampaign1111, type Campaign1111Config } from "./campaign-1111-config";

// Null while the campaign is switched off, so callers can pass the result
// straight to productCampaign() without checking the flag themselves.
export async function getActiveCampaign1111(): Promise<Campaign1111Config | null> {
  const config = normalizeCampaign1111(await getSetting("campaign-1111", DEFAULT_CAMPAIGN_1111));
  return config.enabled ? config : null;
}
