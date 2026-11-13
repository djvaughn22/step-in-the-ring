import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../../starter/starter.css";
import DevicePreview from "../../starter/DevicePreview";
import { LAYOUTS, draftFromExample } from "../../starter/draft";
import { EXAMPLES, exampleBySlug } from "../../starter/examples";
import { renderSite } from "../../starter/render";
import { SECTION_LABEL } from "../../starter/types";

// One page per business example. The demo is the real renderer's output for
// that example's draft, so what you see is what "Start from this" opens.

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMPLES.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const ex = exampleBySlug((await params).slug);
  if (!ex) return {};
  return {
    title: `${ex.name} website example`,
    description: `An example website for a ${ex.name.toLowerCase()}: ${ex.blurb} See the sections and wording, then start your own from it.`,
  };
}

export default async function ExamplePage({ params }: { params: Promise<{ slug: string }> }) {
  const ex = exampleBySlug((await params).slug);
  if (!ex) notFound();
  const draft = draftFromExample(ex);
  const html = renderSite(draft, { mode: "preview" });
  const layout = LAYOUTS[ex.layout];
  const shown = draft.sections.filter((s) => s.on);
  const i = EXAMPLES.indexOf(ex);
  const prev = EXAMPLES[(i - 1 + EXAMPLES.length) % EXAMPLES.length];
  const next = EXAMPLES[(i + 1) % EXAMPLES.length];

  return (
    <main className="xp">
      <nav className="xp-crumbs" aria-label="Breadcrumb">
        <Link href="/examples">All examples</Link> <span aria-hidden="true">/</span> <span>{ex.group}</span>
      </nav>
      <header className="xp-head">
        <div>
          <span className="kicker">Example website</span>
          <h1>{ex.name}</h1>
          <p className="xp-fits">{ex.fits}</p>
        </div>
        <div className="xp-go">
          <Link className="btn btn-gold btn-big" href={`/start/edit?example=${ex.slug}`}>Start from this example</Link>
          <span>Then add your details and change anything.</span>
        </div>
      </header>

      <div className="xp-body">
        <div className="xp-demo">
          <DevicePreview html={html} title={`Example website for a ${ex.name.toLowerCase()}`} />
          <p className="xp-made-up">{draft.details.name} is a made-up business. Shaded boxes mark where your own photos go.</p>
        </div>
        <aside className="xp-side">
          <section>
            <h2>What&apos;s on the page</h2>
            <p>{layout.why}</p>
            <ol className="xp-sections">
              {shown.map((s) => (
                <li key={s.kind}>
                  <strong>{SECTION_LABEL[s.kind]}</strong>
                  <span>
                    {s.kind === "hero" && `"${draft.hero.headline}" with a "${draft.hero.cta}" button.`}
                    {s.kind === "services" && draft.services.items.map((x) => x.title).join(", ") + "."}
                    {s.kind === "steps" && draft.steps.items.map((x, n) => (n ? x.title.charAt(0).toLowerCase() + x.title.slice(1) : x.title)).join(", then ") + "."}
                    {s.kind === "about" && "A few plain sentences about how you work."}
                    {s.kind === "gallery" && `${draft.photos.gallery.length} photo spots for your own work.`}
                    {s.kind === "area" && draft.area.text}
                    {s.kind === "faq" && `${draft.faq.items.length} questions new customers ask.`}
                    {s.kind === "contact" && `Buttons to ${draft.details.booking ? "book online, " : ""}call, text and email.`}
                  </span>
                </li>
              ))}
            </ol>
          </section>
          <section>
            <h2>Only you can add these</h2>
            <ul className="xp-add">
              {ex.addYourself.map((a) => <li key={a}>{a}</li>)}
            </ul>
            <p className="xp-small">The example leaves out credentials, reviews, prices and promises on purpose. Add only what&apos;s true for your business.</p>
          </section>
          <section>
            {/* Owner, 2026-11-12: free first. Paid help is offered after a draft exists (in the editor). */}
            <h2>Free to make</h2>
            <p>Making and downloading your site is free, with no account. You keep the files and publish them with the hosting you choose.</p>
          </section>
        </aside>
      </div>

      <nav className="xp-next" aria-label="More examples">
        <Link href={`/examples/${prev.slug}`}>←&nbsp;{prev.name}</Link>
        <Link href="/examples">All {EXAMPLES.length} examples</Link>
        <Link href={`/examples/${next.slug}`}>{next.name}&nbsp;→</Link>
      </nav>
    </main>
  );
}
