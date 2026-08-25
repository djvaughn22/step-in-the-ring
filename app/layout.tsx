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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en">
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
