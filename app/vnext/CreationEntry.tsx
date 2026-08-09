"use client";

// ─────────────────────────────────────────────────────────────────────────────
// THE CREATION ENTRY — the one question Step In The Ring asks.
//
//   "What do you want to create?"
//
// It takes a person's own words. It never asks them to pick an engine, a
// category, or a plan first — the starters below the box only drop an
// editable stem in, so what comes back is still what the person typed.
//
// This component is presentational on purpose: it owns no storage and no
// interpretation. Whoever mounts it decides what happens on submit (the
// homepage reads the idea; My Builds opens a new Build). That's what makes it
// reusable instead of a second homepage.
// ─────────────────────────────────────────────────────────────────────────────

import { FormEvent, ReactNode, RefObject, useRef } from "react";

export interface Starter {
  emoji: string;
  label: string;
  /** Dropped into the box as an editable stem — never hidden category state. */
  stem: string;
}

/** Outcome-first ways in. The person finishes the sentence in their own words. */
export const DEFAULT_STARTERS: Starter[] = [
  { emoji: "🛠️", label: "Build something", stem: "A website that " },
  { emoji: "🎮", label: "Make a game", stem: "A game where " },
  { emoji: "🎨", label: "Design something", stem: "A design for " },
  { emoji: "🎵", label: "Create music", stem: "A song about " },
  { emoji: "✍️", label: "Write something", stem: "A short story about " },
  { emoji: "🏈", label: "Coach a team", stem: "A football practice plan for " },
  { emoji: "🔧", label: "Fix something", stem: "Something broke: " },
  { emoji: "💼", label: "Start a business", stem: "A service where I " },
];

export interface CreationEntryProps {
  value: string;
  onValueChange: (next: string) => void;
  onSubmit: (e: FormEvent) => void;
  /** Default: "What do you want to create?" */
  heading?: string;
  help?: string;
  submitLabel?: string;
  placeholder?: string;
  rows?: number;
  starters?: Starter[];
  /** Extra buttons beside the primary action (continue, saved work, …). */
  actions?: ReactNode;
  /** Anything the mounting surface wants directly under the box. */
  children?: ReactNode;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  id?: string;
  disabled?: boolean;
}

export default function CreationEntry({
  value,
  onValueChange,
  onSubmit,
  heading = "What do you want to create?",
  help = "An app, a business, a game, a book, a song, a practice plan, a repair — messy is fine. If it belongs on something you already have, say which one.",
  submitLabel = "Step in →",
  placeholder = 'e.g. "A puzzle game where you pick a photo and drag the pieces back together."',
  rows = 5,
  starters = DEFAULT_STARTERS,
  actions,
  children,
  inputRef,
  id = "creation-intent",
  disabled,
}: CreationEntryProps) {
  const ownRef = useRef<HTMLTextAreaElement | null>(null);
  const ref = inputRef ?? ownRef;

  return (
    <section aria-label="Start a creation" className="creation-entry">
      <form className="stack" onSubmit={onSubmit}>
        <div>
          <label className="field-question" htmlFor={id} style={{ display: "block" }}>
            {heading}
          </label>
          {help && (
            <p className="field-help" id={`${id}-help`} style={{ marginBottom: 0 }}>
              {help}
            </p>
          )}
        </div>
        <textarea
          id={id}
          ref={ref}
          aria-describedby={help ? `${id}-help` : undefined}
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          required
        />
        <div className="actions">
          <button type="submit" className="btn btn-gold" disabled={disabled || !value.trim()}>
            {submitLabel}
          </button>
          {actions}
        </div>
        {starters.length > 0 && (
          <div className="chip-row" role="group" aria-label="Or start from what you want to make">
            {starters.map((s) => (
              <button
                key={s.label}
                type="button"
                className="chip"
                onClick={() => {
                  onValueChange(s.stem);
                  // Put the cursor where the person keeps typing.
                  setTimeout(() => {
                    const el = ref.current;
                    if (!el) return;
                    el.focus();
                    el.setSelectionRange(s.stem.length, s.stem.length);
                  }, 0);
                }}
              >
                <span aria-hidden="true">{s.emoji}</span> {s.label}
              </button>
            ))}
          </div>
        )}
        {children}
      </form>
    </section>
  );
}
