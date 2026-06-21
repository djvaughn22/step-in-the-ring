import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Step In The Ring",
  description: "A simple place to turn an idea into a saved first version.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <Link href="/" className="brand">Step In The Ring</Link>
          <Link href="/projects" className="navlink">Projects</Link>
        </header>
        {children}
      </body>
    </html>
  );
}
