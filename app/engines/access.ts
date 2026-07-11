// Engine Room access — courtesy gate, not a security boundary.
//
// How it works:
// 1. A visitor without access lands on the gate screen and requests access
//    by email (ask@openmirrorllc.com).
// 2. DJ replies with an access code from the list below.
// 3. The visitor enters the code once; it is stored in localStorage on their
//    device and checked client-side.
//
// To grant access: share any code below by email reply.
// To revoke a code: remove it here and push (deploys automatically).
// These codes ship in the client bundle — do not put secrets here.

export const ACCESS_CODES = [
  "RINGSIDE-2026",
];

const STORAGE_KEY = "sitr-engine-access-v1";

export function hasAccess(): boolean {
  if (typeof window === "undefined") return false;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return !!stored && ACCESS_CODES.includes(stored);
}

export function grantAccess(code: string): boolean {
  const clean = code.trim().toUpperCase();
  if (!ACCESS_CODES.includes(clean)) return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, clean);
  } catch {
    return false;
  }
  return true;
}

export function revokeAccess(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
