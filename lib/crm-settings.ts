import { getSetting, setSetting } from "./settings";
import { DEFAULT_TIERS, type CrmTier } from "./crm";

const TIERS_KEY = "crm_tiers";

export async function getCrmTiers(): Promise<CrmTier[]> {
  return getSetting<CrmTier[]>(TIERS_KEY, DEFAULT_TIERS);
}

export async function setCrmTiers(tiers: CrmTier[]): Promise<void> {
  await setSetting(TIERS_KEY, tiers);
}
