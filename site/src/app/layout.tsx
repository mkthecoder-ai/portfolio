import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "./fonts";
import "./globals.css";
import { PROFILE, SEO } from "@/lib/data";
import { jsonLdString, personJsonLd } from "@/lib/seo";
import { RevealObserver } from "@/components/ui/RevealObserver";

export const metadata: Metadata = {
  metadataBase: new URL(PROFILE.url),
  title: SEO.title,
  description: SEO.description,
  alternates: { canonical: `${PROFILE.url}/` },
  openGraph: { type: "profile", url: `${PROFILE.url}/`, siteName: PROFILE.name, title: SEO.ogTitle, description: SEO.ogDescription, images: [{ url: "/og.png", width: 1200, height: 630, alt: SEO.ogTitle }] },
  twitter: { card: "summary_large_image", title: SEO.ogTitle, description: SEO.ogDescription, images: ["/og.png"] },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/favicon.ico", sizes: "32x32" }], apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#070A0F", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* .js hides reveal items until RevealObserver shows them. If the bundle hasn't started RevealObserver
            within 3s (slow or failed chunks), drop .js so every section is visible anyway. */}
        <script dangerouslySetInnerHTML={{ __html: "var d=document.documentElement;d.classList.add('js');setTimeout(function(){if(!window.__revealReady)d.classList.remove('js')},3000)" }} />
        {/* Spec 5.0 section 9: the live layered hero for wide screens with motion; everyone else gets the static image. */}
        <script dangerouslySetInnerHTML={{ __html: "try{var n=navigator;if(matchMedia('(min-width: 768px)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!(n.connection&&n.connection.saveData))document.documentElement.dataset.hero='live'}catch(e){}" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(personJsonLd()) }} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
        <RevealObserver />
      </body>
    </html>
  );
}
