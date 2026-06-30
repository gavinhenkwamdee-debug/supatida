"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const isLogin = pathname === "/admin/login";
  if (isLogin) return <>{children}</>;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#F2F0EB" }}>
      {/* Admin header */}
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: "var(--charcoal)", color: "var(--gold-light)" }}
      >
        <div className="flex items-center gap-6">
          <span className="text-base tracking-[0.2em]">SUPATIDA</span>
          <span className="text-xs opacity-40">|</span>
          <span className="text-xs tracking-widest uppercase opacity-70">Admin Panel</span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-100 opacity-70"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/import"
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-100 opacity-70"
          >
            Bulk Import
          </Link>
          <Link
            href="/"
            target="_blank"
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-100 opacity-70"
          >
            View Site ↗
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-100 opacity-70"
          >
            Sign Out
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
