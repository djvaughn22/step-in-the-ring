// Pure logic for the Five Hour Sprint Tool — readiness, packet/report
// generation. No React, no browser APIs, so it's directly unit-testable.

export type Sprint = {
  id: string;
  deliverable: string;
  repository: string;
  branch: string;
  startCommit: string;
  acceptanceCase: string;
  protectedSystems: string[];
  requiredChecks: string[];
  deploymentPath: string;
  bonusTask?: string;
  availableAllowance: number;
  implementationAllowance: number;
  testingAllowance: number;
  recoveryAllowance: number;
  createdAt: string;
};

export type AllowanceEntry = {
  id: string;
  project: string;
  deliverable: string;
  role: string;
  actualUsed: number;
  verified: boolean;
  outcomes: string[];
  incidents: string[];
  createdAt: string;
};

export function linesFrom(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function sprintReadyState(sprint: Sprint): boolean {
  return !!(
    sprint.deliverable &&
    sprint.repository &&
    sprint.branch &&
    sprint.startCommit &&
    sprint.acceptanceCase &&
    sprint.protectedSystems.length > 0 &&
    sprint.requiredChecks.length > 0 &&
    sprint.deploymentPath &&
    sprint.availableAllowance > 0
  );
}

export function generateTaskPacket(sprint: Sprint): string {
  return `FIVE HOUR SPRINT TASK PACKET

Deliverable: ${sprint.deliverable}
Repository: ${sprint.repository}
Starting branch: ${sprint.branch}
Starting commit: ${sprint.startCommit}

ACCEPTANCE CASE
${sprint.acceptanceCase}

PROTECTED SYSTEMS
${sprint.protectedSystems.join("\n")}

REQUIRED CHECKS
${sprint.requiredChecks.join("\n")}

DEPLOYMENT PATH
${sprint.deploymentPath}
${sprint.bonusTask ? `\nBONUS TASK\n${sprint.bonusTask}` : ""}
ALLOWANCE ALLOCATION
- Implementation: ${sprint.implementationAllowance}k tokens
- Testing/Deployment: ${sprint.testingAllowance}k tokens
- Recovery: ${sprint.recoveryAllowance}k tokens
- Total available: ${sprint.availableAllowance}k tokens
`;
}

export function generateReport(sprint: Sprint, entries: AllowanceEntry[]): string {
  const totalUsed = entries.reduce((sum, e) => sum + e.actualUsed, 0);
  const unverified = entries.filter((e) => !e.verified);
  return `PROOF-OF-WORK REPORT

Deliverable: ${sprint.deliverable}
Repository: ${sprint.repository} @ ${sprint.branch}
Starting commit: ${sprint.startCommit}

ACCEPTANCE CASE
${sprint.acceptanceCase}

REQUIRED CHECKS
${sprint.requiredChecks.join("\n")}

DEPLOYMENT PATH
${sprint.deploymentPath}

ALLOWANCE
Available: ${sprint.availableAllowance}k tokens
Actual used: ${totalUsed}k tokens (${entries.length} ledger ${entries.length === 1 ? "entry" : "entries"})
${unverified.length > 0 ? `⚠ ${unverified.length} unverified ${unverified.length === 1 ? "entry" : "entries"} — not counted as proven outcomes.` : "All entries verified."}

LEDGER
${
    entries.length === 0
      ? "No ledger entries recorded for this repository yet."
      : entries
          .map(
            (e) =>
              `- ${e.role}: ${e.actualUsed}k tokens, ${e.verified ? "verified" : "UNVERIFIED"}\n  Outcomes: ${
                e.outcomes.join("; ") || "none recorded"
              }${e.incidents.length ? `\n  Incidents: ${e.incidents.join("; ")}` : ""}`,
          )
          .join("\n")
  }
`;
}
