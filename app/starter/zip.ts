// A small .zip writer (stored, no compression). Photos are already
// compressed and the HTML is small, so this keeps the download simple and
// needs no library. Works in the browser and in tests.

import { photoSpots, renderSite } from "./render";
import type { SiteDraft } from "./types";

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntry {
  path: string;
  data: Uint8Array;
}

export function makeZip(entries: ZipEntry[], when = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const dosTime = (when.getHours() << 11) | (when.getMinutes() << 5) | Math.floor(when.getSeconds() / 2);
  const dosDate = ((when.getFullYear() - 1980) << 9) | ((when.getMonth() + 1) << 5) | when.getDate();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;

  for (const e of entries) {
    const name = enc.encode(e.path);
    const crc = crc32(e.data);
    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true); // names are UTF-8
    lv.setUint16(8, 0, true); // stored
    lv.setUint16(10, dosTime, true);
    lv.setUint16(12, dosDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, e.data.length, true);
    lv.setUint32(22, e.data.length, true);
    lv.setUint16(26, name.length, true);
    local.set(name, 30);
    locals.push(local, e.data);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, dosTime, true);
    cv.setUint16(14, dosDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, e.data.length, true);
    cv.setUint32(24, e.data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true);
    central.set(name, 46);
    centrals.push(central);
    offset += local.length + e.data.length;
  }

  const centralSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);

  const parts = [...locals, ...centrals, end];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

function dataUrlBytes(url: string): { bytes: Uint8Array; ext: string } | null {
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(url);
  if (!m) return null;
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, ext: m[1] === "jpeg" ? "jpg" : m[1] };
}

export function readme(d: SiteDraft): string {
  const name = d.details.name.trim() || "your business";
  return `Website files for ${name}
Made with the Step In The Ring website starter.

WHAT'S IN THIS FOLDER
  index.html   your whole website, one page
  images/      the photos you added
  README.txt   this note

These files are yours. Step In The Ring does not host your website and
keeps no copy of these files.

CHECK IT
  Double-click index.html. It opens in your web browser, the same way
  visitors will see it.

PUT IT ONLINE
  Any web host that accepts plain files (often called "static hosting")
  will work. Upload this whole folder, keeping index.html at the top level.
  Many hosts let you drag the folder onto a page in your browser.

  Then connect your domain (like yourbusiness.com). Your host shows the
  settings to enter at the company where you bought the domain. Changes
  can take a few hours to show up everywhere.

CHANGE IT LATER
  Go back to the starter in the same browser to edit your saved draft and
  download again, or open index.html in any text editor.

WANT HELP?
  We can connect your domain and hosting for you, with a written quote
  first: https://stepinthering.com/request
`;
}

/** The files a person downloads: index.html, their photos, and a README. */
export function exportEntries(d: SiteDraft): ZipEntry[] {
  const enc = new TextEncoder();
  const imagePaths: Record<string, string> = {};
  const images: ZipEntry[] = [];
  const on = new Set(d.sections.filter((x) => x.on).map((x) => x.kind));
  // Only photos the page actually shows: a hidden section's photos, or a
  // top-of-page photo with the "words only" style, stay out of the download.
  const shown = (id: string) =>
    id === "hero" ? d.look.heroStyle !== "plain" : id === "about" ? on.has("about") : on.has("gallery");
  for (const { id, photo } of photoSpots(d)) {
    if (!photo.src || !shown(id)) continue;
    const got = dataUrlBytes(photo.src);
    if (!got) continue;
    const path = `images/${id}.${got.ext}`;
    imagePaths[id] = path;
    images.push({ path, data: got.bytes });
  }
  return [
    { path: "index.html", data: enc.encode(renderSite(d, { mode: "export", imagePaths })) },
    ...images,
    { path: "README.txt", data: enc.encode(readme(d)) },
  ];
}

export function zipName(d: SiteDraft): string {
  const slug = (d.details.name || "my-website").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  return `${slug || "my-website"}-website.zip`;
}
