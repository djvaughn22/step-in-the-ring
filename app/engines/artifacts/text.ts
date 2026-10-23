// Small, deterministic readers for what a visitor typed. No AI — these pull
// the concrete facts (dates, money, roles, actions) an artifact needs so the
// output is about THIS visitor's project instead of a template.

export type Answers = Record<string, string>;

/** "I don't know" is a valid answer everywhere. It reads as unknown. */
const UNKNOWN = /^\s*(i\s*do\s*n['’]?t\s*know|dont\s*know|don['’]?t\s*know|not\s*sure|no\s*idea|idk|unsure|unknown|n\/?a|none\s*yet\??|\?+|-)\s*\.?\s*$/i;

export const IDK = "I don't know";

export function isUnknown(text: string | undefined): boolean {
  const t = (text ?? "").trim();
  return t.length === 0 || UNKNOWN.test(t);
}

/** The answer, or "" when blank or "I don't know". */
export function known(a: Answers, ...keys: string[]): string {
  for (const k of keys) {
    const v = (a[k] ?? "").trim();
    if (!isUnknown(v)) return v;
  }
  return "";
}

export const stripEnd = (s: string) => s.trim().replace(/[.!\s]+$/, "");
export const lowerFirst = (s: string) => (/^(?:[A-Z][a-z]|[AI] [a-z])/.test(s) && !/^I /.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
export const upperFirst = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
export const bullets = (items: string[]) => items.filter(Boolean).map((s) => `- ${s}`).join("\n");
export const numbered = (items: string[]) => items.filter(Boolean).map((s, i) => `${i + 1}. ${s}`).join("\n");

export function firstSentence(s: string): string {
  return (s.split(/(?<=[.!?])\s|\n/)[0] ?? s).trim();
}

export function shortName(s: string, max = 48): string {
  let t = stripEnd(firstSentence(s)).replace(/^(i want to|i'd like to|we want to|we need to|help me|i need to|i'm|we're|we are|i am)\s+/i, "").replace(/^(a|an|the|my|our)\s+/i, "");
  // "School fundraiser in six weeks with a big goal" → "School fundraiser".
  const cut = t.split(/\s+(?:in|with|by|before|within|over|that|which|where|so)\s+/i)[0];
  if (cut.split(" ").length >= 2) t = cut;
  return upperFirst(t.length > max ? `${t.slice(0, max - 1).trim()}…` : t);
}

// ---- numbers, money, dates -------------------------------------------------

const NUMBER_WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
  nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, couple: 2, few: 3,
};

function toNumber(w: string): number | null {
  const n = Number(w.replace(/,/g, ""));
  if (Number.isFinite(n)) return n;
  return NUMBER_WORDS[w.toLowerCase()] ?? null;
}

/** A dollar amount ("3k", "3000 dollars", or a dollar sign before digits) → a number. */
export function parseMoney(text: string): number | null {
  const m = text.match(/\$\s?([\d,]+(?:\.\d+)?)\s*(k|thousand)?\b/i) ?? text.match(/\b([\d,]+(?:\.\d+)?)\s*(k|thousand)?\s*(?:dollars|usd|bucks)\b/i);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  return m[2] ? n * 1000 : n;
}

export function money(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

/** Count of people in "me and 3 volunteers", "a few parents", "5 of us". */
export function parseHeadcount(text: string): number | null {
  const t = text.toLowerCase();
  const m = t.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|few|couple)\s+(?:other\s+)?(?:parent\s+)?(volunteers?|parents?|people|friends?|helpers?|of us|teammates?|moms?|dads?|teachers?)/);
  if (!m) return /\bjust me\b|\bmyself\b|\bonly me\b/.test(t) ? 1 : null;
  const n = toNumber(m[1]) ?? 0;
  const includesMe = /\b(me|i|myself)\b/.test(t) && !/of us/.test(m[0]);
  return n + (includesMe ? 1 : 0);
}

const DAY = 86_400_000;

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY);
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** A deadline from "six weeks", "in 10 days", "Dec 5", "2026-12-05", "12/5". */
export function parseDeadline(text: string, now: Date): { date: Date; days: number; from: string } | null {
  const t = text.toLowerCase();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const span = t.match(/\b(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|couple|few)\s+(?:more\s+)?(day|week|month)s?\b/);
  if (span) {
    const n = toNumber(span[1]);
    if (n) {
      const days = span[2] === "day" ? n : span[2] === "week" ? n * 7 : n * 30;
      return { date: addDays(today, days), days, from: span[0] };
    }
  }
  const iso = t.match(/\b(20\d\d)-(\d\d)-(\d\d)\b/);
  if (iso) {
    const date = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    return { date, days: Math.round((date.getTime() - today.getTime()) / DAY), from: iso[0] };
  }
  const named = t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?\b/) ??
    t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/);
  const slash = t.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  let month = -1, day = -1;
  if (named) {
    const [a, b] = [named[1], named[2]];
    if (/^\d/.test(a)) { day = +a; month = MONTHS.indexOf(b.slice(0, 3)); } else { month = MONTHS.indexOf(a.slice(0, 3)); day = +b; }
  } else if (slash) {
    month = +slash[1] - 1; day = +slash[2];
  }
  if (month >= 0 && day > 0 && day <= 31) {
    let date = new Date(Date.UTC(today.getUTCFullYear(), month, day));
    if (date < today) date = new Date(Date.UTC(today.getUTCFullYear() + 1, month, day));
    return { date, days: Math.round((date.getTime() - today.getTime()) / DAY), from: (named ?? slash)![0] };
  }
  if (/\bnext week\b/.test(t)) return { date: addDays(today, 7), days: 7, from: "next week" };
  if (/\bnext month\b/.test(t)) return { date: addDays(today, 30), days: 30, from: "next month" };
  if (/\btomorrow\b/.test(t)) return { date: addDays(today, 1), days: 1, from: "tomorrow" };
  return null;
}

/** The first weekday on or after `d` matching `dow` (0 = Sunday). */
export function nextWeekday(d: Date, dow: number): Date {
  const diff = (dow - d.getUTCDay() + 7) % 7;
  return addDays(d, diff);
}

// ---- words ------------------------------------------------------------------

export function singular(word: string): string {
  const w = word.toLowerCase();
  if (/(ss|us|is)$/.test(w)) return w;
  if (/ies$/.test(w)) return w.replace(/ies$/, "y");
  if (/(ches|shes|xes|zes|sses)$/.test(w)) return w.replace(/es$/, "");
  if (w === "children") return "child";
  if (w === "people") return "person";
  if (/s$/.test(w)) return w.slice(0, -1);
  return w;
}

export function plural(word: string): string {
  const w = word.toLowerCase();
  if (w === "child") return "children";
  if (w === "person") return "people";
  if (/[^aeiou]y$/.test(w)) return w.replace(/y$/, "ies");
  if (/(s|x|z|ch|sh)$/.test(w)) return `${w}es`;
  return `${w}s`;
}

export function has(text: string, re: RegExp): boolean {
  return re.test(text.toLowerCase());
}
