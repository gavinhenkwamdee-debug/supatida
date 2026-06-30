"use client";

import { Suspense } from "react";
import Header from "./Header";

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
      {children}
    </>
  );
}
