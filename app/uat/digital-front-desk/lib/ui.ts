// Small shared style tokens for the Digital Front Desk UI, built on SITR's
// existing CSS variables (app/globals.css) rather than a new palette — the
// same approach app/owner/OwnerHub.tsx uses for its cards.

export const card = {
  background: "var(--panel)",
  color: "var(--text)",
  border: "1px solid var(--line)",
  borderRadius: 16,
  padding: 18,
} as const;

export const inputBase = {
  width: "100%",
  boxSizing: "border-box" as const,
  background: "var(--bg)",
  color: "inherit",
  border: "1px solid var(--line)",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 16,
  fontFamily: "inherit",
};

export const label = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 800,
  color: "var(--muted)",
  margin: "0 0 6px",
} as const;

export const btnPrimary = {
  background: "var(--accent)",
  color: "var(--ink)",
  border: "none",
  borderRadius: 10,
  padding: "11px 18px",
  fontSize: 14,
  fontWeight: 900,
  cursor: "pointer",
} as const;

export const btnQuiet = {
  background: "transparent",
  color: "var(--muted)",
  border: "1px solid var(--line)",
  borderRadius: 10,
  padding: "11px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
} as const;

export const badge = (bg: string, fg = "#0B1220") => ({
  display: "inline-block",
  background: bg,
  color: fg,
  borderRadius: 4,
  padding: "3px 10px",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
});
