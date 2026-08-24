/**
 * Game Idea Session — for a NEW game idea, not an existing one to re-theme.
 *
 * "Make a fun family friendly game" used to land straight in the doku
 * re-theme/deploy studio, which only makes sense once a game concept already
 * exists. This gives that studio a sibling: pick what sounds fun, get a real
 * first game shape back immediately, then refine it one question at a time.
 * Deterministic — no model call, nothing here claims to be AI-generated.
 */

export type Genre = "arcade" | "puzzle" | "sports" | "party" | "cards" | "other";

export const GENRE_LABELS: Record<Genre, string> = {
  arcade: "Arcade",
  puzzle: "Puzzle",
  sports: "Sports",
  party: "Party / Family",
  cards: "Card / Board style",
  other: "Something else",
};

export const GENRES = Object.keys(GENRE_LABELS) as Genre[];

interface ShapeTemplate {
  players: string;
  round: string;
  action: string;
  score: string;
  restart: string;
  obstaclePrompt: string;
  funPrompt: string;
}

const TEMPLATES: Record<Genre, ShapeTemplate> = {
  arcade: {
    players: "1 player (or take turns for a high-score battle)",
    round: "60-second rounds",
    action: "one repeated action — tap, dodge, or catch",
    score: "every successful action, faster or in a row scores more",
    restart: "instant restart, no menu",
    obstaclePrompt: "What speeds up or gets harder the longer you survive?",
    funPrompt: "What's the one satisfying moment that makes someone want to beat their own score?",
  },
  puzzle: {
    players: "1 player",
    round: "one puzzle at a time, no clock unless you want one",
    action: "one simple move — swap, place, or connect",
    score: "fewer moves or less time is better",
    restart: "instant reset of the same puzzle, or a new one",
    obstaclePrompt: "What makes a puzzle harder — more pieces, a trickier layout, a twist rule?",
    funPrompt: "What's the \"aha\" moment when a puzzle clicks into place?",
  },
  sports: {
    players: "2-4 players (or 1 vs. the clock)",
    round: "a short match — a few minutes",
    action: "one core move — throw, kick, swing, or block",
    score: "points for landing the move; most points wins",
    restart: "instant rematch",
    obstaclePrompt: "What does the other player (or the clock) do to make it harder?",
    funPrompt: "What's the moment everyone reacts to — a close call, a comeback, a perfect shot?",
  },
  party: {
    players: "2-4 players, everyone in the room",
    round: "60-90 second rounds",
    action: "one silly or fast action everyone does together",
    score: "points for whoever finishes first or does best",
    restart: "instant next round, someone new goes first",
    obstaclePrompt: "What twist keeps it from getting predictable round after round?",
    funPrompt: "What makes people laugh or groan — a dare, a reveal, a race?",
  },
  cards: {
    players: "2-4 players",
    round: "a hand or a short game, a few minutes",
    action: "one core decision each turn — play, draw, or trade",
    score: "points or cards collected; most (or fewest) wins",
    restart: "instant reshuffle and redeal",
    obstaclePrompt: "What can another player do to block or counter your move?",
    funPrompt: "What's the moment of tension — a bluff, a gamble, a last-card save?",
  },
  other: {
    players: "2-4 players",
    round: "60-second rounds",
    action: "one simple action everyone can learn in ten seconds",
    score: "clear points for doing the one action well",
    restart: "instant restart",
    obstaclePrompt: "What's the one thing that makes it harder as you go?",
    funPrompt: "What's the moment that makes someone want to play again?",
  },
};

export interface GameIdeaSessionV1 {
  version: 1;
  id: string;
  idea: string;
  genre: Genre | null;
  obstacle: string;
  funHook: string;
  round: 0 | 1 | 2 | 3;
  /** The creator chose to stop refining and keep the shape as-is. */
  finished: boolean;
  createdAt: string;
  updatedAt: string;
}

let counter = 0;
export function gameIdeaUid(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function startGameIdea(idea: string, now?: string): GameIdeaSessionV1 {
  const at = now ?? new Date().toISOString();
  return { version: 1, id: gameIdeaUid(), idea: idea.trim(), genre: null, obstacle: "", funHook: "", round: 0, finished: false, createdAt: at, updatedAt: at };
}

export function pickGenre(s: GameIdeaSessionV1, genre: Genre, now?: string): GameIdeaSessionV1 {
  return { ...s, genre, round: 1, updatedAt: now ?? new Date().toISOString() };
}

export function addObstacle(s: GameIdeaSessionV1, obstacle: string, now?: string): GameIdeaSessionV1 {
  return { ...s, obstacle: obstacle.trim(), round: 2, updatedAt: now ?? new Date().toISOString() };
}

export function addFunHook(s: GameIdeaSessionV1, funHook: string, now?: string): GameIdeaSessionV1 {
  return { ...s, funHook: funHook.trim(), round: 3, updatedAt: now ?? new Date().toISOString() };
}

export function keepShape(s: GameIdeaSessionV1, now?: string): GameIdeaSessionV1 {
  return { ...s, finished: true, updatedAt: now ?? new Date().toISOString() };
}

export function changeGenre(s: GameIdeaSessionV1, now?: string): GameIdeaSessionV1 {
  return { ...s, genre: null, obstacle: "", funHook: "", round: 0, finished: false, updatedAt: now ?? new Date().toISOString() };
}

/** The next question worth asking, or null once the creator kept the shape
 *  as-is or this flow has asked everything it asks. */
export function nextPrompt(s: GameIdeaSessionV1): { title: string; placeholder: string } | null {
  if (!s.genre || s.finished) return null;
  const t = TEMPLATES[s.genre];
  if (s.round === 1) return { title: "What's the biggest challenge or obstacle?", placeholder: t.obstaclePrompt };
  if (s.round === 2) return { title: "What makes it fun enough to play again?", placeholder: t.funPrompt };
  return null;
}

/** The real, deterministic output: a first playable shape, growing as the
 *  creator answers more. Never claims to be a finished game — a shape to
 *  build the smallest playable version from. */
export function buildShape(s: GameIdeaSessionV1): string {
  if (!s.genre) return "";
  const t = TEMPLATES[s.genre];
  const lines = [
    `FIRST GAME SHAPE — ${GENRE_LABELS[s.genre]}`,
    s.idea ? `Idea: ${s.idea}` : "",
    "",
    `Players: ${t.players}`,
    `Round: ${t.round}`,
    `Core action: ${t.action}`,
    `Score: ${t.score}`,
    `Restart: ${t.restart}`,
  ];
  if (s.obstacle) lines.push(`Challenge: ${s.obstacle}`);
  if (s.funHook) lines.push(`Why another round: ${s.funHook}`);
  lines.push("", "This is a shape to build from, not a finished game — the smallest playable version is worth making before adding anything else.");
  return lines.filter((l) => l !== "" || lines.indexOf(l) !== 0).join("\n").replace(/\n{3,}/g, "\n\n");
}

/** A copy-ready game design brief — the same shape, framed for a build tool. */
export function buildBrief(s: GameIdeaSessionV1): string {
  const shape = buildShape(s);
  return `Help me build the smallest playable version of this game:\n\n${shape}\n\nGive me the simplest way to make this real and playable, one small piece at a time.`;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

export function parseGameIdeaSession(v: unknown): GameIdeaSessionV1 | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  const genre = typeof o.genre === "string" && (GENRES as string[]).includes(o.genre) ? (o.genre as Genre) : null;
  const round = ([0, 1, 2, 3] as const).includes(o.round as never) ? (o.round as 0 | 1 | 2 | 3) : 0;
  return {
    version: 1,
    id: o.id,
    idea: str(o.idea),
    genre,
    obstacle: str(o.obstacle),
    funHook: str(o.funHook),
    round,
    finished: o.finished === true,
    createdAt: str(o.createdAt, new Date().toISOString()),
    updatedAt: str(o.updatedAt, new Date().toISOString()),
  };
}
