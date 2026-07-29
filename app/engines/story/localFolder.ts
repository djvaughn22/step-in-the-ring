// Local writing folder — File System Access API, where the browser supports
// it (Chromium browsers today; feature-detected, never assumed).
//
// The owner deliberately picks a folder; backups are then written into a
// "Backups" subfolder with versioned names, never overwriting an existing
// file. Honest limits: the folder permission lasts for this page session —
// after a reload the browser requires choosing (or re-approving) the folder
// again. Unsupported browsers fall back to ordinary downloads.

interface DirHandle {
  name: string;
  getDirectoryHandle(name: string, opts?: { create?: boolean }): Promise<DirHandle>;
  getFileHandle(name: string, opts?: { create?: boolean }): Promise<FileHandle>;
}

interface FileHandle {
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
}

type PickerWindow = Window & { showDirectoryPicker?: (opts?: { mode?: string }) => Promise<DirHandle> };

let chosen: DirHandle | null = null;

export function folderSupported(): boolean {
  return typeof window !== "undefined" && typeof (window as PickerWindow).showDirectoryPicker === "function";
}

export function folderName(): string | null {
  return chosen?.name ?? null;
}

/** Opens the browser's own folder picker — the user chooses, or cancels. */
export async function chooseFolder(): Promise<string | null> {
  if (!folderSupported()) return null;
  try {
    chosen = (await (window as PickerWindow).showDirectoryPicker!({ mode: "readwrite" })) ?? null;
    return chosen?.name ?? null;
  } catch {
    return null; // cancelled or denied
  }
}

async function fileExists(dir: DirHandle, name: string): Promise<boolean> {
  try {
    await dir.getFileHandle(name);
    return true;
  } catch {
    return false;
  }
}

/**
 * Write into <folder>/Backups/. Never overwrites: an existing name gets a
 * -2, -3… suffix. Returns the final filename, or null on failure.
 */
export async function writeBackupFile(filename: string, contents: string): Promise<string | null> {
  if (!chosen) return null;
  try {
    const backups = await chosen.getDirectoryHandle("Backups", { create: true });
    const dot = filename.lastIndexOf(".");
    const stem = dot > 0 ? filename.slice(0, dot) : filename;
    const ext = dot > 0 ? filename.slice(dot) : "";
    let candidate = filename;
    for (let n = 2; await fileExists(backups, candidate); n++) {
      candidate = `${stem}-${n}${ext}`;
      if (n > 500) return null;
    }
    const handle = await backups.getFileHandle(candidate, { create: true });
    const writable = await handle.createWritable();
    await writable.write(contents);
    await writable.close();
    return candidate;
  } catch {
    return null;
  }
}
