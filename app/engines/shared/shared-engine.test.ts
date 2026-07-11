// Shared engine state tests: status machine, persistence, onboarding progress,
// platform filtering, and access-code validation.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STATUS_TRANSITIONS, CREATION_STATUS_LABELS, type CreationStatus } from "./creation-engine.types";
import {
  loadProgress, newProgress, saveProgress, clearProgress,
  pathsForPlatform, resourcesForPlatform,
  type CreationPath, type ToolResource,
} from "./onboarding.types";

// ---- localStorage stub (persistence modules check `typeof window`) ----
function makeStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("window", { localStorage: makeStorage() });
});
afterEach(() => {
  vi.unstubAllGlobals();
});

// ---- Status machine ----
describe("creation status machine", () => {
  it("labels every status", () => {
    (Object.keys(STATUS_TRANSITIONS) as CreationStatus[]).forEach((s) => {
      expect(CREATION_STATUS_LABELS[s]).toBeTruthy();
    });
  });

  it("every transition target is a valid status", () => {
    const valid = new Set(Object.keys(STATUS_TRANSITIONS));
    Object.values(STATUS_TRANSITIONS).flat().forEach((target) => {
      expect(valid.has(target)).toBe(true);
    });
  });

  it("follows the happy path from spark to published", () => {
    const path: CreationStatus[] = [
      "spark", "exploring", "selected", "creating",
      "ready-for-review", "approved", "ready-to-export", "ready-to-publish", "published",
    ];
    for (let i = 0; i < path.length - 1; i++) {
      expect(STATUS_TRANSITIONS[path[i]]).toContain(path[i + 1]);
    }
  });

  it("does not allow skipping review", () => {
    expect(STATUS_TRANSITIONS["creating"]).not.toContain("published");
    expect(STATUS_TRANSITIONS["spark"]).not.toContain("approved");
  });
});

// ---- Project persistence ----
describe("project persistence", () => {
  it("creates, saves, loads, and deletes a project", async () => {
    const { createProject, updateProject, getProject, deleteProject, loadProjects } = await import("./persistence");
    const p = createProject("design-shop", "Test Design", { idea: "cards" });
    expect(p.status).toBe("spark");
    expect(p.versions).toHaveLength(1);

    updateProject(p);
    expect(getProject(p.id)?.name).toBe("Test Design");
    expect(loadProjects()).toHaveLength(1);

    deleteProject(p.id);
    expect(getProject(p.id)).toBeNull();
  });

  it("saves and restores versions", async () => {
    const { createProject, updateProject, saveVersion, restoreVersion, getProject } = await import("./persistence");
    const p = createProject("design-shop", "Versioned", {});
    p.buildContent = { design: "v1" };
    p.status = "creating";
    updateProject(p);
    saveVersion(p.id, "checkpoint");

    const withVersion = getProject(p.id)!;
    withVersion.buildContent = { design: "v2" };
    withVersion.status = "ready-for-review";
    updateProject(withVersion);

    const versionId = getProject(p.id)!.versions[1].id;
    restoreVersion(p.id, versionId);
    const restored = getProject(p.id)!;
    expect(restored.buildContent).toEqual({ design: "v1" });
    expect(restored.status).toBe("creating");
  });

  it("survives corrupted storage safely", async () => {
    window.localStorage.setItem("creation-engine-projects-v1", "{not json");
    const { loadProjects } = await import("./persistence");
    expect(loadProjects()).toEqual([]);
  });
});

// ---- Onboarding progress ----
describe("onboarding progress", () => {
  it("persists and restores per-engine progress", () => {
    const p = newProgress("music");
    p.pathId = "no-equipment";
    p.platform = "browser";
    p.checkedSetup = { "a-account": true };
    saveProgress(p);

    const loaded = loadProgress("music");
    expect(loaded?.pathId).toBe("no-equipment");
    expect(loaded?.checkedSetup["a-account"]).toBe(true);
    expect(loadProgress("other-engine")).toBeNull();

    clearProgress("music");
    expect(loadProgress("music")).toBeNull();
  });
});

// ---- Platform filtering ----
describe("platform filtering", () => {
  const tool = (id: string, platforms: ToolResource["platforms"]): ToolResource => ({
    id, name: id, purpose: "", platforms, officialUrl: "https://example.com",
    cost: "free", accountRequired: false, installRequired: false,
    source: "test", lastVerifiedAt: "2026-07-10",
  });

  it("filters resources by platform", () => {
    const tools = [tool("win-only", ["windows"]), tool("everywhere", ["windows", "macos", "browser"])];
    expect(resourcesForPlatform(tools, "macos").map((t) => t.id)).toEqual(["everywhere"]);
    expect(resourcesForPlatform(tools, "windows")).toHaveLength(2);
  });

  it("filters paths by platform", () => {
    const paths: CreationPath[] = [
      { id: "a", name: "", description: "", platforms: ["browser"], toolIds: [], setup: [], steps: [], output: "" },
      { id: "b", name: "", description: "", platforms: ["windows", "macos"], toolIds: [], setup: [], steps: [], output: "" },
    ];
    expect(pathsForPlatform(paths, "browser").map((p) => p.id)).toEqual(["a"]);
    expect(pathsForPlatform(paths, "linux")).toHaveLength(0);
  });
});

// ---- Access codes ----
describe("engine room access", () => {
  it("rejects invalid codes and accepts valid ones", async () => {
    const { ACCESS_CODES, grantAccess, hasAccess, revokeAccess } = await import("../access");
    expect(hasAccess()).toBe(false);
    expect(grantAccess("wrong-code")).toBe(false);
    expect(hasAccess()).toBe(false);

    expect(grantAccess(ACCESS_CODES[0].toLowerCase())).toBe(true); // case-insensitive entry
    expect(hasAccess()).toBe(true);

    revokeAccess();
    expect(hasAccess()).toBe(false);
  });
});
