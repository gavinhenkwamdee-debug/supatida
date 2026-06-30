import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const DB_PATH = join(process.cwd(), "data", "db.json");

export interface Specifications {
  [key: string]: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  specifications: Specifications;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface DB {
  lastId: number;
  products: Product[];
}

function readDB(): DB {
  const raw = readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DB;
}

function writeDB(db: DB): void {
  writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function getAllProducts(): Product[] {
  return readDB().products;
}

export function getProductById(id: number): Product | undefined {
  return readDB().products.find((p) => p.id === id);
}

export function createProduct(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">
): Product {
  const db = readDB();
  const now = new Date().toISOString();
  const product: Product = {
    ...data,
    id: db.lastId + 1,
    createdAt: now,
    updatedAt: now,
  };
  db.products.push(product);
  db.lastId = product.id;
  writeDB(db);
  return product;
}

export function updateProduct(
  id: number,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Product | null {
  const db = readDB();
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) return null;
  db.products[index] = {
    ...db.products[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writeDB(db);
  return db.products[index];
}

export function deleteProduct(id: number): boolean {
  const db = readDB();
  const before = db.products.length;
  db.products = db.products.filter((p) => p.id !== id);
  if (db.products.length === before) return false;
  writeDB(db);
  return true;
}

export const CATEGORIES = [
  "Rings",
  "Necklaces",
  "Earrings",
  "Bracelets",
  "Pendants",
];

export const PRICE_RANGES = [
  { label: "Under $1,000", min: 0, max: 1000 },
  { label: "$1,000 – $3,000", min: 1000, max: 3000 },
  { label: "$3,000 – $6,000", min: 3000, max: 6000 },
  { label: "$6,000+", min: 6000, max: Infinity },
];
