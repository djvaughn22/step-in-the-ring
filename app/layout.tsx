import type { Metadata } from "next";
import "./globals.css";
import OpenMirrorFooter from "./OpenMirrorFooter";

export const metadata: Metadata = {
  title: "Step In The Ring",
  description: "Turn a rough idea into a simple first MVP. Parent-guided idea builder.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <OpenMirrorFooter siteName="StepInTheRing.com" />
      </body>
    </html>
  );
}
