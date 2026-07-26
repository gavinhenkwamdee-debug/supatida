"use client";

import { Suspense } from "react";
import Header from "./Header";
import HeroBannerWrapper from "./HeroBannerWrapper";
import PopupBanner from "./PopupBanner";
import Reviews from "./Reviews";

export default function CatalogClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense>
        <Header />
      </Suspense>
      <HeroBannerWrapper />
      {children}
      <Reviews />
      <PopupBanner page="home" />
    </>
  );
}
