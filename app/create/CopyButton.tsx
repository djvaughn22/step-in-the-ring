"use client";

import { useTimedFlag } from "../engines/shared/useFlash";

/** Clipboard first; a hidden textarea for older phones and webviews. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Blocked or unavailable: the fallback below still has a chance.
  }
  // Removing the textarea would drop keyboard focus onto the page itself.
  const back = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(ta);
    back?.focus();
  }
}

export default function CopyButton({
  text,
  label,
  big,
  onCopied,
}: {
  text: string;
  label: string;
  big?: boolean;
  onCopied?: () => void;
}) {
  const [copied, raiseCopied] = useTimedFlag(2200);
  const [failed, raiseFailed] = useTimedFlag(6000);
  return (
    <>
      <button
        type="button"
        className={`btn ${big ? "btn-gold" : "btn-ghost btn-small"}`}
        onClick={async () => {
          if (await copyText(text)) {
            raiseCopied();
            onCopied?.();
          } else {
            raiseFailed();
          }
        }}
      >
        {copied ? "Copied" : label}
      </button>
      {/* Confirmation reaches a screen reader, not just the eye. Derived
          from the same label the button shows — a screen reader user
          copying "brief" should never be told "builder prompt." */}
      <span role="status" aria-live="polite" className={failed && !copied ? "copy-failed" : "sr-only"}>
        {copied
          ? `${label.replace(/^Copy /, "")} copied to your clipboard`
          : failed
            ? "This browser wouldn't copy it. Select the text and copy it yourself."
            : ""}
      </span>
    </>
  );
}
