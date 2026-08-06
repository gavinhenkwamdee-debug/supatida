import { getSetting, setSetting } from "./settings";
import { DEFAULT_TIERS, type CrmTier } from "./crm";

const TIERS_KEY = "crm_tiers";
const WELCOME_PERKS_KEY = "crm_welcome_perks";

export async function getCrmTiers(): Promise<CrmTier[]> {
  return getSetting<CrmTier[]>(TIERS_KEY, DEFAULT_TIERS);
}

export async function setCrmTiers(tiers: CrmTier[]): Promise<void> {
  await setSetting(TIERS_KEY, tiers);
}

// One-time perks granted automatically to every new member on signup.
export async function getWelcomePerks(): Promise<string[]> {
  return getSetting<string[]>(WELCOME_PERKS_KEY, []);
}

export async function setWelcomePerks(perks: string[]): Promise<void> {
  await setSetting(WELCOME_PERKS_KEY, perks);
}
