import type { Metadata, Viewport } from "next";
import "./globals.css";
import OpenMirrorFooter from "./OpenMirrorFooter";
import OpenMirrorNav from "./OpenMirrorNav";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://stepinthering.com"),
  title: {
    default: "Step In The Ring — seven questions to a real first build",
    template: "%s",
  },
  description:
    "Bring a rough idea, answer seven questions, walk out with a plan for version one — then build it with free tools, test it locally, and push it live.",
  applicationName: "Step In The Ring",
  appleWebApp: { capable: true, title: "The Ring", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Step In The Ring",
    description:
      "Seven questions, one fight plan, a real first build. Part of Open Mirror LLC.",
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
        <OpenMirrorNav site="StepInTheRing.com" />
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
