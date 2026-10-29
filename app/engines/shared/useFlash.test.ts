// @vitest-environment jsdom
// An older message's timer must never clear a newer message.
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFlash } from "./useFlash";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The probe reports each render through a callback, so the test reads the
// hook's values without the component writing to anything outside itself.
let current = "";
let sayLatest: (m: string) => void = () => {};
function Probe({ onRender }: { onRender: (flash: string, say: (m: string) => void) => void }) {
  const [flash, say] = useFlash(2000);
  onRender(flash, say);
  return null;
}
const record = (flash: string, say: (m: string) => void) => { current = flash; sayLatest = say; };
const say = (m: string) => sayLatest(m);

describe("useFlash", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("keeps a newer message for its full time even when an older one is still counting down", () => {
    const root = createRoot(document.createElement("div"));
    act(() => root.render(createElement(Probe, { onRender: record })));
    act(() => say("first"));
    act(() => { vi.advanceTimersByTime(1500); });
    act(() => say("second"));
    expect(current).toBe("second");
    act(() => { vi.advanceTimersByTime(1000); }); // 2500ms after "first", 1000ms after "second"
    expect(current).toBe("second");
    act(() => { vi.advanceTimersByTime(1100); });
    expect(current).toBe("");
    act(() => root.unmount());
  });
});
