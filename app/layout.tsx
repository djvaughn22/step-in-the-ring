import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Step In The Ring",
  description:
    "A simple guided workspace for turning an idea into a first working prototype.",
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
              <span className="brand-ring">○</span>
              <span>
                <strong>Step In The Ring</strong>
                <small>Idea to prototype, one step at a time.</small>
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
            <p>
              Private family testing. Simple guidance. Approved projects only.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
