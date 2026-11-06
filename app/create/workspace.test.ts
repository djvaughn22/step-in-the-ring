// @vitest-environment jsdom
// The screen after the box, driven the way a person drives it. The workspace
// has to put the message first, keep working after a trip to an AI app (a phone
// may reload the tab), and never let what somebody typed reach a URL.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import RingApp from "./RingApp";
import { putLocalHandoff, takeLocalHandoff } from "../creation/handoff";
import LocalBuildCard from "../builds/LocalBuildCard";
import { WelcomeBackCard } from "../vnext/ContinueStrip";
import { HEAD_ARRIVAL_JS, takeArrival } from "../site/arrival";
import { loadCurrentCreation, newRecord, saveCurrentCreation } from "../creation/record";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search), usePathname: () => "/" }));

const POEM = "A birthday poem for my granddaughter who loves horses";
let root: Root | undefined;
let el: HTMLDivElement;

function setValue(input: HTMLTextAreaElement | HTMLInputElement, value: string) {
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function button(label: RegExp | string): HTMLButtonElement {
  const found = [...el.querySelectorAll("button")].find((b) =>
    typeof label === "string" ? b.textContent === label : label.test(b.textContent ?? ""),
  );
  if (!found) throw new Error(`no button: ${label}`);
  return found;
}

async function mount(mode: "home" | "create" = "home") {
  el = document.createElement("div");
  document.body.append(el);
  root = createRoot(el);
  await act(async () => root?.render(createElement(RingApp, { mode })));
}

async function say(words: string) {
  await act(async () => setValue(el.querySelector("textarea")!, words));
  await act(async () => {
    el.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  window.scrollTo = vi.fn() as typeof window.scrollTo;
  window.history.replaceState(null, "", "/");
});

afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = "";
  localStorage.clear();
  sessionStorage.clear();
});

describe("the box", () => {
  it("won't hand an AI a sentence nobody finished", async () => {
    await mount();
    await say("A game where ");
    expect(el.querySelector(".ai-message")).toBeNull();
    expect(el.querySelector(".box-nudge")!.textContent).toContain("Finish the sentence first");
    await act(async () => setValue(el.querySelector("textarea")!, "A game where a dragon collects gold"));
    expect(el.querySelector(".box-nudge")).toBeNull();
    await act(async () => {
      el.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(el.querySelector(".ai-message")).not.toBeNull();
  });
});

describe("the workspace", () => {
  it("leads with their words and a message to copy, not with what the rules guessed", async () => {
    await mount();
    await say(POEM);
    expect(el.querySelector("h1")?.textContent).toBe(POEM);
    const first = el.querySelector(".ai-message")!.textContent!;
    expect(first).toContain(`I want to make this: ${POEM}`);
    expect(button("Copy message")).toBeTruthy();
    for (const guess of ["Real means", "Worth knowing first", "A written piece", "Keep this build", "You stepped in"]) {
      expect(el.textContent).not.toContain(guess);
    }
  });

  it("shows every AI app as a link that leaves in a new tab", async () => {
    await mount();
    await say(POEM);
    const apps = [...el.querySelectorAll<HTMLAnchorElement>(".ai-apps a")];
    expect(apps.map((a) => a.textContent?.replace(/\s*↗/, "").trim())).toEqual(["ChatGPT", "Claude", "Copilot", "Gemini"]);
    for (const a of apps) {
      expect(a.target).toBe("_blank");
      expect(a.rel).toContain("noopener");
    }
  });

  it("states what a first-timer needs to know before pasting anything", async () => {
    await mount();
    await say(POEM);
    const text = el.textContent!;
    expect(text).toContain("Nothing you typed has been sent anywhere");
    expect(text).toContain("leave out passwords and account numbers");
    expect(text).toContain("Kids should do this with a parent");
    expect(text).toContain("AI can sound sure and still be wrong");
  });

  it("turns what they say is off into the next message, for as many rounds as they like", async () => {
    await mount();
    await say(POEM);
    expect(el.querySelector(".next-message")).toBeNull();
    const box = () => el.querySelector<HTMLTextAreaElement>("#next-words")!;
    await act(async () => setValue(box(), "Shorter, and keep the part about the pony."));
    expect(el.querySelector(".next-message .ai-message")!.textContent).toContain("Shorter, and keep the part about the pony.");
    expect(el.querySelector(".next-message .ai-message")!.textContent).toContain("Keep everything else as it is");
    await act(async () => button("It didn't work").click());
    expect(el.querySelector(".next-message .ai-message")!.textContent).toContain("That didn't work for me");
    await act(async () => button("It's right").click());
    expect(box()).toBeNull();
    expect(el.querySelector(".next-message .ai-message")!.textContent).toContain("final version");
    expect(el.textContent).toContain("try-it script");
  });

  it("says the plain thing when somebody came for help, not to make something", async () => {
    await mount();
    await say("I need help with my taxes");
    expect(el.textContent).toContain("What you need help with");
    expect(el.textContent).not.toContain("What you want to make");
    expect(el.querySelector(".ai-message")!.textContent).toMatch(/^I could use some help with this: I need help with my taxes/);
    await act(async () => button("That helps").click());
    expect(el.querySelector(".next-message .ai-message")!.textContent).toContain("what I should do next");
    expect(el.textContent).not.toContain("try-it script");
  });

  it("marks which move is selected for a screen reader", async () => {
    await mount();
    await say(POEM);
    expect(button("Change something").getAttribute("aria-pressed")).toBe("true");
    await act(async () => button("I don't understand").click());
    expect(button("Change something").getAttribute("aria-pressed")).toBe("false");
    expect(button("I don't understand").getAttribute("aria-pressed")).toBe("true");
  });

  it("adds an answer to the first message", async () => {
    await mount();
    await say("a game about dragons");
    const input = el.querySelector<HTMLInputElement>("#stepped-question")!;
    await act(async () => setValue(input, "You tap to fly."));
    await act(async () => button("Add it").click());
    expect(el.querySelector(".ai-message")!.textContent).toContain("More about what I want: You tap to fly.");
  });

  it("keeps the whole plan one click away, with a way back", async () => {
    await mount();
    await say(POEM);
    await act(async () => button("See the whole plan").click());
    expect(el.textContent).toContain("What version one does");
    expect(window.location.search).toBe("?open=plan");
    await act(async () => button("Back to your message").click());
    expect(el.querySelector(".ai-message")).not.toBeNull();
  });

  it("hides git settings from anyone not making software", async () => {
    await mount();
    await say(POEM);
    await act(async () => button("See the whole plan").click());
    expect(el.textContent).not.toContain("Settings for coding tools");
  });

  it("shows those settings when it is software", async () => {
    await mount();
    await say("a one page website for my dental office");
    await act(async () => button("See the whole plan").click());
    expect(el.textContent).toContain("Settings for coding tools");
  });
});

describe("leaving for an AI app and coming back", () => {
  it("is saved the moment the workspace opens, without anyone asking", async () => {
    await mount();
    await say(POEM);
    expect(loadCurrentCreation()?.originalIdea).toBe(POEM);
  });

  it("puts the screen in the URL and never the words", async () => {
    await mount();
    await say(POEM);
    expect(window.location.search).toBe("?open=workspace");
    expect(window.location.href).not.toContain("granddaughter");
  });

  it("lands back in the workspace after a reload, with the same record", async () => {
    await mount();
    await say(POEM);
    const before = loadCurrentCreation()!.creationId;
    await act(async () => root?.unmount());
    await mount();
    expect(el.querySelector("h1")?.textContent).toBe(POEM);
    expect(el.querySelector(".ai-message")!.textContent).toContain(POEM);
    expect(loadCurrentCreation()!.creationId).toBe(before);
  });

  it("never leaves a blank page when Back reaches a screen with no words", async () => {
    await mount();
    await say(POEM);
    await act(async () => button("See the whole plan").click());
    await act(async () => button("Start over").click());
    expect(el.querySelector("textarea")!.value).toBe("");
    await act(async () => {
      window.history.replaceState(null, "", "/?open=plan");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(el.textContent).toContain("What version one does");
    localStorage.clear();
    await act(async () => button("Start over").click());
    await act(async () => {
      window.history.replaceState(null, "", "/?open=workspace");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(el.querySelector("textarea")).not.toBeNull();
  });

  it("keeps a saved answer when it comes back", async () => {
    saveCurrentCreation(newRecord("a game about dragons", { answers: { versionOne: "You tap to fly." } }));
    window.history.replaceState(null, "", "/create?open=workspace");
    await mount("create");
    expect(el.querySelector(".ai-message")!.textContent).toContain("You tap to fly.");
  });

  it("falls back to the box, with a clean URL, when nothing is saved", async () => {
    window.history.replaceState(null, "", "/create?open=workspace");
    await mount("create");
    expect(el.querySelector("textarea")).not.toBeNull();
    expect(el.querySelector(".ai-message")).toBeNull();
    expect(window.location.search).toBe("");
  });

  it("walks back to the box with their words still in it", async () => {
    await mount();
    await say(POEM);
    await act(async () => {
      window.history.replaceState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(el.querySelector("textarea")!.value).toBe(POEM);
  });

  it("Your work continues from this browser, and never puts the idea in a URL", () => {
    const html = renderToStaticMarkup(
      createElement(LocalBuildCard, { record: newRecord(POEM), onDeleted: () => {} }),
    );
    expect(html).toContain('href="/create?open=workspace"');
    expect(html).not.toMatch(/href="[^"]*granddaughter/);
  });

  it("a returning visitor can go straight back to their messages", () => {
    expect(renderToStaticMarkup(createElement(WelcomeBackCard, { href: "/create?open=workspace" }))).toContain('href="/create?open=workspace"');
    expect(renderToStaticMarkup(createElement(WelcomeBackCard))).toContain('href="/library"');
  });
});

describe("the script that runs before everything else", () => {
  const run = (url: string) => {
    window.history.replaceState(null, "", url);
    sessionStorage.clear();
    new Function(HEAD_ARRIVAL_JS)();
    return { url: window.location.pathname + window.location.search, kept: sessionStorage.getItem("sitr-arrival") };
  };

  it("takes typed words out of the address bar, on the two pages that read them", () => {
    expect(run(`/create?idea=${encodeURIComponent(POEM)}`)).toEqual({ url: "/create", kept: `?idea=${encodeURIComponent(POEM)}` });
    expect(run("/?cr=abc").url).toBe("/");
    expect(run("/?open=workspace").url).toBe("/");
    expect(run("/create?stem=A%20game").url).toBe("/create");
    expect(run("/create?handoff=1").url).toBe("/create");
  });

  it("leaves a campaign tag alone, and every other page and parameter alone", () => {
    expect(run("/create?idea=hello&utm_source=mail").url).toBe("/create?utm_source=mail");
    expect(run("/?utm_source=mail")).toEqual({ url: "/?utm_source=mail", kept: null });
    expect(run("/engines?engine=game")).toEqual({ url: "/engines?engine=game", kept: null });
    expect(run("/tools?idea=hello")).toEqual({ url: "/tools?idea=hello", kept: null });
  });

  it("is in the page before anything that could read the URL", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).toContain("__html: HEAD_ARRIVAL_JS");
    expect(layout.indexOf("__html: HEAD_ARRIVAL_JS")).toBeLessThan(layout.indexOf("googletagmanager"));
  });

  it("gives what it moved to the page, once", () => {
    run("/create?idea=hello");
    expect(takeArrival()).toBe("?idea=hello");
    expect(takeArrival()).toBeNull();
  });
});

describe("a full page load, the way a real browser does it", () => {
  const hardLoad = async (url: string, mode: "home" | "create" = "home") => {
    window.history.replaceState(null, "", url);
    new Function(HEAD_ARRIVAL_JS)();
    await mount(mode);
  };

  it("opens the workspace, and puts the screen back in the URL for the next reload", async () => {
    saveCurrentCreation(newRecord(POEM));
    await hardLoad("/?open=workspace");
    expect(el.querySelector("h1")?.textContent).toBe(POEM);
    expect(el.querySelector(".ai-message")).not.toBeNull();
    await act(async () => new Promise((resolve) => setTimeout(resolve, 5)));
    expect(window.location.search).toBe("?open=workspace");
  });

  it("fills the box from another site with the words gone from the URL", async () => {
    await hardLoad(`/create?idea=${encodeURIComponent(POEM)}`, "create");
    expect(el.querySelector("textarea")!.value).toBe(POEM);
    expect(window.location.search).toBe("");
  });

  it("keeps a campaign tag through the whole arrival", async () => {
    await hardLoad(`/create?idea=${encodeURIComponent(POEM)}&utm_source=mail`, "create");
    expect(el.querySelector("textarea")!.value).toBe(POEM);
    expect(window.location.search).toBe("?utm_source=mail");
  });

  it("no <Link> carries these parameters, because a prefetch alone makes the router keep them", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(f) ? [p] : [];
      });
    for (const file of walk("app")) {
      expect(readFileSync(file, "utf8"), file).not.toMatch(/<Link[^>]*href=(?:"|\{`)\/(?:create)?\?(?:open|idea|stem|cr|handoff)=/);
    }
    expect(readFileSync("app/builds/LocalBuildCard.tsx", "utf8")).toContain("<a className");
    expect(readFileSync("app/vnext/ContinueStrip.tsx", "utf8")).toMatch(/<a className="btn btn-gold btn-small" href=\{href\}>/);
  });
});

describe("what somebody typed stays out of the address bar", () => {
  it("takes words from another site out of the URL as soon as they arrive", async () => {
    window.history.replaceState(null, "", `/create?idea=${encodeURIComponent(POEM)}`);
    await mount("create");
    expect(el.querySelector("textarea")!.value).toBe(POEM);
    expect(window.location.search).toBe("");
  });

  it("a tool on this site hands words over without using the URL at all", async () => {
    putLocalHandoff("Just the first page");
    window.history.replaceState(null, "", "/create?handoff=1");
    await mount("create");
    expect(el.querySelector("textarea")!.value).toBe("Just the first page");
    expect(window.location.search).toBe("");
    // Read once: coming back to the page later starts clean.
    expect(takeLocalHandoff()).toBeNull();
  });

  it("no public page builds a link with the idea in it any more", () => {
    for (const file of ["app/tools/first-version/CutterClient.tsx", "app/builds/LocalBuildCard.tsx"]) {
      expect(readFileSync(file, "utf8")).not.toMatch(/create\?idea=/);
    }
  });
});

describe("keyboard and screen reader", () => {
  it("moves focus to their words when the workspace opens", async () => {
    await mount();
    await say(POEM);
    expect(document.activeElement).toBe(el.querySelector("h1"));
  });
});
