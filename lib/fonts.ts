import localFont from "next/font/local";

// Supatida's brand type system:
//   Headlines (English) — Miller Banner
//   Body/labels (English) — Graphie
//   Accent/script flourish — Louella
// Thai continues to use next/font/google's Noto Sans Thai where it's
// already wired in (e.g. the campaign page) — no separate Thai family here.
export const millerBanner = localFont({
  src: [
    { path: "../app/fonts/MillerBanner-Roman.ttf", weight: "400", style: "normal" },
    { path: "../app/fonts/MillerBanner-SemiBold.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-miller-banner",
  display: "swap",
});

// The brand guide's body weight is "Graphie Book" — only SemiBold was
// supplied, so body text will read a little heavier than the guide's
// intent until a Book/Regular weight file is provided.
export const graphie = localFont({
  src: "../app/fonts/Graphie-SemiBold.otf",
  variable: "--font-graphie",
  display: "swap",
});

export const louella = localFont({
  src: "../app/fonts/Louella.otf",
  variable: "--font-louella",
  display: "swap",
});
