// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import OwnerBuildsShowroom from "./OwnerBuildsShowroom";
import { OWNER_BUILD_CATEGORIES, OWNER_BUILDS, ownerBuildsForCategory } from "./owner-builds";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("Owner’s Builds registry", () => {
  it("contains unique verified builds with useful destinations and status labels", () => {
    expect(new Set(OWNER_BUILDS.map((build) => build.name)).size).toBe(OWNER_BUILDS.length);
    expect(OWNER_BUILDS.length).toBeGreaterThanOrEqual(12);
    for (const build of OWNER_BUILDS) {
      expect(build.href).toMatch(/^(https:\/\/|\/)/);
      expect(["Live", "Product", "Game", "Experiment", "In progress", "Outreach"]).toContain(build.status);
      expect(build.description.length).toBeGreaterThan(25);
      expect(build.lesson).toMatch(/^What it shows:/);
      if (build.external) expect(build.href).toMatch(/^https:\/\//);
    }
    expect(OWNER_BUILDS.map((build) => build.name)).toEqual(expect.arrayContaining([
      "Step In The Ring", "Ready to Build", "CrossHeartPray", "TheDJCares", "iDontCry",
      "iDontCry Sports Desk", "iDontCry Football", "WatchedNotWatched", "ReadNotRead",
      "DontCloneMeTom", "OpenDoku", "Open Mirror",
    ]));
  });

  it("organizes each build exactly once and provides a meaningful empty category", () => {
    expect(OWNER_BUILD_CATEGORIES.map((category) => category.id)).toContain("all");
    const categorized = OWNER_BUILD_CATEGORIES.filter((category) => category.id !== "all").flatMap((category) => ownerBuildsForCategory(category.id));
    expect(categorized.map((build) => build.name).sort()).toEqual(OWNER_BUILDS.map((build) => build.name).sort());
    expect(ownerBuildsForCategory("all")).toHaveLength(OWNER_BUILDS.length);
  });
});

describe("Owner’s Builds showroom", () => {
  let root: Root | undefined;
  afterEach(async () => {
    if (root) await act(async () => root?.unmount());
    root = undefined;
    document.body.innerHTML = "";
  });

  it("renders the primary message, featured builds, all-builds CTA, and build-next CTAs", () => {
    const html = renderToStaticMarkup(createElement(OwnerBuildsShowroom));
    expect(html).toContain("Owner&#x27;s Builds");
    expect(html).toContain("See what we&#x27;ve built.");
    expect(html).toContain("I want to build something like this");
    expect(html).toContain('href="/products/ready-to-build"');
    expect(html).toContain('href="/create"');
    expect(html).toContain("Featured builds");
    expect(html).toContain("Explore all builds");
    for (const name of ["CrossHeartPray", "TheDJCares", "iDontCry Sports Desk", "WatchedNotWatched"]) expect(html).toContain(name);
  });

  it("uses external-link semantics for external projects and stable internal links for local products", () => {
    const html = renderToStaticMarkup(createElement(OwnerBuildsShowroom));
    expect(html).toContain('href="https://crossheartpray.com" target="_blank" rel="noopener noreferrer"');
    expect(html).toContain('href="/products/ready-to-build"');
    expect(html).toContain('href="/five-hour-sprint-tool"');
    // The card describes the free planning tool, so it must not point at the
    // paid service page.
    expect(html).not.toContain('href="/products/five-hour-sprint"');
  });

  it("keeps the page to one h1 and leads with the free next step", () => {
    const html = renderToStaticMarkup(createElement(OwnerBuildsShowroom));
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toMatch(/<a class="btn btn-gold" href="\/create">I want to build something like this/);
  });

  it("a category filter includes its featured builds", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root!.render(createElement(OwnerBuildsShowroom)));
    const products = [...container.querySelectorAll("button")].find((b) => b.textContent === "Products & systems") as HTMLButtonElement;
    await act(async () => products.click());
    const names = [...container.querySelectorAll("#all-builds .owner-build-card h3")].map((h) => h.textContent);
    expect(names.sort()).toEqual(ownerBuildsForCategory("products").map((b) => b.name).sort());
    expect(names).toContain("Step In The Ring");
  });

  it("filters the showroom with native buttons and keeps the active state accessible", async () => {
    const container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () => root!.render(createElement(OwnerBuildsShowroom)));
    const renderedNames = [...container.querySelectorAll(".owner-build-card h3")].map((heading) => heading.textContent);
    expect(new Set(renderedNames).size).toBe(renderedNames.length);
    const media = [...container.querySelectorAll("button")].find((button) => button.textContent === "Books & media") as HTMLButtonElement;
    expect(media).toBeTruthy();
    await act(async () => media.click());
    expect(media.getAttribute("aria-pressed")).toBe("true");
    const directory = container.querySelector("#all-builds")!;
    expect(directory.textContent).toContain("ReadNotRead");
    expect(container.textContent).toContain("WatchedNotWatched");
    expect(directory.textContent).not.toContain("CrossHeartPray");
  });
});

// Owner, 2026-10-08: CrossHeartPray stays in the showroom as an outreach
// project — labelled so, linked to its own site, and never shown as a product.
describe("CrossHeartPray in the showroom", () => {
  it("keeps its card, link and attribution, labelled Outreach", () => {
    const chp = OWNER_BUILDS.find((b) => b.name === "CrossHeartPray");
    expect(chp).toBeDefined();
    expect(chp!.status).toBe("Outreach");
    expect(chp!.href).toBe("https://crossheartpray.com");
    expect(chp!.external).toBe(true);
    expect(chp!.featured).toBe(true);
    expect(chp!.lesson).toMatch(/^What it shows: /);
    expect(chp!.lesson).toMatch(/published/);
    expect(chp!.lesson).not.toMatch(/\bAI\b|buy|price|offer/i);
  });

  it("is the only outreach card", () => {
    expect(OWNER_BUILDS.filter((b) => b.status === "Outreach").map((b) => b.name)).toEqual(["CrossHeartPray"]);
  });
});

