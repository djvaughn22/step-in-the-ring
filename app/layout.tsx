import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Idea to Prototype",
  description:
    "A simple guided workspace for turning an idea into a first working version.",
};

const navItems = [
  { href: "/", label: "Home" },
  { href: "/enter", label: "Start" },
  { href: "/guide", label: "Guide" },
  { href: "/build-card", label: "Build Card" },
  { href: "/projects", label: "Projects" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <header className="site-header">
            <Link className="brand-mark" href="/">
              <span className="brand-dot">•</span>
              <span>
                <strong>Idea to Prototype</strong>
                <small>A guided workspace for first versions.</small>
              </span>
            </Link>

            <nav className="nav-bar" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link key={item.href} className="nav-link" href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>

          {children}

          <footer className="site-footer">
            <p>Private testing. Simple guidance. Small first versions.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
