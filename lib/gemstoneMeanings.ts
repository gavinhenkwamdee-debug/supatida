// Fixed, global "meaning" system for the gemstone configurator — 3
// categories x 6 meanings each, every meaning mapped to one gemstone. Not
// admin-editable (per the spec this list is shared across every custom
// ring), so it lives as a plain data table rather than in the DB.

export type MeaningCategory = "wish" | "strength" | "balance";

export interface Meaning {
  key: string;
  category: MeaningCategory;
  labelTh: string;
  labelEn: string;
  gemstone: string;
  swatchColor: string;
  standalone: string;
  // Wish meanings only — the lead clause when combined with another category.
  sentence?: string;
  // Strength/Balance meanings only — the trailing clause appended to a wish,
  // or (with the leading connector word stripped) folded into the
  // strength+balance-only template.
  connector?: string;
}

export const WISH_MEANINGS: Meaning[] = [
  {
    key: "CAREER", category: "wish", labelTh: "ความก้าวหน้าในงาน", labelEn: "CAREER",
    gemstone: "Emerald", swatchColor: "#1F6B4D",
    standalone: "อยากเห็นตัวเองเติบโตและก้าวหน้าในเส้นทางการงาน",
    sentence: "อยากเติบโตและก้าวหน้าในเส้นทางการงาน",
  },
  {
    key: "WEALTH", category: "wish", labelTh: "ความมั่งคั่ง", labelEn: "WEALTH",
    gemstone: "Yellow Sapphire", swatchColor: "#E8C547",
    standalone: "อยากสร้างความมั่งคั่งและความมั่นคงให้กับชีวิต",
    sentence: "อยากสร้างความมั่งคั่งและความมั่นคงให้กับชีวิต",
  },
  {
    key: "RELATIONSHIP", category: "wish", labelTh: "ความสัมพันธ์", labelEn: "RELATIONSHIP",
    gemstone: "Pink Tourmaline", swatchColor: "#E8A0BF",
    standalone: "อยากให้ความสัมพันธ์ที่สำคัญเติบโตและดีขึ้น",
    sentence: "อยากดูแลให้ความสัมพันธ์ที่สำคัญเติบโตขึ้น",
  },
  {
    key: "HEALTH", category: "wish", labelTh: "สุขภาพ", labelEn: "HEALTH",
    gemstone: "Garnet", swatchColor: "#7B2D3E",
    standalone: "อยากดูแลสุขภาพและความเป็นอยู่ที่ดีให้คงอยู่",
    sentence: "อยากรักษาสุขภาพและความเป็นอยู่ที่ดีไว้",
  },
  {
    key: "ACHIEVEMENT", category: "wish", labelTh: "ความสำเร็จ", labelEn: "ACHIEVEMENT",
    gemstone: "Diamond", swatchColor: "#EDEDED",
    standalone: "อยากไปให้ถึงเป้าหมายและสิ่งที่ตั้งใจไว้",
    sentence: "อยากไปให้ถึงเป้าหมายที่ตั้งใจ",
  },
  {
    key: "LEARNING", category: "wish", labelTh: "การเรียนรู้", labelEn: "LEARNING",
    gemstone: "Zircon", swatchColor: "#CFE8E8",
    standalone: "อยากเปิดรับความรู้ ประสบการณ์ และสิ่งใหม่ ๆ อยู่เสมอ",
    sentence: "อยากเปิดรับการเรียนรู้และการเติบโตอยู่เสมอ",
  },
];

export const STRENGTH_MEANINGS: Meaning[] = [
  {
    key: "CONFIDENT", category: "strength", labelTh: "มั่นใจ", labelEn: "CONFIDENT",
    gemstone: "Ruby", swatchColor: "#9B2242",
    standalone: "พร้อมก้าวไปข้างหน้าด้วยความมั่นใจในตัวเอง",
    connector: "ด้วยความมั่นใจในตัวเอง",
  },
  {
    key: "FOCUSED", category: "strength", labelTh: "มีสมาธิ", labelEn: "FOCUSED",
    gemstone: "Amethyst", swatchColor: "#8B6BB1",
    standalone: "มีสมาธิและความชัดเจนกับสิ่งที่สำคัญ",
    connector: "ด้วยสมาธิและความชัดเจน",
  },
  {
    key: "DETERMINED", category: "strength", labelTh: "มุ่งมั่น", labelEn: "DETERMINED",
    gemstone: "Blue Sapphire", swatchColor: "#1E4B8C",
    standalone: "มีความมุ่งมั่นและแน่วแน่กับสิ่งที่เลือก",
    connector: "ด้วยความมุ่งมั่นและแน่วแน่",
  },
  {
    key: "BRAVE", category: "strength", labelTh: "กล้าหาญ", labelEn: "BRAVE",
    gemstone: "Green Tourmaline", swatchColor: "#4F8A5B",
    standalone: "กล้าที่จะเผชิญสิ่งใหม่และก้าวผ่านความไม่แน่นอน",
    connector: "ด้วยความกล้าที่จะก้าวต่อ",
  },
  {
    key: "EXPRESSIVE", category: "strength", labelTh: "กล้าแสดงออก", labelEn: "EXPRESSIVE",
    gemstone: "Blue Topaz", swatchColor: "#6FB7D9",
    standalone: "กล้าสื่อสารความคิด ความรู้สึก และตัวตนของตัวเอง",
    connector: "ด้วยความกล้าที่จะสื่อสารความเป็นตัวเอง",
  },
  {
    key: "ENDURING", category: "strength", labelTh: "อดทน", labelEn: "ENDURING",
    gemstone: "Jade", swatchColor: "#4A7862",
    standalone: "มีความอดทนและพร้อมยืนระยะกับสิ่งที่สำคัญ",
    connector: "ด้วยความอดทนและความแข็งแรงภายใน",
  },
];

export const BALANCE_MEANINGS: Meaning[] = [
  {
    key: "PEACE", category: "balance", labelTh: "ความสงบ", labelEn: "PEACE",
    gemstone: "Aquamarine", swatchColor: "#A8D8D8",
    standalone: "พร้อมรักษาความสงบให้ยังมีที่อยู่ในทุกวัน",
    connector: "พร้อมรักษาความสงบไว้ระหว่างทาง",
  },
  {
    key: "JOY", category: "balance", labelTh: "ความสุข", labelEn: "JOY",
    gemstone: "Citrine", swatchColor: "#E0A84A",
    standalone: "ไม่ลืมเก็บความสุขเล็ก ๆ ไว้ในทุกวัน",
    connector: "โดยไม่ลืมเก็บความสุขไว้ในทุกวัน",
  },
  {
    key: "INDEPENDENT", category: "balance", labelTh: "ยืนได้ด้วยตัวเอง", labelEn: "INDEPENDENT",
    gemstone: "Spinel", swatchColor: "#C25B6E",
    standalone: "ยังคงยืนได้ด้วยตัวเองและเลือกเส้นทางของตัวเอง",
    connector: "พร้อมยืนได้ด้วยตัวเอง",
  },
  {
    key: "MOTIVATED", category: "balance", labelTh: "มีแรงใจ", labelEn: "MOTIVATED",
    gemstone: "Peridot", swatchColor: "#A8C24C",
    standalone: "ยังมีแรงใจที่จะลงมือและเดินหน้าต่อ",
    connector: "และยังมีแรงใจที่จะเดินหน้าต่อ",
  },
  {
    key: "ENERGETIC", category: "balance", labelTh: "ความกระตือรือร้น", labelEn: "ENERGETIC",
    gemstone: "Orange Sapphire", swatchColor: "#E08A3C",
    standalone: "รักษาพลังและความกระตือรือร้นในการใช้ชีวิต",
    connector: "พร้อมรักษาพลังและความกระตือรือร้นไว้",
  },
  {
    key: "PRESENT", category: "balance", labelTh: "อยู่กับปัจจุบัน", labelEn: "PRESENT",
    gemstone: "Cat's Eye Chrysoberyl", swatchColor: "#C9B94A",
    standalone: "กลับมาอยู่กับสิ่งที่อยู่ตรงหน้าและช่วงเวลานี้",
    connector: "พร้อมกลับมาอยู่กับสิ่งที่อยู่ตรงหน้า",
  },
];

export const MEANINGS_BY_CATEGORY: Record<MeaningCategory, Meaning[]> = {
  wish: WISH_MEANINGS,
  strength: STRENGTH_MEANINGS,
  balance: BALANCE_MEANINGS,
};

export const CATEGORY_LABEL: Record<MeaningCategory, string> = {
  wish: "YOUR WISH",
  strength: "YOUR STRENGTH",
  balance: "YOUR BALANCE",
};

export interface MeaningSelection {
  wish?: string;
  strength?: string;
  balance?: string;
}

export interface MeaningSummary {
  generatedSummary: string;
  selectedMeanings: { category: string; key: string; labelTh: string; labelEn: string }[];
  selectedGemstones: string[];
}

function findMeaning(category: MeaningCategory, key: string | undefined): Meaning | undefined {
  if (!key) return undefined;
  return MEANINGS_BY_CATEGORY[category].find((m) => m.key === key);
}

// Turns a connector like "ด้วยความมั่นใจในตัวเอง" into the bare phrase
// "ความมั่นใจในตัวเอง" — used only for the Strength+Balance-only case, so
// that pairing doesn't need its own hand-written phrase per meaning.
function bareConnector(connector: string): string {
  return connector.replace(/^(ด้วย|พร้อม|โดย|และ)/, "").trim();
}

export function buildMeaningSummary(selection: MeaningSelection): MeaningSummary | null {
  const wish = findMeaning("wish", selection.wish);
  const strength = findMeaning("strength", selection.strength);
  const balance = findMeaning("balance", selection.balance);
  const picked = [wish, strength, balance].filter((m): m is Meaning => Boolean(m));

  if (picked.length === 0) return null;

  let generatedSummary: string;
  if (picked.length === 1) {
    generatedSummary = picked[0].standalone;
  } else if (wish && strength && balance) {
    generatedSummary = `${wish.sentence} ${strength.connector} ${balance.connector}`;
  } else if (wish && strength) {
    generatedSummary = `${wish.sentence} ${strength.connector}`;
  } else if (wish && balance) {
    generatedSummary = `${wish.sentence} ${balance.connector}`;
  } else {
    // strength + balance, no wish
    generatedSummary = `อยากมี${bareConnector(strength!.connector!)} พร้อมกับ${bareConnector(balance!.connector!)}`;
  }

  return {
    generatedSummary,
    selectedMeanings: picked.map((m) => ({
      category: CATEGORY_LABEL[m.category],
      key: m.key,
      labelTh: m.labelTh,
      labelEn: m.labelEn,
    })),
    selectedGemstones: picked.map((m) => m.gemstone),
  };
}
