// @vitest-environment jsdom
//
// Delete, exercised as real interaction — mount, click, read the DOM back —
// not just source inspection. JSX is avoided on purpose (see build-detail-
// render.test.ts's header): the suite is app/**/*.test.ts, so everything
// here uses createElement.
//
// Fictional fixtures only, per the standing privacy rule in CLAUDE.md — see
// docs/sitr-feature-inventory.md's Sprint 2 privacy-correction section.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
import BuildsClient from "./BuildsClient";
import { newBuild, type BuildRecordV1 } from "../vnext/build";
import { shapeIntent } from "../vnext/shape";
import { newRecord } from "../creation/record";

const LOCAL_KEY = "sitr-creation-current-v1";

// Two unrelated, fully fictional ideas — never the owner's own words.
const HARBOR = "A song about waiting by a quiet harbor for a boat that isn't coming back.";
const GARDEN = "A phone game where you grow a garden that only blooms at night.";

function build(intent: string, id: string, patch: Partial<BuildRecordV1> = {}): BuildRecordV1 {
  const base = newBuild(intent, "2026-08-08T00:00:00.000Z", shapeIntent(intent) ?? undefined);
  return { ...base, id, ...patch };
}

const baseProps = {
  signedIn: true,
  canSave: true,
  storeConfigured: true,
  email: "owner@example.com",
  initialIntent: "",
  listFailed: false,
};

let container: HTMLElement;
let root: Root;

function mount(props: Partial<Parameters<typeof BuildsClient>[0]>) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(createElement(BuildsClient, { ...baseProps, builds: [], ...props }));
  });
}

const flush = () => new Promise((r) => setTimeout(r, 0));
const q = (sel: string) => container.querySelectorAll(sel);
const text = () => container.textContent ?? "";

beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** Every card's delete trigger, in the order they appear. */
function openConfirms() {
  return Array.from(q(".bc-delete-open")) as HTMLButtonElement[];
}

describe("deleting a signed-in account Build", () => {
  it("removes only that one card, leaving an unrelated Build in place", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
    mount({ builds: [build(HARBOR, "harbor-1"), build(GARDEN, "garden-1")] });
    expect(openConfirms()).toHaveLength(2);

    await act(async () => {
      openConfirms()[0].click();
      await flush();
    });
    const confirmBtn = Array.from(q("button")).find((b) => b.textContent === "Yes, delete") as HTMLButtonElement;
    await act(async () => {
      confirmBtn.click();
      await flush();
    });

    expect(fetch).toHaveBeenCalledWith("/api/members/projects/harbor-1", { method: "DELETE" });
    expect(container.querySelector('a[href="/builds/harbor-1"]')).toBeNull();
    expect(container.querySelector('a[href="/builds/garden-1"]')).not.toBeNull();
  });

  it("shows the empty state once the only Build is gone", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
    mount({ builds: [build(HARBOR, "only-1")] });
    expect(text()).toContain("Your builds");

    await act(async () => {
      openConfirms()[0].click();
      await flush();
    });
    const confirmBtn = Array.from(q("button")).find((b) => b.textContent === "Yes, delete") as HTMLButtonElement;
    await act(async () => {
      confirmBtn.click();
      await flush();
    });

    expect(text()).toContain("Nothing here yet");
    expect(text()).not.toContain("Your builds");
  });

  it("cancel closes the confirmation and deletes nothing", async () => {
    const fetchSpy = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    vi.stubGlobal("fetch", fetchSpy);
    mount({ builds: [build(HARBOR, "harbor-2")] });

    await act(async () => {
      openConfirms()[0].click();
      await flush();
    });
    expect(text()).toContain("Delete this? It can't be undone.");

    const cancelBtn = Array.from(q("button")).find((b) => b.textContent === "Cancel") as HTMLButtonElement;
    await act(async () => {
      cancelBtn.click();
      await flush();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(container.querySelector('a[href="/builds/harbor-2"]')).not.toBeNull();
    expect(text()).not.toContain("Delete this? It can't be undone.");
    // Back to closed — the open trigger is showing again, not the confirm row.
    expect(openConfirms()).toHaveLength(1);
  });
});

describe("the confirmation never repeats the Build's own words", () => {
  it("the title and reading are absent from the confirmation prompt", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
    const b = build(HARBOR, "harbor-3");
    mount({ builds: [b] });

    await act(async () => {
      openConfirms()[0].click();
      await flush();
    });

    const confirmRow = container.querySelector(".bc-delete-confirm");
    expect(confirmRow).not.toBeNull();
    expect(confirmRow!.textContent).not.toContain(b.title);
    expect(confirmRow!.textContent).not.toContain("harbor");
    expect(confirmRow!.textContent).not.toContain("boat");
  });
});

describe("keyboard and touch operate the same control mouse does", () => {
  // A real browser turns Enter/Space on a focused <button>, and a tap on a
  // touchscreen, into the same click event a mouse produces — jsdom can't
  // simulate that browser-native translation, but it can prove the code
  // relies on it correctly: every control is a real <button> (not a div or
  // span with an onClick, which no input method but a mouse would reach),
  // so there is exactly one handler and every input method fires it.
  it("the delete trigger, confirm, and cancel controls are all native buttons", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
    mount({ builds: [build(HARBOR, "harbor-4")] });

    const trigger = openConfirms()[0];
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("type")).toBe("button");

    await act(async () => {
      trigger.click();
      await flush();
    });
    const confirmBtn = Array.from(q("button")).find((b) => b.textContent === "Yes, delete") as HTMLButtonElement;
    const cancelBtn = Array.from(q("button")).find((b) => b.textContent === "Cancel") as HTMLButtonElement;
    expect(confirmBtn.tagName).toBe("BUTTON");
    expect(cancelBtn.tagName).toBe("BUTTON");
  });

  it("a keyboard-focused trigger is reachable — it has no negative tabindex and is not disabled", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
    mount({ builds: [build(HARBOR, "harbor-5")] });
    const trigger = openConfirms()[0];
    expect(trigger.tabIndex).toBeGreaterThanOrEqual(0);
    expect(trigger.disabled).toBe(false);
  });
});

describe("deleting the one browser-local build", () => {
  it("is offered, and deletes only the local record — no fetch involved", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const record = newRecord(GARDEN);
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(record));

    mount({ builds: [] });
    await act(async () => { await flush(); }); // the mount effect reads localStorage
    expect(text()).toContain("Only in this browser");

    await act(async () => {
      openConfirms()[0].click();
      await flush();
    });
    const confirmBtn = Array.from(q("button")).find((b) => b.textContent === "Yes, delete") as HTMLButtonElement;
    await act(async () => {
      confirmBtn.click();
      await flush();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(text()).not.toContain("Only in this browser");
    expect(window.localStorage.getItem(LOCAL_KEY)).toBeNull();
  });

  it("never touches a newer local idea that isn't the one being deleted", async () => {
    // Simulate: the person moved on to a second idea in this tab AFTER the
    // card they're deleting was captured. Deleting stale-by-id must not
    // wipe the newer slot out from under them.
    const stale = newRecord(HARBOR);
    const newer = newRecord(GARDEN);
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(stale));

    vi.stubGlobal("fetch", vi.fn());
    mount({ builds: [] });
    await act(async () => { await flush(); });

    // Something else in this tab overwrites the slot before the delete fires
    // — the exact-id guard, not the mount-time snapshot, has to decide.
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(newer));

    const { deleteCurrentCreationIfMatches } = await import("../creation/record");
    const removed = deleteCurrentCreationIfMatches(stale.creationId);
    expect(removed).toBe(false);
    expect(window.localStorage.getItem(LOCAL_KEY)).not.toBeNull();
    expect(JSON.parse(window.localStorage.getItem(LOCAL_KEY)!).creationId).toBe(newer.creationId);
  });
});

describe("deleting an account Build reconciles the exact same local draft", () => {
  it("clears the local slot only when the words match exactly, and clears no other Build", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })));
    const record = newRecord(HARBOR);
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(record));

    mount({ builds: [build(HARBOR, "harbor-6"), build(GARDEN, "garden-2")] });
    await act(async () => { await flush(); });
    expect(text()).toContain("Only in this browser");

    // Delete the account Build whose words are the exact same as the local one.
    const cards = Array.from(q(".buildcard"));
    const harborCard = cards.find((c) => c.querySelector('a[href="/builds/harbor-6"]'));
    const trigger = harborCard!.querySelector(".bc-delete-open") as HTMLButtonElement;

    await act(async () => {
      trigger.click();
      await flush();
    });
    const confirmBtn = Array.from(harborCard!.querySelectorAll("button")).find((b) => b.textContent === "Yes, delete") as HTMLButtonElement;
    await act(async () => {
      confirmBtn.click();
      await flush();
    });

    expect(window.localStorage.getItem(LOCAL_KEY)).toBeNull();
    expect(text()).not.toContain("Only in this browser");
    expect(container.querySelector('a[href="/builds/garden-2"]')).not.toBeNull();
  });
});
