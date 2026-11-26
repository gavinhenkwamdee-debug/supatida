// "พิธีเสริมสิริมงคล" — an optional, free add-on offered on every custom
// ring (one site-wide toggle, not a per-ring admin setting like the groups
// in lib/customRings.ts): the customer can ask to have their finished ring
// blessed, which needs their name, surname, date and time of birth. Kept as
// a flat site_settings key, same no-migration pattern as
// custom-rings-banner / campaign-1111.
export interface BlessingCeremonyConfig {
  enabled: boolean;
  // Shown under the checkbox on the configurator — who performs it and the
  // once-a-month cadence, admin-editable so the officiant or schedule can
  // change without a code change.
  note: string;
}

export const DEFAULT_BLESSING_CEREMONY: BlessingCeremonyConfig = {
  enabled: false,
  note: "จัดพิธีโดยพระอาจารย์โชคดี วัดไก่เตี้ย เดือนละ 1 ครั้งเท่านั้น ไม่มีค่าใช้จ่ายเพิ่มเติม",
};
