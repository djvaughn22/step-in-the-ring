"use client";

// Step 2 of the website starter: add your details and make it yours.
//
// Everything stays in this browser (localStorage, DRAFT_KEY). Nothing the
// owner types is sent anywhere, put in a URL, or counted: track() calls carry
// only the event name and the example slug.

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { track } from "../lib/analytics";
import { BRAND_OWNERSHIP } from "../site/brand";
import { FREE_SHORT, PAID_LINE } from "./copy";
import DevicePreview, { type Device } from "./DevicePreview";
import { DRAFT_KEY, FONTS, PALETTES, draftFromExample, fontById, inkOn, parseDraft, replaceEverywhere } from "./draft";
import { exampleBySlug } from "./examples";
import { photoSpots, renderSite } from "./render";
import { SECTION_LABEL, type Details, type HeroStyle, type Item, type SiteDraft, type StarterExample } from "./types";
import { exportEntries, makeZip, zipName } from "./zip";

type Tab = "details" | "words" | "look" | "photos" | "sections";
const TABS: { id: Tab; label: string }[] = [
  { id: "details", label: "Your details" },
  { id: "words", label: "Words" },
  { id: "look", label: "Look" },
  { id: "photos", label: "Photos" },
  { id: "sections", label: "Sections" },
];

const HERO_STYLES: { id: HeroStyle; label: string }[] = [
  { id: "split", label: "Photo beside the words" },
  { id: "banner", label: "Photo behind the words" },
  { id: "plain", label: "Words only" },
];

const MAX_ITEMS = 8;

function loadSaved(): SiteDraft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? parseDraft(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

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

export default function StarterEditor() {
  const params = useSearchParams();
  const router = useRouter();
  const [draft, setDraft] = useState<SiteDraft | null>(null);
  const [choice, setChoice] = useState<{ saved: SiteDraft; next: StarterExample } | null>(null);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("details");
  const [device, setDevice] = useState<Device>("desktop");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [saveNote, setSaveNote] = useState<"saved" | "full" | "">("");
  const [done, setDone] = useState(false);

  // Arrive: open the saved draft, or start one from the example in the link.
  useEffect(() => {
    const saved = loadSaved();
    const ex = exampleBySlug(params.get("example") ?? "");
    /* eslint-disable react-hooks/set-state-in-effect -- reading this browser's storage once, after mount */
    if (ex && saved && saved.example !== ex.slug) setChoice({ saved, next: ex });
    else if (saved) setDraft(saved);
    else if (ex) {
      setDraft(draftFromExample(ex));
      track("starter_start", { example: ex.slug });
    }
    // On a phone, a desktop frame shrinks to about a quarter size and can't be
    // read. Start the preview in the phone frame there; the toggle still switches.
    if (window.matchMedia?.("(max-width: 700px)").matches) setDevice("phone");
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    // The slug has done its job; a reload should open the draft, not ask again.
    if (params.get("example")) window.history.replaceState(window.history.state, "", "/start/edit");
  }, [params]);

  // Save a moment after each change.
  useEffect(() => {
    if (!draft) return;
    const t = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setSaveNote("saved");
      } catch {
        setSaveNote("full");
      }
    }, 400);
    return () => window.clearTimeout(t);
  }, [draft]);

  const html = useMemo(() => (draft ? renderSite(draft, { mode: "preview" }) : ""), [draft]);

  if (!ready) return <div className="se-loading">Opening your draft…</div>;

  if (choice) {
    return (
      <div className="se-choice">
        <h1>You already have a draft</h1>
        <p>
          This browser has a draft for <strong>{choice.saved.details.name || "your business"}</strong>. Starting from the{" "}
          {choice.next.name.toLowerCase()} example replaces it. Download it first if you want to keep a copy.
        </p>
        <div className="se-choice-go">
          <button type="button" className="btn btn-gold" onClick={() => { setDraft(choice.saved); setChoice(null); }}>
            Keep working on my draft
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => { setDraft(draftFromExample(choice.next)); track("starter_start", { example: choice.next.slug }); setChoice(null); }}
          >
            Replace it with the {choice.next.name.toLowerCase()} example
          </button>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="se-choice">
        <h1>Start with an example</h1>
        <p>Pick the business that&apos;s closest to yours. You can change every word, color, photo and section.</p>
        <Link className="btn btn-gold" href="/start">Choose an example</Link>
      </div>
    );
  }

  const ex = exampleBySlug(draft.example);
  const set = (fn: (d: SiteDraft) => SiteDraft) => setDraft((d) => (d ? fn(d) : d));

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
    track("starter_download", { example: draft.example });
  };

  const startOver = () => {
    if (!window.confirm("Start over with a different example? This draft will be replaced when you pick one. Download it first if you want a copy.")) return;
    router.push("/start");
  };

  return (
    <div className="se" data-view={view}>
      <div className="se-bar">
        <ol className="se-steps" aria-label="Steps">
          <li className="is-done"><Link href="/start">1. Choose an example</Link></li>
          <li aria-current="step">2. Add your details and make it yours</li>
        </ol>
        <div className="se-bar-go">
          <span className="se-save" role="status">
            {saveNote === "full" ? "This browser is out of room for the draft. Try fewer or smaller photos." : saveNote === "saved" ? "Saved in this browser" : ""}
          </span>
          <span className="se-free">{FREE_SHORT}</span>
          <button type="button" className="btn btn-gold" onClick={download}>Download site files</button>
        </div>
      </div>

      <div className="se-switch" role="group" aria-label="Show">
        <button type="button" aria-pressed={view === "edit"} onClick={() => setView("edit")}>Edit</button>
        <button type="button" aria-pressed={view === "preview"} onClick={() => setView("preview")}>Preview</button>
      </div>

      {done && (
        <section className="se-done" aria-labelledby="done-h">
          <h2 id="done-h">Your files are downloading.</h2>
          <p>{BRAND_OWNERSHIP} The download has your page, your photos and a short README on putting it online yourself, at no cost from us.</p>
          <p>{PAID_LINE}</p>
          <div className="se-done-go">
            <Link className="btn btn-ghost" href="/services#publish">See paid publishing help</Link>
            <Link className="text-link" href="/request#publish">Ask for a quote&nbsp;→</Link>
            <button type="button" className="text-link se-linkbtn" onClick={() => setDone(false)}>Keep editing</button>
          </div>
        </section>
      )}

      <div className="se-main">
        <div className="se-panel">
          <div className="se-tabs" role="tablist" aria-label="Edit">
            {TABS.map((t) => (
              <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="se-body" role="tabpanel">
            {tab === "details" && <DetailsTab draft={draft} set={set} ex={ex} />}
            {tab === "words" && <WordsTab draft={draft} set={set} />}
            {tab === "look" && <LookTab draft={draft} set={set} ex={ex} />}
            {tab === "photos" && <PhotosTab draft={draft} set={set} />}
            {tab === "sections" && <SectionsTab draft={draft} set={set} />}
          </div>
          <div className="se-foot">
            <button type="button" className="text-link se-linkbtn" onClick={startOver}>Start over with another example</button>
            <Link className="text-link" href="/services#publish">Paid help publishing</Link>
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
  const field = (key: keyof Details, label: string, hint?: string, type = "text", carry = false) => (
    <Field label={label} hint={hint}>
      <input
        type={type}
        value={draft.details[key]}
        onFocus={() => { before.current = draft.details[key]; }}
        onChange={(e) => { const v = e.target.value; set((d) => ({ ...d, details: { ...d.details, [key]: v } })); }}
        onBlur={(e) => { if (carry) { const v = e.target.value; set((d) => replaceEverywhere(d, before.current, v)); } }}
        autoComplete="off"
      />
    </Field>
  );
  return (
    <div className="se-stack">
      <p className="se-intro">Start here. Put in your own details and the preview updates as you type. Your business name and area carry into the wording when you leave each box.</p>
      {field("name", "Business name", undefined, "text", true)}
      {field("tagline", "What you do, in a few words", "Shown above the headline and in search results.")}
      {field("area", "Where you work", "A town, neighborhood or \"online\".", "text", true)}
      {field("phone", "Phone", "Used for the Call and Text buttons. Leave it empty to hide them.", "tel")}
      {field("email", "Email", "Leave it empty to hide the Email button.", "email")}
      {field("booking", "Online booking link (optional)", "If you already use a booking or scheduling service, paste its https:// link.", "url")}
      {field("hours", "Hours")}
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
      <p className="se-intro">Every word is yours to change. Sections are in page order; hidden ones are marked.</p>
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
