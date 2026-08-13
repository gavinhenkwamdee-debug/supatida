import { getSetting, setSetting } from "./settings";
import { DEFAULT_TIERS, type CrmTier, type PerkDef } from "./crm";

const TIERS_KEY = "crm_tiers";
const WELCOME_PERKS_KEY = "crm_welcome_perks";
const SIGNUP_BANNER_KEY = "crm_signup_banner";
const ENABLED_KEY = "crm_enabled";

export async function getCrmEnabled(): Promise<boolean> {
  return getSetting<boolean>(ENABLED_KEY, true);
}

export async function setCrmEnabled(enabled: boolean): Promise<void> {
  await setSetting(ENABLED_KEY, enabled);
}

export async function getCrmTiers(): Promise<CrmTier[]> {
  return getSetting<CrmTier[]>(TIERS_KEY, DEFAULT_TIERS);
}

export async function setCrmTiers(tiers: CrmTier[]): Promise<void> {
  await setSetting(TIERS_KEY, tiers);
}

// One-time perks granted automatically to every new member on signup.
export async function getWelcomePerks(): Promise<PerkDef[]> {
  return getSetting<PerkDef[]>(WELCOME_PERKS_KEY, []);
}

export async function setWelcomePerks(perks: PerkDef[]): Promise<void> {
  await setSetting(WELCOME_PERKS_KEY, perks);
}

export interface SignupBanner {
  image: string | null;
}

const DEFAULT_SIGNUP_BANNER: SignupBanner = { image: null };

// Promotional image shown on the /account signup form.
export async function getSignupBanner(): Promise<SignupBanner> {
  return getSetting<SignupBanner>(SIGNUP_BANNER_KEY, DEFAULT_SIGNUP_BANNER);
}

export async function setSignupBanner(banner: SignupBanner): Promise<void> {
  await setSetting(SIGNUP_BANNER_KEY, banner);
}
