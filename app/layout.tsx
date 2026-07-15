import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://www.supatidajewelry.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Supatida | Lab Grown Diamond Jewelry Thailand",
    template: "%s | Supatida",
  },
  description:
    "Supatida จำหน่ายเครื่องประดับเพชรแล็บกรอน (Lab Grown Diamond) คุณภาพสูง แหวน สร้อยคอ ต่างหู กำไล รับรองมาตรฐาน IGI ราคาสมเหตุสมผล",
  keywords: ["lab grown diamond", "เพชรแล็บกรอน", "เครื่องประดับเพชร", "แหวนเพชร", "สร้อยคอเพชร", "supatida", "IGI certified"],
  authors: [{ name: "Supatida Jewelry" }],
  creator: "Supatida Jewelry",
  openGraph: {
    type: "website",
    locale: "th_TH",
    url: SITE_URL,
    siteName: "Supatida Lab Grown Diamond Jewelry",
    title: "Supatida | Lab Grown Diamond Jewelry Thailand",
    description: "เครื่องประดับเพชรแล็บกรอนคุณภาพสูง แหวน สร้อยคอ ต่างหู กำไล รับรอง IGI",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Supatida Lab Grown Diamond Jewelry" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Supatida | Lab Grown Diamond Jewelry Thailand",
    description: "เครื่องประดับเพชรแล็บกรอนคุณภาพสูง แหวน สร้อยคอ ต่างหู กำไล รับรอง IGI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '4616564218619932');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img height="1" width="1" style={{display:"none"}}
            src="https://www.facebook.com/tr?id=4616564218619932&ev=PageView&noscript=1" alt="" />
        </noscript>
      </head>
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "JewelryStore",
              name: "Supatida Lab Grown Diamond Jewelry",
              url: "https://www.supatidajewelry.com",
              logo: "https://www.supatidajewelry.com/og-default.jpg",
              description: "จำหน่ายเครื่องประดับเพชรแล็บกรอนคุณภาพสูง แหวน สร้อยคอ ต่างหู กำไล รับรองมาตรฐาน IGI",
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                availableLanguage: ["Thai", "English"],
              },
              sameAs: ["https://lin.ee/U9D2iyG"],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
