import type { Metadata } from "next";
import "./globals.css";
import OpenMirrorFooter from "./OpenMirrorFooter";
import OpenMirrorNav from "./OpenMirrorNav";

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
        <OpenMirrorNav site="StepInTheRing.com" />
        {children}
        <OpenMirrorFooter siteName="StepInTheRing.com" accent="#60A5FA" />
      </body>
    </html>
  );
}
