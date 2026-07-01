const XLSX = require('./node_modules/xlsx');

const CATEGORY_MAP = {
  แหวน: "Rings", ต่างหู: "Earrings", สร้อยข้อมือ: "Bracelets",
  สร้อยคอ: "Necklaces", จี้: "Pendants", กำไล: "Bracelets",
};
const METAL_COLOR_MAP = {
  ทองซีด: "Yellow Gold", โรสโกลด์: "Rose Gold", ทองคำขาว: "White Gold",
  เงิน: "Silver", แพลทินัม: "Platinum", ทองแดง: "Rose Gold",
};
const METAL_TYPE_MAP = {
  "14K": "14K Gold", "18K": "18K Gold", "10K": "10K Gold",
  "10k": "10K Gold", "9K": "9K Gold", PT950: "Platinum 950", Silver: "Silver",
};

const COL = {
  CODE: 0, CATEGORY: 1, STATUS: 2, DIAMOND_POS: 4, METAL_COLOR: 5,
  ITEM_ID: 6, SIZE: 7, DIAMOND_SIZE: 8, DIAMOND_FACE: 9,
  DIAMOND_COUNT: 10, DIAMOND_WEIGHT: 11, METAL_TYPE: 14, PRICE: 32,
};

const filePath = process.argv[2];
if (!filePath) { console.error("Usage: node import-excel.js <path>"); process.exit(1); }

const wb = XLSX.readFile(filePath);
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

const products = [];
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
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
  const price = typeof rawPrice === "number"
    ? rawPrice
    : parseFloat(String(rawPrice || "0").replace(/[^0-9.]/g, ""));
  if (!price || price <= 0) continue;

  const colorPart = metalColor || "";
  const karatPart = metalType || "";
  const catSingular = (CATEGORY_MAP[categoryTh] || "Jewelry").replace(/s$/, "");
  const name = [colorPart, karatPart, "Diamond", catSingular].filter(Boolean).join(" ");

  const specifications = {};
  if (code) specifications["Product Code"] = code;
  if (metalColor) specifications["Metal Color"] = metalColor;
  if (metalType) specifications["Metal"] = metalType;
  const dw = row[COL.DIAMOND_WEIGHT];
  if (dw) specifications["Total Carat Weight"] = `${dw} ct`;
  const dc = row[COL.DIAMOND_COUNT];
  if (dc) specifications["Number of Diamonds"] = String(dc);
  const ds = row[COL.DIAMOND_SIZE];
  if (ds) specifications["Diamond Size"] = String(ds);
  const df = row[COL.DIAMOND_FACE];
  if (df) specifications["Diamond Face"] = `${df} mm`;
  const sz = row[COL.SIZE];
  if (sz && categoryTh === "แหวน") specifications["Ring Size"] = String(sz);
  const itemId = row[COL.ITEM_ID];
  if (itemId) specifications["Item ID"] = String(itemId);

  products.push({ name, price, category, specifications });
}

console.log(`Found ${products.length} products, importing...`);

async function run() {
  const res = await fetch("https://supatida.vercel.app/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products }),
  });
  const data = await res.json();
  console.log("Done:", data);
}

run().catch(console.error);
