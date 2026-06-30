import type { Product } from "./db";

// Thai → English mappings
const CATEGORY_MAP: Record<string, string> = {
  แหวน: "Rings",
  ต่างหู: "Earrings",
  สร้อยข้อมือ: "Bracelets",
  สร้อยคอ: "Necklaces",
  จี้: "Pendants",
  กำไล: "Bracelets",
};

const METAL_COLOR_MAP: Record<string, string> = {
  ทองซีด: "Yellow Gold",
  โรสโกลด์: "Rose Gold",
  ทองคำขาว: "White Gold",
  เงิน: "Silver",
  แพลทินัม: "Platinum",
  ทองแดง: "Rose Gold",
};

const METAL_TYPE_MAP: Record<string, string> = {
  "14K": "14K Gold",
  "18K": "18K Gold",
  "10K": "10K Gold",
  "10k": "10K Gold",
  "9K": "9K Gold",
  PT950: "Platinum 950",
  Silver: "Silver",
};

// Build a placeholder English name from available fields
function buildName(
  code: string,
  categoryTh: string,
  metalColor: string,
  metalType: string
): string {
  const cat = CATEGORY_MAP[categoryTh?.trim()] || categoryTh || "Jewelry";
  const color = METAL_COLOR_MAP[metalColor?.trim()] || metalColor || "";
  const karat = METAL_TYPE_MAP[metalType?.trim()] || metalType || "";

  // e.g. "Yellow Gold 14K Diamond Ring"
  const parts = [color, karat, "Diamond", cat.replace(/s$/, "")].filter(Boolean);
  return parts.join(" ");
}

export interface ImportRow {
  code: string;
  name: string;
  category: string;
  price: number;
  specifications: Record<string, string>;
}

// Column indices (0-based) from the sheet
const COL = {
  CODE: 0,          // รหัสสินค้า (ready228 ฯลฯ)
  CATEGORY: 1,      // ชนิด
  STATUS: 2,        // สถานะ
  DIAMOND_POS: 4,   // ตำแหน่งเพชร
  METAL_COLOR: 5,   // สีตัวเรือน
  ITEM_ID: 6,       // Item ID
  SIZE: 7,          // ไซส์
  DIAMOND_SIZE: 8,  // ขนาดเพชร/ตัง
  DIAMOND_FACE: 9,  // ขนาดหน้าเพชร/มิล
  DIAMOND_COUNT: 10, // จำนวนเพชร
  DIAMOND_WEIGHT: 11, // น้ำหนักรวมเพชร
  METAL_TYPE: 14,   // ชนิดทอง
  PRICE: 32,        // ราคาหน้าร้าน
};

export function parseExcelRows(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[][]
): ImportRow[] {
  const results: ImportRow[] = [];

  for (const row of rows) {
    const status = String(row[COL.STATUS] || "").trim();
    if (status !== "ขาย") continue;

    const code = String(row[COL.CODE] || "").trim();
    if (!code) continue;

    const categoryTh = String(row[COL.CATEGORY] || "").trim();
    const metalColorTh = String(row[COL.METAL_COLOR] || "").trim();
    const metalTypeTh = String(row[COL.METAL_TYPE] || "").trim();

    const category = CATEGORY_MAP[categoryTh] || "Rings";
    const metalColor = METAL_COLOR_MAP[metalColorTh] || metalColorTh;
    const metalType = METAL_TYPE_MAP[metalTypeTh] || metalTypeTh;

    const rawPrice = row[COL.PRICE];
    const price =
      typeof rawPrice === "number"
        ? rawPrice
        : parseFloat(String(rawPrice || "0").replace(/[^0-9.]/g, ""));

    if (!price || price <= 0) continue;

    const name = buildName(code, categoryTh, metalColorTh, metalTypeTh);

    const specifications: Record<string, string> = {};
    if (code) specifications["Product Code"] = code;
    if (metalColor) specifications["Metal Color"] = metalColor;
    if (metalType) specifications["Metal"] = metalType;

    const diamondWeight = row[COL.DIAMOND_WEIGHT];
    if (diamondWeight) specifications["Total Carat Weight"] = `${diamondWeight} ct`;

    const diamondCount = row[COL.DIAMOND_COUNT];
    if (diamondCount) specifications["Number of Diamonds"] = String(diamondCount);

    const diamondSize = row[COL.DIAMOND_SIZE];
    if (diamondSize) specifications["Diamond Size"] = String(diamondSize);

    const diamondFace = row[COL.DIAMOND_FACE];
    if (diamondFace) specifications["Diamond Face"] = `${diamondFace} mm`;

    const size = row[COL.SIZE];
    if (size && categoryTh === "แหวน") specifications["Ring Size"] = String(size);

    const itemId = row[COL.ITEM_ID];
    if (itemId) specifications["Item ID"] = String(itemId);

    results.push({ code, name, category, price, specifications });
  }

  return results;
}
