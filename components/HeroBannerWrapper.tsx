"use client";

import { useEffect, useState } from "react";
import HeroBanner from "./HeroBanner";
import type { HeroBannerConfig } from "@/lib/hero-banner-config";

export default function HeroBannerWrapper() {
  const [config, setConfig] = useState<HeroBannerConfig | null>(null);

  useEffect(() => {
    fetch("/api/settings/hero-banner")
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  if (!config || !config.enabled || config.slides.length === 0) return null;
  return <HeroBanner slides={config.slides} />;
}
