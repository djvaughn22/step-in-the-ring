"use client";

// Steps 2 and 3 of the website starter: make it yours, then check and download.
// Owner direction (Nov 26-27 2026): the download is free again (it was owner-only
// from Nov 26); help is "Email the owner for more details".
//
// Everything stays in this browser (localStorage, DRAFTS_KEY in drafts.ts).
// Each example someone starts keeps its own draft. Nothing the owner types is
// sent anywhere, put in a URL, or counted: track() calls carry only the event
// name and the example slug.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "../lib/analytics";
import { BRAND_OWNERSHIP } from "../site/brand";
import { checkDraft, type CheckItem, type CheckResult } from "./check";
import { FREE_SHORT, HELP_LINE, HELP_MAILTO, PAID_LINE } from "./copy";
import DevicePreview, { type Device } from "./DevicePreview";
import { FONTS, PALETTES, draftFromExample, fontById, inkOn, replaceEverywhere } from "./draft";
import {
  MAX_DRAFTS, activeEntry, byRecent, draftLabel, loadStore, openExample, removeDraft, saveStore, setActive, updateActive,
  type DraftStore,
} from "./drafts";
import { exampleBySlug } from "./examples";
import { photoSpots, renderSite } from "./render";
import { SECTION_LABEL, type Details, type HeroStyle, type Item, type SiteDraft, type StarterExample } from "./types";
import { exportEntries, makeZip, zipName } from "./zip";
import { PAID_HELP_OPEN } from "../site/paidHelp";

type Tab = "details" | "words" | "look" | "photos" | "sections" | "check";
const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Your details" },
  { id: "words", label: "Words" },
  { id: "look", label: "Look" },
  { id: "photos", label: "Photos" },
  { id: "sections", label: "Sections" },
  { id: "check", label: "Check" },
];

const HERO_STYLES: { id: HeroStyle; label: string }[] = [
  { id: "split", label: "Photo beside the words" },
  { id: "banner", label: "Photo behind the words" },
  { id: "plain", label: "Words only" },
];

const MAX_ITEMS = 8;

/** Shrink a photo to at most 1600px on its long side, as a JPEG. */
async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function edited(ms: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "edited today";
  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "edited yesterday";
  return `edited ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/** Hand the draft to the Launch engine without retyping, through this browser only. */
function launchSeed(d: SiteDraft): void {
  const ex = exampleBySlug(d.example);
  const name = d.details.name.trim() || "my business";
  const kind = ex ? ` (${ex.name.toLowerCase()})` : "";
  const area = d.details.area.trim();
  const raw = `A new one-page website for ${name}${kind}${area ? `, ${area}` : ""}`;
  try {
    window.localStorage.setItem("sitr-engine-seed", JSON.stringify({ engineId: "launch", title: `${name} website`, raw }));
  } catch {
    /* storage blocked: the engine just opens empty */
  }
}

export default function StarterEditor() {
  const params = useSearchParams();
  const router = useRouter();
  const [store, setStore] = useState<DraftStore | null>(null);
  const [tooMany, setTooMany] = useState(false);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("details");
  const [device, setDevice] = useState<Device>("desktop");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [saveNote, setSaveNote] = useState<"saved" | "full" | "">("");
  const [done, setDone] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [nudge, setNudge] = useState(false);
  const arrived = useRef(false);
  const panel = useRef<HTMLDivElement>(null);

  // Arrive once: open every saved draft, and start (or reopen) the example in the link.
  useEffect(() => {
    if (arrived.current) return;
    arrived.current = true;
    let s = loadStore(window.localStorage);
    const slug = params.get("example") ?? "";
    let full = false;
    if (slug && exampleBySlug(slug)) {
      const next = openExample(s, slug);
      if (!next) full = true;
      else {
        if (next.drafts.length > s.drafts.length) track("starter_start", { example: slug });
        s = next;
      }
    }
    // Reading this browser's storage once, after mount.
    setStore(s);
    setTooMany(full);
    setShowDrafts(full);
    // On a phone, a desktop frame shrinks to about a quarter size and can't be
    // read. Start the preview in the phone frame there; the toggle still switches.
    if (window.matchMedia?.("(max-width: 700px)").matches) setDevice("phone");
    setReady(true);
    // The slug has done its job; a reload should open the draft, not add another.
    if (slug) window.history.replaceState(window.history.state, "", "/start/edit");
  }, [params]);

  // Save a moment after each change.
  useEffect(() => {
    if (!store) return;
    const t = window.setTimeout(() => setSaveNote(saveStore(window.localStorage, store) === "ok" ? "saved" : "full"), 400);
    return () => window.clearTimeout(t);
  }, [store]);

  const entry = store ? activeEntry(store) : undefined;
  const draft = entry?.draft ?? null;
  const html = useMemo(() => (draft ? renderSite(draft, { mode: "preview" }) : ""), [draft]);
  const check = useMemo<CheckResult | null>(() => (draft ? checkDraft(draft) : null), [draft]);

  if (!ready || !store) return <div className="se-loading">Opening your draft…</div>;

  const drafts = byRecent(store);
  const openDraft = (id: string) => {
    setStore((s) => (s ? setActive(s, id) : s));
    setTab("details");
    setDone(false);
    setNudge(false);
    setShowDrafts(false);
    setTooMany(false);
  };
  const deleteDraft = (id: string) => {
    const e = store.drafts.find((x) => x.id === id);
    if (!e) return;
    if (!window.confirm(`Delete the draft for ${draftLabel(e.draft)}? It can't be brought back. Download it first if you want a copy.`)) return;
    setStore((s) => (s ? removeDraft(s, id) : s));
    setTooMany(false);
  };

  const draftsPanel = (
    <section className="se-drafts" aria-labelledby="drafts-h">
      <h2 id="drafts-h">Your drafts in this browser</h2>
      {tooMany && <p className="se-err" role="alert">This browser already holds {MAX_DRAFTS} drafts. Delete one you don&apos;t need, then start the new one again.</p>}
      {drafts.length ? (
        <ul>
          {drafts.map((e) => {
            const ex = exampleBySlug(e.draft.example);
            const isOpen = e.id === store.active;
            return (
              <li key={e.id} aria-current={isOpen ? "true" : undefined}>
                <span className="se-drafts-name">
                  <strong>{draftLabel(e.draft)}</strong>
                  <span>{[ex?.name, edited(e.updated)].filter(Boolean).join(" · ")}</span>
                </span>
                {isOpen ? <em>Open now</em> : <button type="button" className="btn btn-ghost btn-small" onClick={() => openDraft(e.id)}>Open</button>}
                <button type="button" className="se-remove" onClick={() => deleteDraft(e.id)} aria-label={`Delete the draft for ${draftLabel(e.draft)}`}>Delete</button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p className="se-drafts-foot">
        <Link className="text-link" href="/start">Start another from an example&nbsp;→</Link>
        <span>Up to {MAX_DRAFTS} drafts. They stay in this browser only, so download the ones you want to keep safe.</span>
      </p>
    </section>
  );

  if (!draft) {
    return (
      <div className="se-choice">
        <h1>{tooMany ? "Your drafts" : "Start with an example"}</h1>
        {tooMany ? draftsPanel : (
          <>
            <p>Pick the example that&apos;s closest to yours. You can change every word, color, photo and section.</p>
            <Link className="btn btn-gold" href="/start">Choose an example</Link>
          </>
        )}
      </div>
    );
  }

  const ex = exampleBySlug(draft.example);
  const set = (fn: (d: SiteDraft) => SiteDraft) => setStore((s) => {
    const cur = s ? activeEntry(s) : undefined;
    return s && cur ? updateActive(s, fn(cur.draft)) : s;
  });

  const goTo = (t: Tab, field?: string) => {
    setTab(t);
    setView("edit");
    window.setTimeout(() => {
      if (field) document.getElementById(`se-f-${field}`)?.focus();
      else panel.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const download = () => {
    const zip = makeZip(exportEntries(draft));
    const blob = new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = zipName(draft);
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setDone(true);
    setNudge(false);
    track("starter_download", { example: draft.example });
  };

  // Things that would mislead a visitor come first: show them before the files.
  const askDownload = () => {
    if (check && check.fixCount > 0 && !(tab === "check" && nudge)) {
      setNudge(true);
      goTo("check");
      return;
    }
    download();
  };

  const toLaunch = () => {
    launchSeed(draft);
    track("starter_next", { to: "launch", example: draft.example });
    router.push("/engines/room?engine=launch");
  };

  return (
    <div className="se" data-view={view}>
      <div className="se-bar">
        <ol className="se-steps" aria-label="Steps">
          <li className="is-done"><Link href="/start">1. Choose an example</Link></li>
          <li aria-current={tab === "check" ? undefined : "step"}>2. Make it yours</li>
          <li aria-current={tab === "check" ? "step" : undefined}>
            <button type="button" className="se-steplink" onClick={() => goTo("check")}>3. Check and download</button>
          </li>
        </ol>
        <div className="se-bar-go">
          <span className="se-save" role="status">
            {saveNote === "full" ? "This browser is out of room. Try fewer or smaller photos, or delete a draft you don't need." : saveNote === "saved" ? "Saved in this browser" : ""}
          </span>
          <button type="button" className="btn btn-ghost btn-small se-drafts-btn" aria-expanded={showDrafts} onClick={() => setShowDrafts((v) => !v)}>
            Drafts ({store.drafts.length})
          </button>
          <span className="se-dl">
            <button type="button" className="btn btn-gold" onClick={askDownload}>Download site files</button>
            <span className="se-free">{check && check.fixCount ? `${check.fixCount} to fix first` : FREE_SHORT}</span>
          </span>
        </div>
      </div>

      {showDrafts && draftsPanel}

      <div className="se-switch" role="group" aria-label="Show">
        <button type="button" aria-pressed={view === "edit"} onClick={() => setView("edit")}>Edit</button>
        <button type="button" aria-pressed={view === "preview"} onClick={() => setView("preview")}>Preview</button>
      </div>

      {done && (
        <section className="se-done" aria-labelledby="done-h">
          <h2 id="done-h">Your files are downloading.</h2>
          <p>{BRAND_OWNERSHIP} Open README.txt in the download first: it lists anything that was still open, how to put the site online, and what to do once it&apos;s live.</p>
          <div className="se-next">
            <div>
              <strong>Plan your launch week</strong>
              <span>The Launch engine turns your new site into a short checklist and messages to send to the people who already know you.</span>
              <button type="button" className="btn btn-ghost btn-small" onClick={toLaunch}>Plan the launch</button>
            </div>
            {PAID_HELP_OPEN && (
              <div>
                <strong>Want help putting it online?</strong>
                <span>{PAID_LINE}</span>
                <span className="se-next-links">
                  <Link className="text-link" href="/services#publish">See publishing help</Link>
                  <Link className="text-link" href="/request#publish">Ask for a quote&nbsp;→</Link>
                </span>
              </div>
            )}
            {!PAID_HELP_OPEN && (
              <div>
                <strong>Want help with it?</strong>
                <span>Email the owner for more details.</span>
                <span className="se-next-links">
                  <a className="text-link" href={HELP_MAILTO}>Email the owner&nbsp;→</a>
                </span>
              </div>
            )}
          </div>
          <button type="button" className="text-link se-linkbtn" onClick={() => setDone(false)}>Keep editing</button>
        </section>
      )}

      <div className="se-main">
        <div className="se-panel" ref={panel}>
          <div className="se-tabs" role="tablist" aria-label="Edit">
            {TABS.map((t) => (
              <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => { setTab(t.id); if (t.id !== "check") setNudge(false); }}>
                {t.label}
                {t.id === "check" && check && check.fixCount ? <span className="se-badge" aria-label={`${check.fixCount} to fix`}>{check.fixCount}</span> : null}
              </button>
            ))}
          </div>
          <div className="se-body" role="tabpanel">
            {tab === "details" && <DetailsTab draft={draft} set={set} ex={ex} />}
            {tab === "words" && <WordsTab draft={draft} set={set} />}
            {tab === "look" && <LookTab draft={draft} set={set} ex={ex} />}
            {tab === "photos" && <PhotosTab draft={draft} set={set} />}
            {tab === "sections" && <SectionsTab draft={draft} set={set} />}
            {tab === "check" && check && <CheckTab result={check} nudge={nudge} onGo={(i) => goTo(i.tab, i.field)} onDownload={download} />}
          </div>
          <div className="se-foot">
            <Link className="text-link" href="/start">Start another draft</Link>
            {PAID_HELP_OPEN ? <Link className="text-link" href="/services#publish">Paid help publishing</Link> : <a className="text-link" href={HELP_MAILTO} title={HELP_LINE}>Email the owner</a>}
          </div>
        </div>
        <div className="se-preview">
          <DevicePreview html={html} title="Preview of your website" device={device} onDevice={setDevice} />
          <p className="se-preview-note">Empty photo spots show what fits there. They&apos;re left out of the download until you add a photo.</p>
        </div>
      </div>
    </div>
  );
}

type Setter = (fn: (d: SiteDraft) => SiteDraft) => void;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="se-field">
      <span className="se-label">{label}</span>
      {children}
      {hint ? <span className="se-hint">{hint}</span> : null}
    </label>
  );
}

function DetailsTab({ draft, set, ex }: { draft: SiteDraft; set: Setter; ex?: StarterExample }) {
  // When the name or area changes, the old wording follows on blur, so a
  // half-typed name never gets written into every sentence.
  const before = useRef<string>("");
  const base = useMemo(() => (ex ? draftFromExample(ex).details : null), [ex]);
  const anyExample = !!base && (Object.keys(base) as (keyof Details)[]).some((k) => base[k] && draft.details[k] === base[k]);
  const field = (key: keyof Details, label: string, hint?: string, type = "text", carry = false) => {
    const isExample = !!base && !!base[key] && draft.details[key] === base[key];
    const id = `se-f-${key}`;
    return (
      <div className="se-field">
        <span className="se-label-row">
          <label className="se-label" htmlFor={id}>{label}</label>
          {isExample ? <span className="se-tag">Example</span> : null}
        </span>
        <input
          id={id}
          type={type}
          value={draft.details[key]}
          onFocus={(e) => {
            before.current = draft.details[key];
            // Tapping an example value selects it, so typing replaces it.
            if (isExample) e.currentTarget.select();
          }}
          onChange={(e) => { const v = e.target.value; set((d) => ({ ...d, details: { ...d.details, [key]: v } })); }}
          onBlur={(e) => { if (carry) { const v = e.target.value; set((d) => replaceEverywhere(d, before.current, v)); } }}
          autoComplete="off"
        />
        {hint ? <span className="se-hint">{hint}</span> : null}
      </div>
    );
  };
  return (
    <div className="se-stack">
      <p className="se-intro">
        {anyExample
          ? "Start here. Boxes marked Example still hold the example's made-up details: tap one and type yours. The preview updates as you type, and your name and area carry into the wording when you leave each box."
          : "Your details. The preview updates as you type, and your name and area carry into the wording when you leave each box."}
      </p>
      {field("name", "Business or group name", undefined, "text", true)}
      {field("tagline", "What you do, in a few words", "Shown above the headline and in search results.")}
      {field("area", "Where you work", "A town, neighborhood or \"online\".", "text", true)}
      {field("phone", "Phone", "Used for the Call and Text buttons. Leave it empty to hide them.", "tel")}
      {field("email", "Email", "Leave it empty to hide the Email button.", "email")}
      {field("booking", "Online booking link (optional)", "If you already use a booking or scheduling service, paste its https:// link.", "url")}
      {field("hours", "Hours", "Leave it empty to keep hours off the page.")}
      {ex && ex.addYourself.length > 0 && (
        <div className="se-note">
          <strong>Only you can add these</strong>
          <ul>{ex.addYourself.map((a) => <li key={a}>{a}</li>)}</ul>
          <span>The example leaves them out on purpose. Add them in the Words tab where they fit.</span>
        </div>
      )}
    </div>
  );
}

function CheckTab({ result, nudge, onGo, onDownload }: { result: CheckResult; nudge: boolean; onGo: (i: CheckItem) => void; onDownload: () => void }) {
  const fixes = result.items.filter((i) => i.level === "fix");
  const looks = result.items.filter((i) => i.level === "look");
  const row = (i: CheckItem) => (
    <li key={i.id} className={`se-check-${i.level}`}>
      <span className="se-check-mark" aria-hidden="true">{i.level === "fix" ? "!" : "•"}</span>
      <span className="se-check-text"><strong>{i.title}</strong><span>{i.detail}</span></span>
      <button type="button" className="btn btn-ghost btn-small" onClick={() => onGo(i)}>{i.level === "fix" ? "Fix it" : "Go there"}</button>
    </li>
  );
  return (
    <div className="se-stack">
      {nudge && fixes.length > 0 && (
        <p className="se-check-nudge" role="alert">Before you download: a few things on the page still belong to the example. Visitors would see them.</p>
      )}
      <p className="se-intro">
        {fixes.length
          ? `${fixes.length} ${fixes.length === 1 ? "thing" : "things"} to fix before you publish, then a few worth a look.`
          : "Nothing to fix. A few things are worth a look before you publish."}
      </p>
      {fixes.length > 0 && <><h3 className="se-check-h">Fix before you publish</h3><ul className="se-check">{fixes.map(row)}</ul></>}
      {looks.length > 0 && <><h3 className="se-check-h">Worth a look</h3><ul className="se-check">{looks.map(row)}</ul></>}
      {result.good.length > 0 && (
        <>
          <h3 className="se-check-h">Done</h3>
          <ul className="se-check">
            {result.good.map((g) => (
              <li key={g} className="se-check-ok"><span className="se-check-mark" aria-hidden="true">✓</span><span className="se-check-text"><strong>{g}</strong></span></li>
            ))}
          </ul>
        </>
      )}
      <div className="se-check-go">
        <button type="button" className="btn btn-gold" onClick={onDownload}>{fixes.length ? "Download anyway" : "Download site files"}</button>
        <span className="se-hint">A .zip with your page, your photos and a README on putting it online. The README lists anything still open.</span>
      </div>
    </div>
  );
}

function ItemsEditor({ items, onChange, titleLabel, textLabel, addLabel }: { items: Item[]; onChange: (xs: Item[]) => void; titleLabel: string; textLabel: string; addLabel: string }) {
  return (
    <div className="se-items">
      {items.map((it, i) => (
        <div className="se-item" key={i}>
          <Field label={`${titleLabel} ${i + 1}`}>
            <input value={it.title} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
          </Field>
          <Field label={textLabel}>
            <textarea rows={2} value={it.text} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
          </Field>
          <button type="button" className="se-remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
        </div>
      ))}
      {items.length < MAX_ITEMS && (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => onChange([...items, { title: "", text: "" }])}>{addLabel}</button>
      )}
    </div>
  );
}

function WordsTab({ draft, set }: { draft: SiteDraft; set: Setter }) {
  const on = (k: SiteDraft["sections"][number]["kind"]) => draft.sections.find((s) => s.kind === k)?.on;
  const txt = (label: string, value: string, apply: (v: string) => SiteDraft, rows = 0) => (
    <Field label={label}>
      {rows ? (
        <textarea rows={rows} value={value} onChange={(e) => { const v = e.target.value; set(() => apply(v)); }} />
      ) : (
        <input value={value} onChange={(e) => { const v = e.target.value; set(() => apply(v)); }} />
      )}
    </Field>
  );
  const d = draft;
  return (
    <div className="se-stack">
      <p className="se-intro">Every word is yours to change. Read each part as a customer would, and change anything that isn&apos;t true for you. Sections are in page order; hidden ones are marked.</p>
      {d.sections.map(({ kind }) => (
        <details key={kind} className="se-group" open={kind === "hero"}>
          <summary>{SECTION_LABEL[kind]}{on(kind) ? "" : <em> (hidden)</em>}</summary>
          {kind === "hero" && <>
            {txt("Headline", d.hero.headline, (v) => ({ ...d, hero: { ...d.hero, headline: v } }), 2)}
            {txt("A sentence or two under it", d.hero.intro, (v) => ({ ...d, hero: { ...d.hero, intro: v } }), 3)}
            {txt("Main button", d.hero.cta, (v) => ({ ...d, hero: { ...d.hero, cta: v } }))}
          </>}
          {kind === "services" && <>
            {txt("Heading", d.services.title, (v) => ({ ...d, services: { ...d.services, title: v } }))}
            {txt("Short intro", d.services.intro, (v) => ({ ...d, services: { ...d.services, intro: v } }), 2)}
            <ItemsEditor items={d.services.items} titleLabel="Service" textLabel="What it is" addLabel="Add a service" onChange={(items) => set((x) => ({ ...x, services: { ...x.services, items } }))} />
          </>}
          {kind === "steps" && <>
            {txt("Heading", d.steps.title, (v) => ({ ...d, steps: { ...d.steps, title: v } }))}
            <ItemsEditor items={d.steps.items} titleLabel="Step" textLabel="What happens" addLabel="Add a step" onChange={(items) => set((x) => ({ ...x, steps: { ...x.steps, items } }))} />
          </>}
          {kind === "about" && <>
            {txt("Heading", d.about.title, (v) => ({ ...d, about: { ...d.about, title: v } }))}
            {txt("About you", d.about.text, (v) => ({ ...d, about: { ...d.about, text: v } }), 5)}
          </>}
          {kind === "gallery" && txt("Heading", d.gallery.title, (v) => ({ ...d, gallery: { title: v } }))}
          {kind === "area" && <>
            {txt("Heading", d.area.title, (v) => ({ ...d, area: { ...d.area, title: v } }))}
            {txt("Where you work", d.area.text, (v) => ({ ...d, area: { ...d.area, text: v } }), 3)}
          </>}
          {kind === "faq" && <>
            {txt("Heading", d.faq.title, (v) => ({ ...d, faq: { ...d.faq, title: v } }))}
            <ItemsEditor items={d.faq.items} titleLabel="Question" textLabel="Answer" addLabel="Add a question" onChange={(items) => set((x) => ({ ...x, faq: { ...x.faq, items } }))} />
          </>}
          {kind === "contact" && <>
            {txt("Heading", d.contact.title, (v) => ({ ...d, contact: { ...d.contact, title: v } }))}
            {txt("A line about getting in touch", d.contact.text, (v) => ({ ...d, contact: { ...d.contact, text: v } }), 2)}
          </>}
        </details>
      ))}
    </div>
  );
}

const ACCENTS = ["#1F5FA8", "#2E6B57", "#3F7D3A", "#B5651D", "#C0573E", "#B2456E", "#6A4FC9", "#2B2B2B"];

function LookTab({ draft, set, ex }: { draft: SiteDraft; set: Setter; ex?: StarterExample }) {
  const accents = ex && !ACCENTS.includes(ex.accent) ? [ex.accent, ...ACCENTS] : ACCENTS;
  return (
    <div className="se-stack">
      <fieldset className="se-fieldset">
        <legend>Colors</legend>
        <div className="se-swatches">
          {PALETTES.map((p) => (
            <button key={p.id} type="button" className="se-swatch" aria-pressed={draft.look.palette === p.id} onClick={() => set((d) => ({ ...d, look: { ...d.look, palette: p.id } }))}>
              <span style={{ background: p.bg, borderColor: p.alt }}><i style={{ background: p.text }} /><i style={{ background: draft.look.accent }} /></span>
              {p.name}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="se-fieldset">
        <legend>Accent color</legend>
        <p className="se-hint">Used for buttons and highlights.</p>
        <div className="se-accents">
          {accents.map((c) => (
            <button key={c} type="button" className="se-accent" aria-label={`Accent ${c}`} aria-pressed={draft.look.accent.toLowerCase() === c.toLowerCase()} style={{ background: c, color: inkOn(c) }} onClick={() => set((d) => ({ ...d, look: { ...d.look, accent: c } }))} />
          ))}
          <label className="se-accent-own">
            <input type="color" value={draft.look.accent} onChange={(e) => { const v = e.target.value; set((d) => ({ ...d, look: { ...d.look, accent: v } })); }} />
            Your own
          </label>
        </div>
      </fieldset>
      <fieldset className="se-fieldset">
        <legend>Font</legend>
        <div className="se-fonts">
          {FONTS.map((f) => (
            <button key={f.id} type="button" className="se-font" aria-pressed={draft.look.font === f.id} onClick={() => set((d) => ({ ...d, look: { ...d.look, font: f.id } }))}>
              <span style={{ fontFamily: fontById(f.id).heading }}>Aa</span>
              {f.name}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="se-fieldset">
        <legend>Top of the page</legend>
        <div className="se-radios">
          {HERO_STYLES.map((h) => (
            <label key={h.id}>
              <input type="radio" name="hero" checked={draft.look.heroStyle === h.id} onChange={() => set((d) => ({ ...d, look: { ...d.look, heroStyle: h.id } }))} />
              {h.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function PhotosTab({ draft, set }: { draft: SiteDraft; set: Setter }) {
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const put = (id: string, src: string | undefined) =>
    set((d) => {
      if (id === "hero") return { ...d, photos: { ...d.photos, hero: { ...d.photos.hero, src } } };
      if (id === "about") return { ...d, photos: { ...d.photos, about: { ...d.photos.about, src } } };
      const i = Number(id.split("-")[1]);
      return { ...d, photos: { ...d.photos, gallery: d.photos.gallery.map((p, j) => (j === i ? { ...p, src } : p)) } };
    });
  const pick = async (id: string, file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("That file isn't a photo."); return; }
    setErr("");
    setBusy(id);
    try {
      put(id, await shrinkPhoto(file));
    } catch {
      setErr("That photo couldn't be opened. Try a JPEG or PNG.");
    } finally {
      setBusy("");
    }
  };
  const label = (id: string) => (id === "hero" ? "Top of the page" : id === "about" ? "About you" : `Work photo ${Number(id.split("-")[1]) + 1}`);
  return (
    <div className="se-stack">
      <p className="se-intro">Use photos you took or have the right to use. They&apos;re made smaller to load fast, and stay in this browser until you download.</p>
      {err && <p className="se-err" role="alert">{err}</p>}
      {photoSpots(draft).map(({ id, photo }) => (
        <div className="se-photo" key={id}>
          <div className="se-thumb">{/* eslint-disable-next-line @next/next/no-img-element -- a local data: URL, nothing to optimize */}
            {photo.src ? <img src={photo.src} alt="" /> : <span>No photo yet</span>}</div>
          <div>
            <strong>{label(id)}</strong>
            <span className="se-hint">Good here: {photo.caption.charAt(0).toLowerCase() + photo.caption.slice(1)}</span>
            <div className="se-photo-go">
              <label className="btn btn-ghost btn-small">
                {busy === id ? "Adding…" : photo.src ? "Replace" : "Add photo"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { void pick(id, e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              {photo.src && <button type="button" className="se-remove" onClick={() => put(id, undefined)}>Remove</button>}
              {id.startsWith("gallery-") && !photo.src && draft.photos.gallery.length > 1 && (
                <button type="button" className="se-remove" onClick={() => set((d) => ({ ...d, photos: { ...d.photos, gallery: d.photos.gallery.filter((_, j) => j !== Number(id.split("-")[1])) } }))}>Remove spot</button>
              )}
            </div>
          </div>
        </div>
      ))}
      {draft.photos.gallery.length < MAX_ITEMS && (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => set((d) => ({ ...d, photos: { ...d.photos, gallery: [...d.photos.gallery, { caption: "Another photo of your work" }] } }))}>
          Add another work photo spot
        </button>
      )}
    </div>
  );
}

function SectionsTab({ draft, set }: { draft: SiteDraft; set: Setter }) {
  const move = (i: number, by: number) =>
    set((d) => {
      const s = [...d.sections];
      const j = i + by;
      if (j < 1 || j >= s.length) return d;
      [s[i], s[j]] = [s[j], s[i]];
      return { ...d, sections: s };
    });
  return (
    <div className="se-stack">
      <p className="se-intro">Show, hide and reorder the parts of your page. The top always comes first.</p>
      <ol className="se-sections">
        {draft.sections.map((s, i) => (
          <li key={s.kind}>
            <label>
              <input
                type="checkbox"
                checked={s.on}
                disabled={s.kind === "hero"}
                onChange={(e) => { const on = e.target.checked; set((d) => ({ ...d, sections: d.sections.map((x) => (x.kind === s.kind ? { ...x, on } : x)) })); }}
              />
              {SECTION_LABEL[s.kind]}
            </label>
            {s.kind !== "hero" && (
              <span className="se-move">
                <button type="button" aria-label={`Move ${SECTION_LABEL[s.kind]} up`} disabled={i <= 1} onClick={() => move(i, -1)}>↑</button>
                <button type="button" aria-label={`Move ${SECTION_LABEL[s.kind]} down`} disabled={i === draft.sections.length - 1} onClick={() => move(i, 1)}>↓</button>
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
