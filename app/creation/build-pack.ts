// The Build Pack — a portable export of one creation.
//
// Two mandatory formats:
//   creation.json      — the validated canonical record (re-importable)
//   creation-brief.md  — human-readable: idea, interpretation, spec, prompt
//
// No ZIP, no dependencies: two clean files a human or another tool can read.

import { adapterForType, type SpecSection } from "./adapters";
import type { BuilderDefaults } from "./builder-defaults";
import { CREATION_TYPE_LABEL, SOFTWARE_VERDICT_LABEL } from "./types";
import type { CreationView } from "./record";

export function buildPackJson(v: CreationView): string {
  return JSON.stringify({ kind: "sitr-creation", record: v.record }, null, 2);
}

const section = (title: string, body: string) => (body.trim() ? `## ${title}\n\n${body.trim()}` : "");
const list = (items: string[]) => items.map((s) => `- ${s}`).join("\n");

export function buildPackMarkdown(v: CreationView, prompt: string, spec?: SpecSection[]): string {
  const i = v.interpretation;
  const specSections = spec ?? adapterForType(v.creationType).spec(v);
  const journey = v.record.journey.length
    ? v.record.journey.map((j) => `- ${j.engineId} — ${new Date(j.at).toLocaleDateString()} (${j.why})`).join("\n")
    : "- Straight from the idea to this pack.";

  return [
    `# ${v.record.originalTitle || i.title.value} — Build Pack`,
    "",
    `Made with StepInTheRing on ${new Date().toLocaleDateString()}. Source: ${v.record.source} (${v.record.sourceFlow}).`,
    "",
    section("The original idea, word for word", `> ${v.record.originalIdea.replace(/\n/g, "\n> ")}`),
    section(
      "What this is",
      [
        `**${CREATION_TYPE_LABEL[v.creationType]}** — ${v.typeReason}.`,
        v.primaryUser ? `**For:** ${v.primaryUser}` : "",
        v.beneficiary ? `**Serving:** ${v.beneficiary}` : "",
        v.problem ? `**The real need:** ${v.problem}` : "",
        `**Smallest successful outcome:** ${v.smallestOutcome}`,
        `**Version-one promise:** ${v.versionOnePromise}`,
        `**Software:** ${SOFTWARE_VERDICT_LABEL[v.software.verdict]} — ${v.software.reason}`,
        v.software.nonSoftwareTest ? `**Smallest non-software test:** ${v.software.nonSoftwareTest}` : "",
      ].filter(Boolean).join("\n\n"),
    ),
    section("Facts (stated by the creator)", list(v.facts)),
    section("Assumptions (made by the system — correct freely)", v.assumptions.length ? list(v.assumptions) : "None."),
    section("Recommendations", v.recommendations.length ? list(v.recommendations) : "None."),
    section(
      "Out of scope for version one",
      list([...v.record.exclusions, ...i.exclusions.map((c) => c.value)]) || "Nothing excluded yet.",
    ),
    section(
      "The specification",
      specSections.map((s) => `### ${s.title}\n\n${s.lines.join("\n")}`).join("\n\n"),
    ),
    section("Acceptance test", `It's done when: ${v.smallestOutcome}`),
    section("The builder prompt", "```\n" + prompt + "\n```"),
    section("Creation history", journey),
  ]
    .filter(Boolean)
    .join("\n\n") + "\n";
}

/* ── Downloads ─────────────────────────────────────────────────────────── */

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "creation";

export function downloadBuildPack(v: CreationView, prompt: string, defaults?: BuilderDefaults, spec?: SpecSection[]) {
  void defaults;
  const base = slug(v.record.originalTitle || v.interpretation.title.value);
  download(`${base}-brief.md`, buildPackMarkdown(v, prompt, spec), "text/markdown");
}

export function downloadCreationJson(v: CreationView) {
  const base = slug(v.record.originalTitle || v.interpretation.title.value);
  download(`${base}-creation.json`, buildPackJson(v), "application/json");
}
