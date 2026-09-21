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
      expect(["Live", "Product", "Game", "Experiment", "In progress"]).toContain(build.status);
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
    expect(html).toContain('href="/products/five-hour-sprint"');
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
