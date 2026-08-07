// Pure logic for the Build Machine tool — candidate assessment, checklist
// definitions, and the completion report. No React, no browser APIs, so
// it's directly unit-testable. The single supported install path is Linux
// Mint 22 (Cinnamon/Xfce) on an Ubuntu 24.04 base — matches the existing
// Old Laptop to Build Machine product; this tool does not invent a
// different or wider set of supported distros.

export type BatteryCondition = "good" | "fair" | "poor" | "not-applicable" | "unknown";
export type CandidateStatus = "good" | "likely" | "needs-upgrade" | "not-recommended";

export type CandidateFacts = {
  manufacturerModel: string;
  approximateAge: string;
  isLaptop: boolean;
  cpuArch: "x86_64" | "arm" | "unknown";
  ramGb: number;
  storageGb: number;
  freeStorageGb: number;
  hasWifi: boolean;
  hasBluetooth: boolean;
  hasCameraMic: boolean;
  usbPorts: number;
  batteryCondition: BatteryCondition;
  currentlyBoots: boolean;
  hasImportantFiles: boolean;
};

export type CandidateAssessment = {
  status: CandidateStatus;
  statusLabel: string;
  blockers: string[];
  verifyItems: string[];
  notes: string[];
};

const STATUS_LABEL: Record<CandidateStatus, string> = {
  good: "Good candidate",
  likely: "Likely candidate — verify these items",
  "needs-upgrade": "Needs upgrade",
  "not-recommended": "Not recommended",
};

const MIN_FREE_STORAGE_GB = 20;
const COMFORTABLE_FREE_STORAGE_GB = 40;
const MIN_COMFORTABLE_RAM_GB = 4;
const GOOD_RAM_GB = 8;

export function assessCandidate(facts: CandidateFacts): CandidateAssessment {
  const blockers: string[] = [];
  const verifyItems: string[] = [];
  const notes: string[] = [];

  if (!facts.currentlyBoots) {
    blockers.push("The machine doesn't currently boot. Confirm it powers on and reaches some kind of screen before going further — an unbootable machine can't be assessed or converted here.");
  }
  if (facts.cpuArch === "arm") {
    blockers.push("Linux Mint 22 targets 64-bit x86 (amd64) hardware. ARM-based devices (some Chromebooks, ARM tablets, some newer ultra-thin laptops) aren't a supported path with this guide.");
  } else if (facts.cpuArch === "unknown") {
    verifyItems.push("Confirm the CPU is 64-bit x86 (amd64), not ARM, before proceeding — check the manufacturer spec page or run a system-info tool from the current OS.");
  }
  if (facts.freeStorageGb < MIN_FREE_STORAGE_GB) {
    blockers.push(`Only ${facts.freeStorageGb}GB free — that's not enough room for the OS install and the recommended local tools. Free up space or use a different/larger drive.`);
  } else if (facts.freeStorageGb < COMFORTABLE_FREE_STORAGE_GB) {
    verifyItems.push(`${facts.freeStorageGb}GB free is workable but tight. Clearing more space, or installing to a larger drive, gives real breathing room.`);
  }
  if (facts.ramGb < MIN_COMFORTABLE_RAM_GB) {
    verifyItems.push(`${facts.ramGb}GB RAM is usable but tight for everyday multitasking. A RAM upgrade (if the machine supports one) makes a real difference.`);
  } else if (facts.ramGb < GOOD_RAM_GB) {
    verifyItems.push(`${facts.ramGb}GB RAM is fine for basic use — light on room for multiple heavy tools open at once.`);
  }
  if (facts.isLaptop && (facts.batteryCondition === "poor" || facts.batteryCondition === "unknown")) {
    verifyItems.push("Battery condition is poor or unconfirmed. It won't block a Linux install, but plan to run on wall power until you've checked real battery life.");
  }
  if (!facts.hasWifi) {
    verifyItems.push("No confirmed working Wi-Fi. Linux Mint's Wi-Fi driver support varies by chipset — test it from a Live USB boot before wiping anything, or plan on a wired connection.");
  }
  if (facts.usbPorts < 1) {
    blockers.push("No usable USB port found. You need at least one working USB port to boot the installer media.");
  }

  if (facts.hasImportantFiles) {
    notes.push("Important files are still on this machine — the backup checklist below is required before any wipe or install step.");
  }
  if (!facts.hasCameraMic) {
    notes.push("No camera/microphone, or unconfirmed — not required for a Build Machine, just noted for your own reference.");
  }

  let status: CandidateStatus;
  if (blockers.length > 0) status = "not-recommended";
  else if (verifyItems.length >= 2) status = "needs-upgrade";
  else if (verifyItems.length === 1) status = "likely";
  else status = "good";

  return { status, statusLabel: STATUS_LABEL[status], blockers, verifyItems, notes };
}

export const BACKUP_PREP_ITEMS = [
  "Important files are backed up somewhere other than this machine (cloud, external drive, or another computer).",
  "I've confirmed this is the correct computer — not one someone else still needs.",
  "Any account recovery information (passwords, 2FA backup codes, license keys) I need from this machine is saved elsewhere.",
  "The machine is connected to power, not running on battery alone.",
  "Installation media (a Linux Mint 22 USB installer) is prepared and ready.",
  "I understand the drive I select during install may be fully erased, and there is no undo once that step starts.",
];

export const INSTALL_CHECKLIST_ITEMS = [
  "Boot from the USB installer (not the internal drive).",
  "Select the correct drive — double-check the size/label against this exact machine.",
  "Choose Linux Mint 22 (Cinnamon or Xfce) and complete the guided install.",
  "Complete first boot into the new Linux Mint desktop.",
];

export const POST_INSTALL_VERIFY_ITEMS = [
  "The machine boots directly into the Linux Mint desktop.",
  "Wi-Fi connects to a real network.",
  "Sound plays from the speakers or headphones.",
  "A USB drive is recognized when plugged in.",
  "A web browser opens and loads a page.",
  "A terminal opens and accepts commands.",
  "VS Code, Node, and Git are installed and open without errors (from setup-dev-machine.sh, or installed manually).",
];

export type ChecklistState = Record<number, boolean>;

export function allChecked(items: string[], state: ChecklistState): boolean {
  return items.every((_, i) => !!state[i]);
}

export type BuildMachineRecord = {
  id: string;
  facts: CandidateFacts | null;
  assessment: CandidateAssessment | null;
  prepState: ChecklistState;
  installState: ChecklistState;
  verifyState: ChecklistState;
  firstBuildDone: boolean;
  createdAt: string;
  updatedAt: string;
};

export function generateCompletionReport(record: BuildMachineRecord): string {
  const a = record.assessment;
  const prepDone = allChecked(BACKUP_PREP_ITEMS, record.prepState);
  const installDone = allChecked(INSTALL_CHECKLIST_ITEMS, record.installState);
  const verifyDone = allChecked(POST_INSTALL_VERIFY_ITEMS, record.verifyState);
  return `BUILD MACHINE COMPLETION REPORT

Machine: ${record.facts?.manufacturerModel || "(not recorded)"}
Assessed: ${a ? a.statusLabel : "Not yet assessed"}
${a && a.blockers.length ? `Blockers noted at assessment:\n${a.blockers.map((b) => `- ${b}`).join("\n")}\n` : ""}${a && a.verifyItems.length ? `Items to verify:\n${a.verifyItems.map((v) => `- ${v}`).join("\n")}\n` : ""}
BACKUP & PREPARATION
${prepDone ? "Complete — all required items confirmed." : "Not complete — required before wipe/install."}

INSTALLATION (Linux Mint 22, Cinnamon/Xfce on Ubuntu 24.04)
${installDone ? "Complete." : "Not complete."}

POST-INSTALL VERIFICATION
${verifyDone ? "Complete — all checks passed." : "Not complete."}

FIRST BUILD EXERCISE
${record.firstBuildDone ? "Complete — a first idea was shaped in Step In The Ring." : "Not yet done."}

Report generated: ${new Date().toISOString()}
`;
}
