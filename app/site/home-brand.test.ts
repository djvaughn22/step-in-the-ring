// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import RingMark from "./RingMark";
import RingHeader from "./RingHeader";
import QuietFooterLink from "./QuietFooterLink";
import RingApp from "../create/RingApp";
import { ECOSYSTEM, homepageProof } from "./registry";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(), usePathname: () => "/" }));
let root: Root | undefined;
afterEach(async () => { if (root) await act(async () => root?.unmount()); root = undefined; document.body.innerHTML = ""; localStorage.clear(); });
function home() {
  document.body.innerHTML = renderToStaticMarkup(createElement(RingApp, { mode: "home" }));
  return document;
}
describe("official homepage identity", () => {
  it("renders the single decorative mark with intrinsic dimensions", () => {
    const html = renderToStaticMarkup(createElement(RingMark));
    expect(html).toContain('src="/icons/ring-mark.svg"');
    expect(html).toContain('width="64"');
    expect(html).toContain('alt=""');
    const asset = readFileSync("public/icons/ring-mark.svg", "utf8");
    const geometry = asset.slice(asset.indexOf(">") + 1, asset.lastIndexOf("</svg>"));
    for (const file of ["app/icon.svg", "public/icons/ring-512.svg", "public/icons/ring-512-maskable.svg"]) {
      expect(readFileSync(file, "utf8")).toContain(geometry);
    }
  });
  it("uses the official asset in the header, hero, maker heading, final invitation and footer", () => {
    const doc = home();
    for (const selector of [".hero-signature", ".maker-heading", ".home-final"]) {
      expect(doc.querySelector(`${selector} img`)?.getAttribute("src")).toBe("/icons/ring-mark.svg");
    }
    for (const component of [RingHeader, QuietFooterLink]) {
      const html = renderToStaticMarkup(createElement(component));
      expect(html).toContain('src="/icons/ring-mark.svg"');
      expect(html).toContain("Step In The Ring");
      // No sign-up: no account door in the header; testers sign in from the footer.
      expect(html).toContain(component === RingHeader ? 'href="/whats-built"' : 'href="/members/login"');
    }
  });
  it("gives every project its registry identity and a separate maker endorsement", () => {
    const doc = home();
    const cards = [...doc.querySelectorAll<HTMLAnchorElement>(".project-card")];
    expect(cards).toHaveLength(3);
    homepageProof(ECOSYSTEM).primary.forEach((project, i) => {
      expect(cards[i].href).toBe(`${project.liveUrl}/`);
      expect(cards[i].querySelector(".project-icon")?.textContent).toBe(project.emoji);
      expect(cards[i].querySelector(".project-icon img")).toBeNull();
      expect(cards[i].querySelector(".project-endorsement img")?.getAttribute("src")).toBe("/icons/ring-mark.svg");
      expect(cards[i].textContent).toContain(`Visit ${project.name}`);
    });
  });
  // Oct 2026 simplification: each thing appears once. The idea box is the
  // hero, so no path card repeats it; engines are one path card, not a
  // second section; Ready to Build lives in "Want a hand?".
  it("keeps three distinct ways in, five ordered rounds, and no repeated sections", () => {
    const doc = home();
    expect([...doc.querySelectorAll(".path-card")].map(a => a.getAttribute("href"))).toEqual(["/build", "/tools", "/engines"]);
    expect(doc.querySelectorAll("ol.how-steps > li")).toHaveLength(5);
    expect(doc.querySelectorAll(".tool-row")).toHaveLength(0);
    expect(doc.querySelector(".ready-build-promo")).toBeNull();
    expect(doc.querySelectorAll('a[href^="/products/ready-to-build"]')).toHaveLength(1);
    expect(doc.querySelector('a[href="/whats-built#tell-us"]')).not.toBeNull();
    expect(doc.querySelectorAll(".home-page > section").length).toBeLessThanOrEqual(6);
    for (const href of ["/everything", "/how", "/engines", "/whats-built"]) expect(doc.querySelector(`a[href="${href}"]`)).not.toBeNull();
    expect(doc.querySelector(".startbox button[type=submit]")?.textContent).toBe("Step into the Ring");
  });
  it("lets a starter seed the form, the final invitation focus it, and submit enter shaping", async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    const el = document.createElement("div"); document.body.append(el); root = createRoot(el);
    await act(async () => root?.render(createElement(RingApp, { mode: "home" })));
    const input = el.querySelector("textarea")!;
    await act(async () => { el.querySelector<HTMLButtonElement>(".startbox-eg button")!.click(); await new Promise(resolve => setTimeout(resolve, 10)); });
    expect(input.value).not.toBe("");
    await act(async () => el.querySelector<HTMLButtonElement>(".home-final button")!.click());
    expect(document.activeElement).toBe(input);
    expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
    await act(async () => el.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(el.querySelector(".home-hero")).toBeNull();
  });
});
