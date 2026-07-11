/**
 * ShopPreview — portable storefront section.
 *
 * Self-contained (family palette hard-coded, no app-specific imports beyond
 * the products data) so it can be copied into the Open Mirror hub unchanged
 * when the shop is ready to go public there.
 *
 * Server component — no client JS needed to display products.
 */

import { SHOP_COPY, SHOP_PRODUCTS, type ShopProduct } from "./products";

// Open Mirror family flat palette.
const bg = "#0b1220";
const card = "#141d2e";
const border = "#26324c";
const text = "#e8edf5";
const sub = "#94a3b8";
const gold = "#FBBF24";

function ProductCard({ p }: { p: ShopProduct }) {
  const live = p.status === "published" && !!p.etsyUrl;
  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderLeft: `5px solid ${gold}`, borderRadius: 18, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <h3 style={{ fontSize: 17, fontWeight: 900, color: text, margin: 0 }}>{p.title}</h3>
        {live && p.price ? (
          <span style={{ fontSize: 14, fontWeight: 800, color: gold, flexShrink: 0 }}>{p.price}</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: sub, border: `1px solid ${border}`, borderRadius: 50, padding: "3px 10px", flexShrink: 0 }}>
            Coming soon
          </span>
        )}
      </div>
      <p style={{ fontSize: 14, color: sub, margin: 0, lineHeight: 1.55 }}>{p.description}</p>
      <p style={{ fontSize: 12.5, color: sub, margin: 0 }}>{p.productType}</p>
      {live && (
        <a href={p.etsyUrl} target="_blank" rel="noopener noreferrer"
          style={{ alignSelf: "flex-start", background: gold, color: "#0C0C0C", borderRadius: 50, padding: "9px 18px", fontSize: 14, fontWeight: 900, textDecoration: "none", marginTop: 4 }}>
          View on Etsy →
        </a>
      )}
    </div>
  );
}

export default function ShopPreview() {
  const visible = SHOP_PRODUCTS.filter((p) => p.status === "published" || p.status === "coming-soon");

  return (
    <section style={{ background: bg, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "44px 20px 80px" }}>
        <header style={{ textAlign: "center", marginBottom: 36 }}>
          <h1 style={{ fontSize: "clamp(1.8rem, 8vw, 2.6rem)", fontWeight: 900, color: text, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            {SHOP_COPY.title}
          </h1>
          <p style={{ fontSize: 15, color: sub, margin: "0 auto", maxWidth: 460, lineHeight: 1.6 }}>
            {SHOP_COPY.intro}
          </p>
        </header>

        {visible.length === 0 ? (
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 18, padding: "28px 24px", textAlign: "center" }}>
            <p style={{ fontSize: 15, color: text, fontWeight: 700, margin: "0 0 8px" }}>Nothing for sale yet.</p>
            <p style={{ fontSize: 14, color: sub, margin: 0, lineHeight: 1.6 }}>{SHOP_COPY.emptyState}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {visible.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </section>
  );
}
