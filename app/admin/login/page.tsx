"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(from);
        router.refresh();
      } else {
        setError("Incorrect password. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--ivory)" }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1
            className="text-2xl tracking-[0.2em] mb-2"
            style={{ color: "var(--charcoal)" }}
          >
            SUPATIDA
          </h1>
          <p
            className="text-xs tracking-[0.3em] uppercase font-sans"
            style={{ color: "var(--gold)" }}
          >
            Admin Access
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8"
          style={{ border: "1px solid var(--border)" }}
        >
          <label
            className="block text-xs tracking-widest uppercase mb-2 font-sans"
            style={{ color: "var(--muted)" }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 text-sm font-sans outline-none mb-4 transition-all"
            style={{
              border: "1px solid var(--border)",
              color: "var(--charcoal)",
              backgroundColor: "#FAFAF7",
            }}
            placeholder="Enter admin password"
            required
            autoFocus
          />

          {error && (
            <p className="text-xs mb-4 font-sans" style={{ color: "#C0392B" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-xs tracking-widest uppercase font-sans transition-opacity disabled:opacity-60"
            style={{
              backgroundColor: "var(--charcoal)",
              color: "var(--gold-light)",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
