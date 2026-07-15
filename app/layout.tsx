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
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
