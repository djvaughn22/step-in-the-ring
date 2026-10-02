// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Page, { metadata } from "./page";
import { pageAt } from "../../site/registry";

function render() {
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = renderToStaticMarkup(createElement(Page));
  return doc;
}

describe("Ready to Build", () => {
  it("is a public, discoverable product with its own metadata", () => {
    expect(pageAt("/products/ready-to-build")?.access).toBe("public");
    expect(metadata.alternates?.canonical).toBe("/products/ready-to-build");
    expect(render().querySelectorAll("h1")).toHaveLength(1);
  });
  it("takes every same-page CTA to a unique existing section", () => {
    const doc = render();
    const links = [...doc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    expect(links).toHaveLength(4);
    for (const link of links) {
      const target = doc.querySelectorAll(link.getAttribute("href")!);
      expect(target).toHaveLength(1);
      expect(target[0].tagName).toBe("SECTION");
    }
  });
  it("explains the purpose before the first check and presents the kit afterward", () => {
    const doc = render();
    expect(doc.querySelector("h1")?.textContent).toBe("Before you buy a new one, find out what yours can become.");
    const hero = doc.querySelector("main > header")!;
    expect(hero.textContent).toContain("Have an old computer?");
    expect(hero.textContent).toContain("An AI build machine is simply a computer");
    expect(hero.querySelector('a[href="#computer-check"]')?.textContent).toContain("Check my computer");
    expect(hero.querySelector('a[href="#process"]')?.textContent).toContain("See the whole process");
    expect(hero.querySelector('a[href^="mailto:"]')).toBeNull();
    const sections = [...doc.querySelectorAll("main > section")].map(el => el.id);
    expect(sections.slice(0, 4)).toEqual(["process", "computer-check", "real-projects", "included"]);
    expect(doc.querySelector("#process h2")?.textContent).toBe("What this page is for");
    expect(doc.querySelector("#process")?.textContent).toContain("not a promise that every old computer can do everything");
    expect([...doc.querySelectorAll("#process h3")].map(el => el.textContent)).toEqual(["Check it", "Protect it", "Rebuild it", "Prepare it", "Build it", "Go live"]);
    expect(doc.querySelector("#included h2")?.textContent).toBe("What you will get help with");
  });
  it("is a free guide: no waitlist, no purchase, every path item a real page", () => {
    const doc = render();
    expect(doc.querySelector("#first-build")).toBeNull();
    expect(doc.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(doc.querySelector('a[href*="checkout"]')).toBeNull();
    const text = doc.body.textContent ?? "";
    expect(text).not.toMatch(/\$\s*\d|founding|early access|purchase|one-time|low-cost|price|kit is in preparation/i);
    expect(doc.querySelector("#included")?.textContent).toContain("Everything below is a free page on this site");
    const pathLinks = [...doc.querySelectorAll<HTMLAnchorElement>("#included li a")].map((a) => a.getAttribute("href"));
    expect(pathLinks).toEqual(expect.arrayContaining(["#computer-check", "/build-machine", "/how", "/build", "/tools/first-version", "/tools/launch-checklist"]));
    for (const href of pathLinks) {
      if (href!.startsWith("#")) continue;
      expect(pageAt(href!)?.access, href!).toBe("public");
    }
  });
  it("provides native accessible FAQs and honest scope and release expectations", () => {
    const doc = render();
    const faqs = [...doc.querySelectorAll("details")];
    expect(faqs).toHaveLength(7);
    for (const faq of faqs) {
      expect(faq.firstElementChild?.tagName).toBe("SUMMARY");
      expect(faq.querySelector("p")?.textContent?.length).toBeGreaterThan(40);
    }
    expect(doc.body.textContent).toContain("Does any of this cost money?");
    expect(doc.body.textContent).toContain("Larger apps");
    expect(doc.body.textContent).toContain("separate costs");
    expect(doc.querySelectorAll("#included li")).toHaveLength(7);
    expect(doc.querySelector('ol[aria-label="Your path to a live project"]')?.children).toHaveLength(6);
  });
});
