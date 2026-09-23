// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY OPEN-UAT MODE — read this before touching anything else in the
// Digital Front Desk feature.
//
// While DFD_OPEN_UAT_MODE is true, every owner-only Digital Front Desk
// surface (the desk, onboarding, admin — pages AND their API routes) is
// reachable with NO owner session, for as long as this early UAT period
// runs. This is a deliberate, reviewed product decision for right now — an
// easy walkthrough while the product is being shown around — NOT a
// permanent removal of the owner gate.
//
// What this does NOT change:
//   - DIGITAL_FRONT_DESK_UAT_ENABLED is still the master kill switch. With
//     it off, every DFD route 404s regardless of this constant.
//   - isOwnerAuthed() / isOwnerRequest() (app/owner/session.ts) and
//     dfdOwnerGate() (./apiGate.ts) are all still here, still correct, and
//     still called — this constant only short-circuits them, it does not
//     delete or bypass their implementation.
//   - Every other private room in this repo (/owner, /author, /projects,
//     /engines/room) is completely unaffected. This constant is scoped to
//     Digital Front Desk only.
//
// While this is true, and ONLY while it's true:
//   - Anyone who finds the URL can read, assign, change the status of,
//     and add notes to every request in the demo store — there is no
//     customer-privacy boundary between different visitors' requests.
//   - Anyone who finds the URL can seed, export, or wipe the entire demo
//     store from Admin.
//   - Real customers should still only be putting SAMPLE data in the
//     intake form (the form and confirmation page both say so), but
//     nothing here enforces that.
// This is an accepted, reviewed trade-off for an early open UAT period —
// see docs/DIGITAL_FRONT_DESK_UAT.md's "Open UAT mode" section — not an
// oversight.
//
// TO RESTORE THE OWNER GATE: flip this single constant to `false` and
// redeploy. That is the ONE controlled change — no other file needs to
// change. (The registry rows for desk/onboarding/admin also key off this
// constant, so their public `access` label flips back to "owner"
// automatically in the same change.)
export const DFD_OPEN_UAT_MODE = true;
