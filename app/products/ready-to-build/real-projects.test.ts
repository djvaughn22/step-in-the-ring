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

describe("real projects and the AI cost distinction", () => {
  it("teaches development versus runtime, with an ordered visual flow", () => {
    const doc = render();
    expect(doc.querySelector("section")?.getAttribute("aria-labelledby")).toBe("real-projects-heading");
    expect(doc.querySelector("h2")?.textContent).toBe("AI helped build them. The data comes from somewhere real.");
    expect(doc.body.textContent).toContain("AI can help write the code. It does not have to be the source of truth.");
    expect(doc.body.textContent).toContain("The builder may use AI. The product does not have to be powered by AI.");
    expect([...doc.querySelectorAll("ol strong")].map(el => el.textContent)).toEqual(["Idea", "AI-assisted development", "Code and trusted connections", "Useful live website"]);
  });
  it("gives all four real projects distinct development, source, and cost explanations with verified destinations", () => {
    const doc = render();
    const cards = [...doc.querySelectorAll("article")];
    expect(cards.map(card => card.querySelector("h3")?.textContent)).toEqual(["CrossHeartPray", "TheDJCares", "iDontCry", "WatchedNotWatched"]);
    expect(cards.map(card => card.querySelector("a")?.getAttribute("href"))).toEqual(["https://crossheartpray.com", "https://thedjcares.com", "https://idontcry.com/sports", "https://watchednotwatched.com"]);
    for (const card of cards) {
      expect([...card.querySelectorAll("dt")].map(el => el.textContent)).toEqual(["AI helped with:", "Built on:", "Why it matters:"]);
      for (const detail of card.querySelectorAll("dd")) expect(detail.textContent!.length).toBeGreaterThan(40);
    }
  });
  it("preserves source limitations, optional AI, and the distinction from operating costs", () => {
    const text = render().body.textContent!;
    for (const claim of ["EventLink supplies schedules, not scores", "TMDB for movies and TV when configured", "optional AI feature", "separate, controlled feature", "Hosting, storage, data providers, and optional AI features may still have costs", "Source availability and API terms vary"]) {
      expect(text).toContain(claim);
    }
    expect(text).not.toMatch(/zero (?:cost|operating)|free forever|official partner|unlimited free/i);
  });
});
