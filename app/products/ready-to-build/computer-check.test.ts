// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import ComputerCheck from "./ComputerCheck";

let root: Root | undefined;
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined;
  document.body.innerHTML = "";
});
async function render() {
  const container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(createElement(ComputerCheck)));
}
function button(label: string) {
  const result = [...document.querySelectorAll("button")].find(el => el.textContent?.includes(label));
  if (!result) throw new Error(`Missing button: ${label}`);
  return result;
}
async function click(label: string) { await act(async () => button(label).click()); }

describe("computer readiness first step", () => {
  it("starts with one question and four native keyboard-focusable choices, without collecting personal details", async () => {
    await render();
    const group = document.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-labelledby")).toBe("computer-question");
    expect([...group.querySelectorAll("button")].map(el => el.textContent?.replace("→", ""))).toEqual(["Windows PC or laptop", "Mac", "Linux computer", "I’m not sure"]);
    for (const el of group.querySelectorAll("button")) {
      expect(el.type).toBe("button");
      expect(el.tabIndex).toBe(0);
      el.focus();
      expect(document.activeElement).toBe(el);
    }
    expect(document.querySelector("input, form")).toBeNull();
  });
  it.each([["Windows PC or laptop", "About your PC"], ["Mac", "About This Mac"], ["Linux computer", "System Information"]])("guides %s without declaring compatibility", async (label, instruction) => {
    await render();
    await click(label);
    expect(document.body.textContent).toContain(instruction);
    expect(document.body.textContent).toContain("Do not erase or reinstall anything");
    expect(document.activeElement?.textContent).toBe("First, find your computer’s details.");
    await click("I have my details");
    expect(document.activeElement?.textContent).toBe("Next: protect your files.");
    expect(document.body.textContent).toContain("Your computer is not confirmed ready yet");
    expect(document.body.textContent).toContain("full guided readiness check is still being prepared");
    expect(document.body.textContent).toContain("Open a few files from that backup");
    expect(document.querySelector('a[href="#included"]')).not.toBeNull();
    await click("Back to finding my details");
    expect(document.activeElement?.textContent).toBe("First, find your computer’s details.");
    await click("Change computer type");
    expect(document.activeElement).toBe(button(label));
  });
  it("helps unsure visitors identify the system and returns focus to their choice", async () => {
    await render();
    await click("I’m not sure");
    expect(document.activeElement?.textContent).toBe("Let’s find out together.");
    expect(document.body.textContent).toContain("We’ll show you where to find that information");
    expect(document.body.textContent).toContain("If it will not start");
    expect(document.body.textContent).not.toContain("I have my details");
    await click("Show computer choices");
    expect(document.activeElement).toBe(button("I’m not sure"));
    await click("Mac");
    expect(document.body.textContent).toContain("About This Mac");
  });
});
