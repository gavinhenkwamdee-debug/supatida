import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/db";

const SITE_URL = "https://www.supatidajewelry.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getAllProducts();

  const productUrls = products
    .filter((p) => !p.hidden)
    .map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...productUrls,
  ];
}
