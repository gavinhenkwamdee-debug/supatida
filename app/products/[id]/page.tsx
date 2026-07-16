import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/db";
import ProductDetailClient from "@/components/ProductDetailClient";

export const dynamic = "force-dynamic";

const SITE_URL = "https://www.supatidajewelry.com";

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

  const priceFormatted = new Intl.NumberFormat("th-TH", {
    style: "currency", currency: "THB", maximumFractionDigits: 0,
  }).format(product.price);

  const image = product.images.filter(Boolean)[0] ?? null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.category} Lab Grown Diamond by Supatida`,
    image: image ? [image] : [],
    brand: { "@type": "Brand", name: "Supatida" },
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/products/${product.id}`,
      priceCurrency: "THB",
      price: product.price,
      availability: product.soldOut
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Supatida Jewelry" },
    },
    ...(product.specifications["Total Carat Weight"] && {
      additionalProperty: [{
        "@type": "PropertyValue",
        name: "Total Carat Weight",
        value: product.specifications["Total Carat Weight"],
      }],
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
