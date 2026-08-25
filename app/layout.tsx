import type { Metadata, Viewport } from "next";
import "./globals.css";
import OpenMirrorFooter from "./OpenMirrorFooter";
import RingHeader from "./site/RingHeader";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://stepinthering.com"),
  title: {
    default: "StepInTheRing",
    template: "%s | StepInTheRing",
  },
  description:
    "Say a rough idea in your own words. Walk out with a plan for version one and a builder prompt worth using — then build it with free tools, test it locally, and push it live.",
  applicationName: "Step In The Ring",
  appleWebApp: { capable: true, title: "The Ring", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Step In The Ring",
    description:
      "Say it rough. Leave with a plan and a builder prompt. Part of Open Mirror LLC.",
    url: "https://stepinthering.com",
    siteName: "Step In The Ring",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#08182B",
  // Without this, mobile browsers guess the native chrome color (scrollbar,
  // form controls, and on iOS the overscroll "rubber-band" area past the
  // top/bottom of the page) from the OS's prefers-color-scheme — which
  // defaults to light for most visitors — even though the page itself is
  // already dark. That guess is what read as "mobile shows white": the page
  // content was always dark, but the native chrome around/behind it wasn't
  // told to be. Static here because it's in the server-rendered <head>
  // before any JS runs, so there's no flash on first paint. The theme
  // toggle (OpenMirrorTheme.tsx) updates document.documentElement.style.
  // colorScheme to match after an explicit light choice.
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

// Real root cause of the mobile white flash, found 2026-08-25 by actually
// reproducing it (not just inspecting CSS): the equivalent theme-init script
// already existed, but only inside RingHeader — a client component that
// renders after the external stylesheet <link> in <head>. On a fast local
// connection the stylesheet arrives before that script matters, so testing
// here never showed a flash. On a real phone on a real network, the browser
// paints the FIRST frame before the external stylesheet has necessarily
// finished loading, using no author background at all — and without
// color-scheme set yet, that first frame is the browser's own default:
// white. This script is the literal first thing in <head>, runs before any
// network request for CSS/JS can block it, and sets color-scheme on the
// root element directly via inline style (which paints instantly, no
// stylesheet needed) — modern browsers use color-scheme to choose their own
// default canvas color when nothing else has painted yet, so this alone
// makes the very first frame dark. RingHeader's copy of this logic stays as
// a no-op fallback (its own `if (d.dataset.omTheme) return` guard) for any
// path that doesn't run this head script.
// Three stored states — "dark", "light", "system" — kept in sync BY HAND
// with app/OpenMirrorTheme.tsx's THEME_INIT_JS (same logic, this one just
// runs first). A fresh visitor (nothing saved, or an unrecognized value)
// gets DARK, never "system" and never a raw prefers-color-scheme read —
// that's the product default, not a guess.
const HEAD_THEME_INIT_JS = `(function(){try{
var d=document.documentElement;
var m=localStorage.getItem("om-theme");
var t=m==="light"?"light":m==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):"dark";
d.dataset.omTheme=t;
d.style.colorScheme=t;
}catch(e){d.style.colorScheme="dark";}})();`.replace(/\n/g, "");

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: HEAD_THEME_INIT_JS }} />
      </head>
      <body>
        {/* Step In The Ring carries its own bar so the doors are visible on a
            laptop instead of buried in a hamburger. Links derive from the site
            registry, so the bar and the Everything directory can't disagree. */}
        <RingHeader />
        {children}
        <OpenMirrorFooter />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-Y89TD7NPS0"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y89TD7NPS0');`}
        </Script>
      </body>
    </html>
  );
}
