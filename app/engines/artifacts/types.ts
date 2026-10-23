// The thing a visitor leaves an engine holding. Every question-driven engine
// returns one of these: a finished, usable artifact with its assumptions and
// unknowns labeled, never a template for the visitor to fill in.

export interface ArtifactSection {
  heading: string;
  body: string;
}

export interface EngineArtifact {
  engineId: string;
  /** What kind of thing this is, in plain words: "Repair brief", "Event plan". */
  kind: string;
  title: string;
  /** One or two sentences: what this is and how to use it right now. */
  summary: string;
  /** The single next thing to do, concrete enough to do today. */
  nextAction: string;
  sections: ArtifactSection[];
  /** Choices the engine made for the visitor. Each is editable by changing an answer. */
  assumptions: string[];
  /** Facts the engine could not know, and what they would change. */
  unknowns: string[];
  /** A paste-ready prompt, when the artifact is meant for a coding or writing tool. */
  prompt?: { label: string; text: string };
  /** Set when missing inputs keep this from being a real answer — shown, not hidden. */
  limitation?: string;
}

export function artifactToMarkdown(a: EngineArtifact): string {
  const blocks: (string | null)[] = [
    `# ${a.title}\n_${a.kind}_`,
    a.summary,
    a.limitation ? `> **Limitation:** ${a.limitation}` : null,
    `**Next action:** ${a.nextAction}`,
    ...a.sections.map((s) => `## ${s.heading}\n${s.body}`),
    a.assumptions.length ? `## Assumptions (change any that are wrong)\n${a.assumptions.map((x) => `- ${x}`).join("\n")}` : null,
    a.unknowns.length ? `## Still unknown\n${a.unknowns.map((x) => `- ${x}`).join("\n")}` : null,
    a.prompt ? `## ${a.prompt.label}\n\n\`\`\`\n${a.prompt.text}\n\`\`\`` : null,
  ];
  return blocks.filter((b): b is string => !!b).join("\n\n") + "\n";
}
