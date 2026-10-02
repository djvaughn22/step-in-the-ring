"use client";

// One small hook for every free tool: state that survives a reload, kept ONLY
// in this browser. Nothing is ever sent anywhere.
//
// SSR renders the initial value; the saved copy is read after mount (the same
// pattern as the five-hour planner and the studios). Writing waits until that
// read has happened, so a first render can never overwrite saved work.

import { useEffect, useState } from "react";

export function useSavedState<T>(
  key: string,
  initial: T,
  parse: (raw: unknown) => T | null,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? parse(JSON.parse(raw)) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring persisted state after mount
      if (parsed !== null) setValue(parsed);
    } catch {
      // Blocked or corrupt storage: start fresh rather than break the tool.
    }
    setLoaded(true);
    // `parse` is a module-level function in every caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private mode or a full disk: the tool still works for this visit.
    }
  }, [key, value, loaded]);

  return [value, setValue];
}

/** Copy text, falling back to a hidden textarea for older browsers. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement("textarea");
      el.value = text;
      el.setAttribute("readonly", "");
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.append(el);
      el.select();
      const ok = document.execCommand("copy");
      el.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
