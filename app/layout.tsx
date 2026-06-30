import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
