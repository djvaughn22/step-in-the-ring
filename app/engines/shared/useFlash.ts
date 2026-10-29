"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A short on-screen message ("Copied", "Saved") that clears itself after `ms`.
 * A newer message restarts the clock, so an older message's timer can never
 * clear it early. The timer is cleaned up when the component goes away.
 */
export function useFlash(ms: number): [string, (message: string) => void] {
  const [flash, setFlash] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const say = useCallback((message: string) => {
    clearTimeout(timer.current);
    setFlash(message);
    timer.current = setTimeout(() => setFlash(""), ms);
  }, [ms]);

  return [flash, say];
}

/** Same rule for a yes/no state such as a "Copied" button label. */
export function useTimedFlag(ms: number): [boolean, () => void] {
  const [on, setOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const raise = useCallback(() => {
    clearTimeout(timer.current);
    setOn(true);
    timer.current = setTimeout(() => setOn(false), ms);
  }, [ms]);

  return [on, raise];
}
