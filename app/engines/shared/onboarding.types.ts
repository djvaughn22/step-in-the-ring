/**
 * Shared 1-2-3 engine onboarding model.
 *
 * Every activated engine follows the same public flow:
 *   1. Choose  — what you want to create, on what device
 *   2. Set up  — get the free tools, complete the smallest required setup
 *   3. Create  — follow a guided first project and finish a real result
 *
 * Engine-specific data (tools, paths, steps) lives in data files per engine.
 * This module holds the shared types and the progress persistence.
 */

// ---- Platforms ----
export type Platform = "browser" | "windows" | "macos" | "linux" | "chromeos" | "ios" | "android";

export const PLATFORM_LABELS: Record<Platform, string> = {
  browser: "Browser",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  chromeos: "ChromeOS",
  ios: "iPhone / iPad",
  android: "Android",
};

// ---- Resource cost labels (accurate, no "free" for trials) ----
export type ResourceCost =
  | "free"
  | "free-tier"
  | "free-trial"
  | "included-with-hardware"
  | "open-source"
  | "paid";

export const COST_LABELS: Record<ResourceCost, string> = {
  free: "Free",
  "free-tier": "Free tier",
  "free-trial": "Free trial",
  "included-with-hardware": "Included with registered hardware",
  "open-source": "Free · open source",
  paid: "Paid",
};

// ---- Verified external tool / resource ----
export interface ToolResource {
  id: string;
  name: string;
  purpose: string;
  platforms: Platform[];
  officialUrl: string; // First-party source only.
  cost: ResourceCost;
  accountRequired: boolean;
  installRequired: boolean; // false = runs in the browser.
  source: string; // Who publishes it (e.g., "Akai Professional").
  lastVerifiedAt: string; // YYYY-MM-DD — when the link was last checked.
  notes?: string;
}

// ---- Setup checklist ----
export interface SetupItem {
  id: string;
  label: string;
  detail?: string;
  platforms?: Platform[]; // Omit = all platforms.
  resourceId?: string; // Links the item to a tool above.
}

// ---- Guided first project ----
export interface CreateStep {
  id: string;
  title: string;
  detail: string;
  external?: boolean; // Happens in the external tool, confirmed by the user.
}

// ---- A complete path through an engine (e.g., "no equipment" vs "MIDI controller") ----
export interface CreationPath {
  id: string;
  name: string;
  description: string;
  platforms: Platform[];
  requiredHardware?: string[];
  optionalHardware?: string[];
  toolIds: string[]; // ToolResource ids used by this path.
  setup: SetupItem[];
  steps: CreateStep[];
  output: string; // The real thing you finish with (e.g., "an exported MP3 or WAV of your first beat").
}

// ---- Honest activation status ----
export type EngineActivationStatus =
  | "working"
  | "beta"
  | "setup-ready"
  | "building"
  | "planned"
  | "unavailable";

export const ACTIVATION_LABELS: Record<EngineActivationStatus, string> = {
  working: "Working",
  beta: "Beta",
  "setup-ready": "Setup ready",
  building: "Building",
  planned: "Planned",
  unavailable: "Unavailable",
};

// ---- Full engine onboarding definition ----
export interface EngineOnboarding {
  engineId: string;
  title: string;
  promise: string; // Plain statement of what you will make. No hype.
  status: EngineActivationStatus;
  paths: CreationPath[];
  resources: ToolResource[];
  troubleshooting: { problem: string; fix: string }[];
  limitations: string[]; // Honest known limits, shown to the user.
}

// ---- Progress persistence (local, per engine) ----
export interface OnboardingProgress {
  engineId: string;
  pathId?: string;
  platform?: Platform;
  checkedSetup: Record<string, boolean>;
  completedSteps: Record<string, boolean>;
  output?: { name: string; note?: string; at: string };
  startedAt: string;
  updatedAt: string;
}

const KEY_PREFIX = "sitr-onboarding-v1:";

export function loadProgress(engineId: string): OnboardingProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY_PREFIX + engineId);
    if (!raw) return null;
    const p = JSON.parse(raw) as OnboardingProgress;
    if (!p || p.engineId !== engineId) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProgress(p: OnboardingProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY_PREFIX + p.engineId, JSON.stringify({ ...p, updatedAt: new Date().toISOString() }));
  } catch {
    /* storage full or blocked — progress simply won't persist */
  }
}

export function newProgress(engineId: string): OnboardingProgress {
  const now = new Date().toISOString();
  return { engineId, checkedSetup: {}, completedSteps: {}, startedAt: now, updatedAt: now };
}

export function clearProgress(engineId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY_PREFIX + engineId);
}

// ---- Helpers ----
export function resourcesForPlatform(resources: ToolResource[], platform: Platform): ToolResource[] {
  return resources.filter((r) => r.platforms.includes(platform));
}

export function pathsForPlatform(paths: CreationPath[], platform: Platform): CreationPath[] {
  return paths.filter((p) => p.platforms.includes(platform));
}
