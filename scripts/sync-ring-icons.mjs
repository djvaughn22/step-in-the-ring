// Generate browser/install icons from the same geometry used by RingMark.
import { readFileSync, writeFileSync } from "node:fs";
const mark = readFileSync(new URL('../public/icons/ring-mark.svg', import.meta.url), 'utf8');
const geometry = mark.slice(mark.indexOf('>') + 1, mark.lastIndexOf('</svg>'));
for (const [file, inset] of [['../app/icon.svg', 4], ['../public/icons/ring-512.svg', 4], ['../public/icons/ring-512-maskable.svg', 12]]) {
  writeFileSync(new URL(file, import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${inset === 12 ? 0 : 12}" fill="#08182B"/><g transform="translate(${inset} ${inset}) scale(${(64 - inset * 2) / 64})">${geometry}</g></svg>\n`);
}
