import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Step In The Ring",
  description: "Step in. Dream it. Create the first version.",
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
