"use client";

import { Suspense } from "react";
import Header from "./Header";
import HeroBannerWrapper from "./HeroBannerWrapper";
import IgiLogo from "./IgiLogo";

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
      <IgiLogo />
    </>
  );
}
