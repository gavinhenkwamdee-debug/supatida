"use client";

import { useEffect, useState } from "react";

export default function IgiLogo() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/settings/igi")
      .then((r) => r.json())
      .then((d) => setEnabled(d.enabled))
      .catch(() => {});
  }, []);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 pointer-events-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/igi-logo.png"
        alt="IGI Certified"
        style={{ width: "80px", opacity: 0.85 }}
      />
    </div>
  );
}
