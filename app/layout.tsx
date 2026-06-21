import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "First Version",
  description: "A simple place to turn an idea into a first plan.",
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
