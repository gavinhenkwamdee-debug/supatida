import Link from "next/link";
import { ABOUT_PAGES } from "@/lib/about-config";

export default function AboutNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap justify-center gap-2 mb-8">
      {ABOUT_PAGES.map((p) => (
        <Link
          key={p.slug}
          href={`/about/${p.slug}`}
          className="px-3 py-2 text-xs tracking-widest uppercase font-sans transition-colors"
          style={{
            color: active === p.slug ? "var(--gold-dark)" : "var(--muted)",
            borderBottom: active === p.slug ? "2px solid var(--gold-dark)" : "2px solid transparent",
          }}
        >
          {p.label}
        </Link>
      ))}
    </nav>
  );
}
