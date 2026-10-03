import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSilverConfig, getAllSilverProducts } from "@/lib/silverJewelry";
import SilverJewelryPageClient from "@/components/SilverJewelryPageClient";

export const metadata: Metadata = {
  title: "Premium Silver",
  description: "Premium Silver by Supatida — Starter, Elegance และ Luxury เครื่องประดับเงินแท้สามระดับ",
};

export const revalidate = 60;

export default async function SilverJewelryPage() {
  const [config, allProducts] = await Promise.all([getSilverConfig(), getAllSilverProducts()]);
  if (!config.enabled) notFound();
  const products = allProducts.filter((p) => !p.hidden);

  return <SilverJewelryPageClient config={config} products={products} />;
}
