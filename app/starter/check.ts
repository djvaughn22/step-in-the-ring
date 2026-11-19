// "Check and download" (2026-11-18): before anyone publishes a draft, say
// plainly what still belongs to the example. Two levels:
//   fix  — the page would mislead a visitor: the example's made-up name,
//          phone, email or booking link, or no way to reach you at all.
//   look — worth a look before publishing: wording, area, hours, empty
//          photo spots, things only the owner can add.
// Plain rules over the draft. Nothing is sent anywhere.

import { draftFromExample } from "./draft";
import { exampleBySlug } from "./examples";
import { safeEmail, safeUrl, telHref } from "./render";
import type { SiteDraft } from "./types";

export type CheckTab = "details" | "words" | "photos";

export interface CheckItem {
  id: string;
  level: "fix" | "look";
  title: string;
  detail: string;
  /** Where to fix it in the editor. */
  tab: CheckTab;
  /** The field to put the cursor in, when there is one. */
  field?: "name" | "phone" | "email" | "booking" | "area" | "hours";
}

export interface CheckResult {
  items: CheckItem[];
  /** Plain lines for what's already right. */
  good: string[];
  fixCount: number;
}

/** A phone number in the 555-0100 to 555-0199 range set aside for fiction. */
export function isFictionPhone(phone: string): boolean {
  return /555\D{0,3}01\d\d\b/.test(phone);
}

/** example.com and friends are reserved for examples; they never reach anyone. */
export function isExampleAddress(s: string): boolean {
  return /(?:^|[@/.])example\.(?:com|org|net)\b/i.test(s.trim());
}

function quote(s: string): string {
  const t = s.trim();
  return `“${t.length > 48 ? `${t.slice(0, 46).trimEnd()}…` : t}”`;
}

/** Every piece of wording on the page, for "does it still say …?" checks. */
function allWords(d: SiteDraft): string {
  const items = (xs: { title: string; text: string }[]) => xs.map((x) => `${x.title} ${x.text}`).join(" ");
  return [
    d.details.tagline, d.hero.headline, d.hero.intro, d.services.intro, items(d.services.items), items(d.steps.items),
    d.about.text, d.area.text, items(d.faq.items), d.contact.text,
  ].join(" ");
}

export function checkDraft(d: SiteDraft): CheckResult {
  const ex = exampleBySlug(d.example);
  const base = ex ? draftFromExample(ex) : null;
  const items: CheckItem[] = [];
  const good: string[] = [];
  const name = d.details.name.trim();

  // ── fix: things that would mislead a visitor ───────────────────────────
  if (!name) {
    items.push({ id: "name-empty", level: "fix", title: "Add your business name", detail: "It's the first thing on the page and in search results.", tab: "details", field: "name" });
  } else if (base && name === base.details.name) {
    items.push({ id: "name-example", level: "fix", title: `The name is still the example's, ${quote(name)}`, detail: "Put in your own business or group name. The wording that mentions it changes with it.", tab: "details", field: "name" });
  } else {
    good.push(`Your name: ${quote(name)}`);
  }

  if (base && ex && name && name !== base.details.name && allWords(d).includes(base.details.name)) {
    items.push({ id: "words-old-name", level: "fix", title: `Some wording still says ${quote(base.details.name)}`, detail: "Search the Words tab for the old name and change it to yours.", tab: "words" });
  }

  const phone = d.details.phone.trim();
  if (phone && isFictionPhone(phone)) {
    items.push({ id: "phone-example", level: "fix", title: "The phone number is the example's made-up one", detail: "Put in your number, or clear the box to hide the Call and Text buttons.", tab: "details", field: "phone" });
  }
  const email = d.details.email.trim();
  if (email && isExampleAddress(email)) {
    items.push({ id: "email-example", level: "fix", title: `The email is the example's, ${quote(email)}`, detail: "Put in the address you want messages to go to, or clear it to hide the Email button.", tab: "details", field: "email" });
  }
  const booking = d.details.booking.trim();
  if (booking && isExampleAddress(booking)) {
    items.push({ id: "booking-example", level: "fix", title: "The booking link goes nowhere yet", detail: "Paste the link from the booking or scheduling service you use, or clear it.", tab: "details", field: "booking" });
  } else if (booking && !safeUrl(booking)) {
    items.push({ id: "booking-bad", level: "fix", title: "The booking link isn't a web address", detail: "It needs to start with https://. Copy it from your booking service's share button.", tab: "details", field: "booking" });
  }

  const realPhone = telHref(phone) && !isFictionPhone(phone);
  const realEmail = safeEmail(email) && !isExampleAddress(email);
  const realBooking = safeUrl(booking) && !isExampleAddress(booking);
  if (!realPhone && !realEmail && !realBooking) {
    items.push({ id: "no-contact", level: "fix", title: "There's no real way to reach you yet", detail: "Add a phone number, an email or a booking link, so the buttons on the page work.", tab: "details", field: "phone" });
  } else {
    const ways = [realPhone && "phone", realEmail && "email", realBooking && "booking link"].filter(Boolean).join(", ");
    good.push(`A way to reach you: ${ways}`);
  }

  // ── look: worth a look before publishing ───────────────────────────────
  if (base) {
    if (d.details.area.trim() && d.details.area === base.details.area) {
      items.push({ id: "area-example", level: "look", title: `Where you work still says ${quote(d.details.area)}`, detail: "That's the example's area. Change it if yours is different.", tab: "details", field: "area" });
    }
    if (d.details.hours.trim() && d.details.hours === base.details.hours) {
      items.push({ id: "hours-example", level: "look", title: "The hours are the example's", detail: "Put in your real hours, or clear them to leave hours off the page.", tab: "details", field: "hours" });
    }
    const untouched = d.hero.headline === base.hero.headline && d.about.text === base.about.text;
    if (untouched) {
      items.push({ id: "words-example", level: "look", title: "The words are still the example's", detail: "They're written for this kind of work, but read them as a customer would and change anything that isn't true for you, starting with the About section.", tab: "words" });
    } else {
      good.push("Wording changed from the example");
    }
  }

  const on = new Set(d.sections.filter((s) => s.on).map((s) => s.kind));
  const spots = [
    ...(d.look.heroStyle !== "plain" ? [d.photos.hero] : []),
    ...(on.has("about") ? [d.photos.about] : []),
    ...(on.has("gallery") ? d.photos.gallery : []),
  ];
  const empty = spots.filter((p) => !p.src).length;
  if (empty) {
    items.push({
      id: "photos-empty",
      level: "look",
      title: empty === 1 ? "1 photo spot is empty" : `${empty} photo spots are empty`,
      detail: "Empty spots are left out of the download, so the page still looks finished. Your own photos show your real work.",
      tab: "photos",
    });
  } else if (spots.length) {
    good.push(spots.length === 1 ? "Your photo is in" : `All ${spots.length} photo spots have your photos`);
  }

  if (ex && ex.addYourself.length) {
    items.push({ id: "add-yourself", level: "look", title: "Only you can add these", detail: `${ex.addYourself.join("; ")}. Add the ones that apply in the Words tab.`, tab: "words" });
  }

  return { items, good, fixCount: items.filter((i) => i.level === "fix").length };
}

/** Plain lines for the README: what was still open when they downloaded. */
export function readmeTodo(d: SiteDraft): string[] {
  return checkDraft(d).items.filter((i) => i.id !== "add-yourself" && i.id !== "photos-empty").map((i) => i.title);
}
