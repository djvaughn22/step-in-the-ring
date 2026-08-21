import type { Metadata, Viewport } from "next";
import "./globals.css";
import OpenMirrorFooter from "./OpenMirrorFooter";
import OpenMirrorNav from "./OpenMirrorNav";
import Script from "next/script";
import { navPages } from "./site/registry";

/** Menu emoji live here, not in the registry — the registry is product data. */
const NAV_EMOJI: Record<string, string> = {
  "/": "🥊",
  "/builds": "🏗️",
  "/explore": "🔭",
  "/library": "📚",
  "/everything": "🗺️",
};

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
  themeColor: "#0b1220",
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
        <OpenMirrorNav
          site="StepInTheRing.com"
          accent="#60A5FA"
          /* Five doors, and they answer five questions in order: what do I
             want to make, what have I made, what has anyone made, what can
             this thing do, and where is the rest of it. Everything else lives
             one level down and is reachable from Everything — the menu is not
             the product. Nav order is derived from app/site/registry.ts so it
             can't drift from the directory; see navPages(). */
          links={navPages().map((p) => ({
            emoji: NAV_EMOJI[p.path],
            name: p.name,
            href: p.path,
          }))}
        />
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
