// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RealProjects from "./RealProjects";

function render() {
  const doc = document.implementation.createHTMLDocument();
  doc.body.innerHTML = renderToStaticMarkup(createElement(RealProjects));
  return doc;
}

describe("real projects and the build-versus-runtime distinction", () => {
  it("teaches development versus runtime, with an ordered visual flow", () => {
    const doc = render();
    expect(doc.querySelector("section")?.getAttribute("aria-labelledby")).toBe("real-projects-heading");
    expect(doc.querySelector("h2")?.textContent).toBe("Real projects. Real sources.");
    expect(doc.body.textContent).toContain("A coding tool can help write the code. It should not be where your facts come from.");
    expect([...doc.querySelectorAll("ol strong")].map(el => el.textContent)).toEqual(["Idea", "Code, written step by step", "Trusted data connections", "Useful live website"]);
  });
  it("gives the three real projects distinct development, source, and cost explanations with verified destinations", () => {
    const doc = render();
    const cards = [...doc.querySelectorAll("article")];
    // CrossHeartPray is outreach, not a build showcase (owner, 2026-10-08).
    expect(cards.map(card => card.querySelector("h3")?.textContent)).toEqual(["TheDJCares", "iDontCry", "WatchedNotWatched"]);
    expect(cards.map(card => card.querySelector("a")?.getAttribute("href"))).toEqual(["https://thedjcares.com", "https://idontcry.com/sports", "https://watchednotwatched.com"]);
    for (const card of cards) {
      expect([...card.querySelectorAll("dt")].map(el => el.textContent)).toEqual(["What the build covered:", "Built on:", "Why it matters:"]);
      for (const detail of card.querySelectorAll("dd")) expect(detail.textContent!.length).toBeGreaterThan(40);
    }
  });
  it("preserves source limitations, optional features, and the distinction from operating costs", () => {
    const text = render().body.textContent!;
    for (const claim of ["EventLink supplies schedules, not scores", "TMDB for movies and TV when configured", "An optional feature can interpret a listening request", "separate, controlled feature", "Hosting, storage, data providers, and any optional paid features may still have costs", "Source availability and API terms vary"]) {
      expect(text).toContain(claim);
    }
    expect(text).not.toMatch(/zero (?:cost|operating)|free forever|official partner|unlimited free/i);
    // No AI-themed marketing (owner, 2026-10-08).
    expect(text).not.toMatch(/\bAI\b|chatbot/);
  });
});
