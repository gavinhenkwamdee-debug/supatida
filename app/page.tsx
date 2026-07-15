import { Suspense } from "react";
import { getAllProducts } from "@/lib/db";
import CatalogClient from "@/components/CatalogClient";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/db";

interface PageProps {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}

function filterProducts(
  products: Product[],
  category: string | undefined,
  minPrice: string | undefined,
  maxPrice: string | undefined
): Product[] {
  const sorted = [...products].sort((a, b) => {
    const rank = (p: typeof a) => p.soldOut ? 2 : p.badge ? 0 : 1;
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.price - b.price;
  });
  return sorted.filter((p) => {
    if (p.hidden) return false;
    if (category && category !== "All" && p.category !== category) return false;
    if (minPrice && p.price < parseFloat(minPrice)) return false;
    if (maxPrice && p.price > parseFloat(maxPrice)) return false;
    return true;
  });
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const all = await getAllProducts();
  const products = filterProducts(all, sp.category, sp.minPrice, sp.maxPrice);
  const hasFilters = sp.category || sp.minPrice || sp.maxPrice;

  return (
    <div style={{ backgroundColor: "var(--ivory)" }} className="flex flex-col min-h-screen">
      <CatalogClient>
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.4em] uppercase mb-3 font-sans" style={{ color: "var(--gold)" }}>
              {sp.category && sp.category !== "All" ? sp.category : "Collections"}
            </p>
            <h2 className="text-2xl tracking-[0.1em]" style={{ color: "var(--charcoal)" }}>
              {hasFilters ? "Filtered Results" : "All Pieces"}
            </h2>
            <div className="mx-auto mt-4 w-16 h-px" style={{ backgroundColor: "var(--gold)" }} />
          </div>

          {products.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-lg mb-2" style={{ color: "var(--muted)" }}>No pieces found</p>
              <p className="text-sm font-sans" style={{ color: "var(--muted)" }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </div>
          )}

          <p className="text-center mt-8 text-xs tracking-widest uppercase font-sans" style={{ color: "var(--muted)" }}>
            {products.length} {products.length === 1 ? "piece" : "pieces"} shown
          </p>
        </main>

        <footer style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }}
          className="text-center py-8 text-xs tracking-widest uppercase font-sans">
          © {new Date().getFullYear()} Supatida · Lab Grown Diamond Jewelry · All Rights Reserved
        </footer>
      </CatalogClient>
    </div>
  );
}
