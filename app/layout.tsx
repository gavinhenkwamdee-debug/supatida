import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Supatida | Lab Grown Diamond Jewelry",
  description:
    "Discover Supatida's exquisite collection of certified lab grown diamond jewelry — ethically created, brilliantly beautiful.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
