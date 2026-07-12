import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/db";
import ProductDetailClient from "@/components/ProductDetailClient";

const SITE_URL = "https://supatida.vercel.app";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) return { title: "Supatida" };

  const priceFormatted = new Intl.NumberFormat("th-TH", {
    style: "currency", currency: "THB", maximumFractionDigits: 0,
  }).format(product.price);

  const description = product.soldOut
    ? `${product.category} · SOLD OUT · Lab Grown Diamond by Supatida`
    : `${product.category} · ${priceFormatted} · Lab Grown Diamond by Supatida`;

  const image = product.images.filter(Boolean)[0] ?? null;

  return {
    title: `${product.name} | Supatida`,
    description,
    openGraph: {
      title: product.name,
      description,
      url: `${SITE_URL}/products/${product.id}`,
      siteName: "Supatida Lab Grown Diamond",
      ...(image && { images: [{ url: image, width: 1200, height: 1200, alt: product.name }] }),
      locale: "th_TH",
      type: "website",
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product.name,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(Number(id));
  if (!product) notFound();
  return <ProductDetailClient product={product} />;
}
