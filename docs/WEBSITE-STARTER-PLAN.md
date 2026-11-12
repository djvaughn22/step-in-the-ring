# Website starter: product plan (2026-11-11, shipped)

Owner brief: reposition Step In The Ring as a practical website starter for solo
owners and small service businesses. Keep everything that already works.

## 1. What exists today (audit)

| Area | Routes | Keep? |
|---|---|---|
| Make with AI front door: idea box, four back-and-forth examples, other ways to start, help | `/` (RingApp `mode="home"`) | Yes. Moves to `/make`, unchanged except the hero lines and the services strip. |
| Create workbench and stepped-in workspace (first/next AI messages, brief view, saved Builds) | `/create`, `/build/*` via vNext | Yes, untouched |
| Six-step "put a website online" coach | `/build` | Yes, untouched; linked from the starter's publish help |
| Tools (first version, try-it, one-liner, launch checklist) | `/tools/*` | Yes, untouched |
| Engines + Engine Room, Five Hour Sprint, Build Machine, Ready to Build | `/engines*`, `/five-hour-sprint-tool`, `/build-machine`, `/products/ready-to-build` | Yes, untouched |
| Saved work (Your work), Builds, Projects, Library | `/library`, `/builds/[id]`, `/projects` | Yes, untouched |
| Made here portfolio (showcase tiles, one list) | `/builds` (`app/work/work.ts`) | Yes, untouched |
| Services + request form + owner inbox | `/services`, `/request`, `/owner/inquiries` | Services rewritten; request path kept, gains a "Publish help" choice |
| Footer (short note) and About disclaimer | everywhere, `/about#disclaimer` | Untouched |

Nothing in the product today makes a business website a person can download.
The `/build` coach teaches the hosting steps, the vNext workspace writes AI
messages. Neither produces site files.

## 2. What can be reused

- Registry (`app/site/registry.ts`) and header (`RingHeader.tsx`) for the new
  primary/secondary navigation.
- `Sheet`, `Masthead`, `Band` page frames, `.btn` styles and colour tokens
  (light and dark already handled).
- The request form and its Postgres + email path; `offers.ts` stays the only
  file with prices.
- The `/build` six-step coach as the "do it yourself" publishing guide.

## 3. The flow

1. **Choose a business example** (`/start`): 22 examples in a few plain
   groups. Each card opens a draft from that example.
2. **Add your details and make it yours** (`/start/edit`): your details first
   (name, one line about what you do, area, phone, email, booking link), then
   words, look (colour sets + your own colour, five fonts), photos, and
   sections (show, hide, reorder). Live preview, phone or desktop.
3. **Finish** (same screen): download a .zip of the site files (index.html,
   your photos, a plain README on publishing), or ask for help publishing.

The draft saves in this browser only. Nothing is sent to us. Step In The Ring
does not host the site.

## 4. Under the hood: one system, not 22

- `app/starter/examples.ts`: 22 entries of data only (wording, services,
  steps, FAQs, photo spots, colours, font, which layout).
- `app/starter/layouts.ts`: five layouts (appointment, on-site, portfolio,
  remote, orders), each a default order of eight shared section types
  (hero, services, steps, about, gallery, area, faq, contact).
- `app/starter/render.ts`: ONE renderer that turns a draft into a standalone
  HTML file. The example pages, the editor preview and the download all use it.
- `app/starter/zip.ts`: a small dependency-free .zip writer.
- `/examples` and `/examples/[slug]`: each example page has its own
  description, what's in it and why, what to add yourself, the live demo, and
  "Start from this example".

Content rules: fictional business names, 555-01xx phone numbers and
example.com addresses. No invented credentials, reviews, guarantees, licence
claims or prices. Where a real business would add a licence number or
insurance, the example says "add yours" in the editor notes, not in the demo.

## 5. Navigation

Primary: Website starter · Examples · Services · Made here.
"More" (secondary): Make with AI (`/make`) · How it works · Tools · Your work.
Every old route still works.

## 6. Services

Range $250 to $2,500+, written quote first, no checkout:
Publish help ($250) · Finish my draft (from $600) · Small business site (from
$1,200) · Custom site or web app (from $2,500). Care plans stay described, not
sold. The founder paragraph is removed (faceless brand).

## 7. What shipped (2026-11-11)

- Home is the website starter. The make-with-AI front door moved whole to
  `/make`; old `/?idea=` and `/?open=` links forward there.
- `/start` (choose), `/start/edit` (make it yours, download), `/examples` and
  22 example pages, all from one renderer.
- Free vs paid, said the same way everywhere (`app/starter/copy.ts`): making
  and downloading a site is free; finishing or publishing help is optional,
  paid, and inquiry-only.
- Services: four provisional packages, a "Where it stops" line on each, and a
  side-by-side Finish my draft vs Small business site table. No deposit or
  payment wording; work starts only after a written quote is approved.
- The download: `index.html` + only the photos the page shows + README. Skip
  link, labelled section menu (also on phones), focus outlines, lazy photos,
  section anchors that clear the sticky header. Checked by extracting real
  zips and opening `index.html` from disk on desktop and phone.
- Layout character: each of the five layouts sets services differently
  (cards, side-ruled list, rows, menu, big-first gallery), and corners follow
  the font.

## 8. Limitations

- One draft per browser. Starting another example asks before replacing it.
- One page per site.
- Demo photos are shaded placeholders that say what belongs there. No stock
  images were bought or imported.
- Drafts live in localStorage; large photo sets can hit the browser's limit
  (the editor says so).
- Prices are provisional. Paid help is inquiry-only: no checkout, no deposits,
  no commercial activation until the owner approves it after the employment
  review.

## 9. Next priorities (when this is unparked)

1. Several saved drafts per browser, so a person can try three examples
   before choosing (with its own tests: storage, migration, quota).
2. Measure how long a first useful draft takes before making any time claim.
3. Real demo photography for the 22 examples, licensed or the owner's own.
4. Multi-page sites, if publish-help requests ask for them.
