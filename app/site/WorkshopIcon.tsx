/** Small, cohesive line icons for actions, distinct from the product mark. */
const PATHS: Record<string, React.ReactNode> = {
  // Create: a pen drawing a line.
  create: <path d="m5 16-1 4 4-1L20 7l-3-3ZM14 7l3 3" />,
  // Plan: a route from one point to another.
  solve: <><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9" /></>,
  plan: <><circle cx="5" cy="5" r="2" /><circle cx="19" cy="19" r="2" /><path d="M7 5h9a4 4 0 0 1 0 8H8a3 3 0 0 0 0 6h9" /></>,
  // Build: a browser window with code brackets.
  build: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18m-11 4-3 2 3 2m4-4 3 2-3 2" /></>,
  // Write: lined page.
  write: <><path d="M6 3h9l4 4v14H6Z" /><path d="M15 3v4h4M9 12h7M9 16h5" /></>,
  // Saved work: a folder.
  saved: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />,
  game: <><rect x="3" y="7" width="18" height="11" rx="4" /><path d="M8 11v3m-1.5-1.5h3M15.5 12h.01M17.5 14h.01" /></>,
  music: <><path d="M9 18V5l11-2v13" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="17.5" cy="16" r="2.5" /></>,
  art: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="m3 17 5-4 4 3 3-2 6 4" /></>,
  fix: <path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-3-3 8-8M4 20l6-6M3 10l4-4 3 3-4 4Z" />,
  team: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2" /><path d="M3 20a6 6 0 0 1 12 0M15 15a4 4 0 0 1 6 4" /></>,
  business: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M9 7V5h6v2M3 12h18" /></>,
  time: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M10 3h4" /></>,
  idea: <><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3Z" /></>,
};

/** Maps the emoji kept in older data (starting points, starters) to a line icon. */
const FROM_EMOJI: Record<string, string> = {
  "🌐": "build", "🛠️": "build", "💻": "build", "🧱": "build",
  "🎮": "game", "🎲": "game",
  "🎨": "art", "🎵": "music", "✍️": "write", "📓": "write",
  "🔧": "fix", "🏈": "team", "💼": "business", "⏱️": "time",
  "🧭": "plan", "💡": "idea", "🗂️": "saved", "📦": "saved", "🧰": "create",
};

export function iconKindFor(emoji: string): string {
  return FROM_EMOJI[emoji] ?? "create";
}

export default function WorkshopIcon({ kind }: { kind: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {PATHS[kind] ?? PATHS.build}
    </svg>
  );
}
