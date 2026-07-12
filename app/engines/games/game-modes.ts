/**
 * Game Engine — modes, world schema, and template instantiation.
 *
 * A MODE is a game platform the engine can publish to (OpenDoku first; more
 * plug in the same way). A TEMPLATE is a proven, theme-driven game that lives
 * in the platform's repo. A WORLD is the theme a builder shapes here — the
 * engine swaps it into the template and pushes a real new game live.
 *
 * Pure logic only (no React, no fs) so both the studio UI and the publish API
 * route can import it.
 */

// ============================================================================
// MODES
// ============================================================================

export interface GameTemplate {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  file: string; // path inside the platform repo
}

export interface GameMode {
  id: string;
  name: string;
  emoji: string;
  status: "live" | "planned";
  platform: string; // where published games appear
  blurb: string;
  templates: GameTemplate[];
}

export const GAME_MODES: GameMode[] = [
  {
    id: "opendoku",
    name: "OpenDoku",
    emoji: "🧩",
    status: "live",
    platform: "opendoku.com",
    blurb: "The Open Mirror puzzle-game family. Shape a doku world on a proven template, play it right here, then publish — a real deploy to opendoku.com.",
    templates: [
      {
        id: "sum-mine",
        name: "Sum-Mine",
        emoji: "⛏️",
        blurb: "Mine numbers so every row and column of kept numbers hits its target sum. Four depth tiers, a memory mode, and an endless danger mode. MineDoku is its home world.",
        file: "_templates/sum-mine.html",
      },
    ],
  },
  {
    id: "idontcry-arcade",
    name: "iDontCry Game Lab",
    emoji: "🎮",
    status: "planned",
    platform: "idontcry.com/games",
    blurb: "The family arcade — next platform to plug into the engine the same way.",
    templates: [],
  },
];

export function getMode(id: string): GameMode | undefined {
  return GAME_MODES.find((m) => m.id === id);
}
export function getTemplate(modeId: string, templateId: string): GameTemplate | undefined {
  return getMode(modeId)?.templates.find((t) => t.id === templateId);
}

// ============================================================================
// WORLD (matches the template's __DOKU_THEME__ block)
// ============================================================================

export interface DokuTier {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  size: number;
  lo: number;
  hi: number;
  negCount: number;
  mineMin: number;
  mineMax: number;
}

export interface DokuWorld {
  slug: string;
  name: string;
  emoji: string;
  gem: string;
  tagline: string;
  sub: string;
  cardBlurb: string; // opendoku.com homepage card text
  accentDark: string;
  accentLight: string;
  storagePrefix: string;
  depthStep: number;
  depthUnit: string;
  depthWord: string;
  winWord: string;
  tiers: DokuTier[];
  memory: DokuTier & { studySeconds: number; peeks: number; peekSeconds: number };
  danger: DokuTier & { drainBase: number; drainPerSolve: number; refill: number; chainSeconds: number };
}

// MineDoku — the Sum-Mine template's home world and the form's starting point.
export const MINEDOKU_WORLD: DokuWorld = {
  slug: "minedoku",
  name: "MineDoku",
  emoji: "⛏️",
  gem: "💎",
  tagline: "Mine the numbers that don't belong.",
  sub: "Keep the gems. Every row and column adds to its target.",
  cardBlurb: "Mine the numbers that don't belong — every row and column adds to its target. Surface Dig to The Core, plus Lantern memory digs and Cave-In.",
  accentDark: "#fbbf24",
  accentLight: "#b45309",
  storagePrefix: "mdk",
  depthStep: 10,
  depthUnit: "m",
  depthWord: "Depth",
  winWord: "Wall clear!",
  tiers: [
    { id: "surface", name: "Surface Dig", emoji: "🕯️", blurb: "3×3 · gentle digs to learn the rule", size: 3, lo: 1, hi: 9, negCount: 0, mineMin: 1, mineMax: 1 },
    { id: "shaft", name: "Deep Shaft", emoji: "⛏️", blurb: "4×4 · the real digging starts", size: 4, lo: 1, hi: 9, negCount: 0, mineMin: 1, mineMax: 2 },
    { id: "vein", name: "Diamond Vein", emoji: "💎", blurb: "5×5 · big walls, big sums", size: 5, lo: 1, hi: 9, negCount: 0, mineMin: 1, mineMax: 3 },
    { id: "core", name: "The Core", emoji: "🌋", blurb: "6×6 · lava numbers count against you", size: 6, lo: 1, hi: 12, negCount: 4, mineMin: 2, mineMax: 3 },
  ],
  memory: { id: "lantern", name: "Lantern", emoji: "🔦", blurb: "Memorize the wall before the light goes out — mining reveals, keeping trusts your memory", size: 4, lo: 1, hi: 9, negCount: 0, mineMin: 1, mineMax: 2, studySeconds: 6, peeks: 3, peekSeconds: 1.5 },
  danger: { id: "cavein", name: "Cave-In", emoji: "⚠️", blurb: "Endless quick digs before the roof comes down — chain fast solves to score big", size: 3, lo: 1, hi: 9, negCount: 0, mineMin: 1, mineMax: 1, drainBase: 4, drainPerSolve: 0.35, refill: 35, chainSeconds: 12 },
};

const RESERVED_SLUGS = ["_templates", "icons", "api", "assets"];

export function slugFromName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 30);
}

export function validateWorld(w: DokuWorld): string[] {
  const errors: string[] = [];
  if (!/^[a-z][a-z0-9-]{2,29}$/.test(w.slug)) errors.push("Slug must be 3–30 chars: lowercase letters, numbers, dashes.");
  if (RESERVED_SLUGS.includes(w.slug)) errors.push(`"${w.slug}" is a reserved path.`);
  if (!w.name || w.name.length < 2 || w.name.length > 24) errors.push("Name must be 2–24 characters.");
  if (!w.emoji) errors.push("Pick a game emoji.");
  if (!w.tagline) errors.push("Write a one-line tagline.");
  if (!w.cardBlurb) errors.push("Write the homepage card blurb.");
  if (!/^#[0-9a-fA-F]{6}$/.test(w.accentDark) || !/^#[0-9a-fA-F]{6}$/.test(w.accentLight)) errors.push("Accents must be #rrggbb colors.");
  if (!Array.isArray(w.tiers) || w.tiers.length !== 4) errors.push("The Sum-Mine template needs exactly 4 tiers.");
  const allTiers = [...(w.tiers || []), w.memory, w.danger].filter(Boolean);
  for (const t of allTiers) {
    if (!t.name || !t.id) { errors.push("Every tier needs an id and a name."); break; }
    if (t.size < 3 || t.size > 6) { errors.push(`Tier "${t.name}": size must be 3–6.`); }
    if (t.hi < 1 || t.hi > 20 || t.lo < 1 || t.lo > t.hi) { errors.push(`Tier "${t.name}": number range must be 1 ≤ lo ≤ hi ≤ 20.`); }
    if (t.mineMin < 1 || t.mineMax >= t.size || t.mineMax < t.mineMin) { errors.push(`Tier "${t.name}": mines per row must fit 1 ≤ min ≤ max < size.`); }
    if (t.negCount < 0 || t.negCount > t.size * 2) { errors.push(`Tier "${t.name}": negatives must be 0–${t.size * 2}.`); }
  }
  return errors;
}

// ============================================================================
// TEMPLATE INSTANTIATION (string transforms — used by preview and publish)
// ============================================================================

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

export function buildHeadBlock(w: DokuWorld): string {
  const title = `${w.name} — ${w.tagline.replace(/\.$/, "").toLowerCase()} (an OpenDoku game)`;
  const desc = `${w.name}, an OpenDoku game: ${w.cardBlurb}`;
  return `<!-- __DOKU_HEAD_START__ -->
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:title" content="${esc(`${w.name} — an OpenDoku game`)}">
<meta property="og:description" content="${esc(w.cardBlurb)}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${w.emoji}</text></svg>">
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0b1220">
<!-- __DOKU_HEAD_END__ -->`;
}

export function instantiateTemplate(templateHtml: string, w: DokuWorld): string {
  const themeBlock = `/*__DOKU_THEME_START__*/${JSON.stringify(w, null, 2)}/*__DOKU_THEME_END__*/`;
  let html = templateHtml.replace(/\/\*__DOKU_THEME_START__\*\/[\s\S]*?\/\*__DOKU_THEME_END__\*\//, themeBlock);
  html = html.replace(/<!-- __DOKU_HEAD_START__ -->[\s\S]*?<!-- __DOKU_HEAD_END__ -->/, buildHeadBlock(w));
  return html;
}

export function buildManifest(w: DokuWorld): string {
  return JSON.stringify({
    name: `${w.name} — an OpenDoku game`,
    short_name: w.name,
    description: w.cardBlurb,
    start_url: `/${w.slug}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b1220",
    theme_color: "#0b1220",
    icons: [{ src: `/${w.slug}/icon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" }],
    scope: `/${w.slug}/`,
  }, null, 2);
}

export function buildServiceWorker(w: DokuWorld): string {
  return `// ${w.name} offline cache — the whole game is one file. Generated by the StepInTheRing Game Engine.
const CACHE = '${w.slug}-v1';
const ASSETS = ['/${w.slug}/', '/${w.slug}/manifest.json', '/${w.slug}/icon.svg'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
`;
}

export function buildIconSvg(w: DokuWorld): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<rect width="512" height="512" rx="112" fill="#141d2e"/>
<rect x="14" y="14" width="484" height="484" rx="100" fill="none" stroke="${w.accentDark}" stroke-width="20"/>
<text x="256" y="330" font-size="260" text-anchor="middle">${w.emoji}</text>
</svg>
`;
}

export function buildHomepageCard(w: DokuWorld): string {
  return `  <a class="game" href="/${w.slug}/">
    <div class="row">
      <span class="ico">${w.emoji}</span>
      <span>
        <h2>${esc(w.name)}</h2>
        <p>${esc(w.cardBlurb)}</p>
      </span>
      <span class="go">→</span>
    </div>
  </a>

`;
}

export const CARDS_END_MARKER = "<!-- __DOKU_CARDS_END__";

/** Insert (or replace) this world's card on the opendoku homepage. */
export function upsertHomepageCard(indexHtml: string, w: DokuWorld): string {
  if (!indexHtml.includes(CARDS_END_MARKER)) {
    throw new Error("opendoku index.html is missing the __DOKU_CARDS_END__ marker.");
  }
  // Replace an existing card for this slug so republish stays idempotent.
  const existing = new RegExp(`  <a class="game" href="/${w.slug}/">[\\s\\S]*?</a>\\n\\n`);
  if (existing.test(indexHtml)) return indexHtml.replace(existing, buildHomepageCard(w));
  return indexHtml.replace(CARDS_END_MARKER, buildHomepageCard(w) + CARDS_END_MARKER);
}
