// @vitest-environment jsdom
// An older message's timer must never clear a newer message.
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFlash } from "./useFlash";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const probe: { say: (m: string) => void; current: string } = { say: () => {}, current: "" };
function Probe() {
  const [flash, say] = useFlash(2000);
  probe.say = say;
  probe.current = flash;
  return null;
}
const say = (m: string) => probe.say(m);

describe("useFlash", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("keeps a newer message for its full time even when an older one is still counting down", () => {
    const root = createRoot(document.createElement("div"));
    act(() => root.render(createElement(Probe)));
    act(() => say("first"));
    act(() => { vi.advanceTimersByTime(1500); });
    act(() => say("second"));
    expect(probe.current).toBe("second");
    act(() => { vi.advanceTimersByTime(1000); }); // 2500ms after "first", 1000ms after "second"
    expect(probe.current).toBe("second");
    act(() => { vi.advanceTimersByTime(1100); });
    expect(probe.current).toBe("");
    act(() => root.unmount());
  });
});
