import type { Metadata, Viewport } from "next";
import "./globals.css";
import OpenMirrorFooter from "./OpenMirrorFooter";
import OpenMirrorNav from "./OpenMirrorNav";
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
          links={[
            { emoji: "🥊", name: "Shape an Idea", href: "/" },
            { emoji: "⚙️", name: "Engine Room", href: "/engines" },
            { emoji: "📦", name: "Live Builds", href: "/live" },
            { emoji: "🧭", name: "How It Works", href: "/how" },
            { emoji: "ℹ️", name: "About StepInTheRing", href: "/about" },
          ]}
        />
        {children}
        <OpenMirrorFooter siteName="StepInTheRing.com" accent="#60A5FA" />
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
