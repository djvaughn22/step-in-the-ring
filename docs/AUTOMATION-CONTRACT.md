# Automation contract — how agents and tools work a project

This is the contract for anything automated (Claude, a script, a future
service) that touches a project record (`app/project/model.ts`). It exists so
automation stays **supervised roles with narrow permissions and visible
outputs** — never an uncontrolled swarm.

Two rules above every role:

1. **The owner owns intent, scope approval, taste, consequential risk, and
   release.** Automation owns repeatable mechanical work.
2. **No role silently crosses an approval gate** (`GateId` in the model).
   A role that needs a gate stops, records the exact blocker and the smallest
   owner action, and continues with unrelated safe work.

Every role reads and writes the same canonical record. Nothing rides in side
channels: if a role learned it, it lands in the record (report, evidence,
decisions, outputs) where the workspace can show it.

---

## Interpreter

| | |
| --- | --- |
| **Allowed inputs** | The creation record: the person's exact words, answers, facts, exclusions, constraints. Nothing external. |
| **Required outputs** | The labelled `InterpretationReport` (USER SAID / interpreted-with-basis / assumed / missing / recommended / version one / deferred) and at most one material clarifying question. |
| **May do automatically** | Re-interpret while the scope is unapproved. Fold in new answers. |
| **Needs approval** | Nothing — but its output is worthless until the owner reads it, so it always hands to the owner. |
| **Evidence it produces** | None. Interpretation is not proof of anything. |
| **Must stop when** | The scope is approved (the brief is frozen); or input asks for something unsafe (it labels it, never launders it). |
| **On failure** | Produce the smallest honest report ("unknown" bins filled) rather than an invented one. |
| **Handoff** | The project record at `scope-awaiting-approval`, one next action set. |

## Planner

| | |
| --- | --- |
| **Allowed inputs** | The interpretation report and the adapter contract (`EngineAdapterContract`). |
| **Required outputs** | The `ProjectBrief`: version-one scope, non-goals, deferrals, journey, acceptance criteria, test + deployment checklists, builder instructions. |
| **May do automatically** | Regenerate the brief while unapproved; pick the adapter (`app-engine`, `generic`, future engines). |
| **Needs approval** | Scope approval is the whole point — it never grants itself. |
| **Evidence it produces** | None. A plan proves nothing. |
| **Must stop when** | The scope is approved; or the brief would require an ungranted gate (paid service, integration, other repo). |
| **On failure** | Leave software-only sections empty rather than force wrong vocabulary. |
| **Handoff** | The frozen brief inside the record, plus the owner summary. |

## Builder

| | |
| --- | --- |
| **Allowed inputs** | ONLY the generated builder assignment (`builderAssignment()` — which does not exist until the scope-approval gate is granted). |
| **Required outputs** | Working code inside the assignment's repository boundary, plus a final report in the assignment's exact format: built / assumed / not built / checks run with real results / proven-vs-mocked-vs-manual / tree state / one next action. |
| **May do automatically** | Write code, run local checks, commit **if the assignment grants it**. |
| **Needs approval** | Everything on the risk-gate list: destructive actions, spending, credentials, publishing, production data, external integrations, other repositories, anything with legal/financial/employer exposure. Push and deploy only if the assignment explicitly grants them. |
| **Evidence it produces** | One entry per acceptance criterion: what ran, where, pass or fail. Mocked things marked MOCKED. |
| **Must stop when** | A risk gate blocks it; the scope is exceeded ("if a non-goal looks necessary, stop and say why"); unrelated dirty work would be touched. |
| **On failure** | Report the failing check verbatim; move the project to `build-failed`; never round a failure up to a pass. |
| **Handoff** | Evidence entries + final report; project at `checks-running` or `prototype-working`. |

## Tester

| | |
| --- | --- |
| **Allowed inputs** | The test assignment (`testAssignment()`) and the running artifact. Never the builder's opinions. |
| **Required outputs** | One evidence entry per claim tested: claim, what ran, environment, result, safe summary. |
| **May do automatically** | Run tests, drive flows locally/preview, corrupt saved data on purpose, reload-and-check persistence. |
| **Needs approval** | Any test that would touch production data, spend money, or exercise a real external account. |
| **Evidence it produces** | The ledger entries themselves — the tester's whole job is the ledger. |
| **Must stop when** | A check can't actually run (record `blocked`, not `pass`). |
| **On failure** | A failing check is a finding, recorded exactly; never re-run until green and report only the green. |
| **Handoff** | The updated ledger; claim levels move only as far as the evidence carries them. |

## Reviewer

| | |
| --- | --- |
| **Allowed inputs** | The diff, the approved scope, the ledger. |
| **Required outputs** | Findings tied to scope lines or acceptance criteria; a recommendation (proceed / fix / narrow), recorded as a system decision. |
| **May do automatically** | Read everything in the repository boundary; compare claim levels to what the UI or report asserts. |
| **Needs approval** | Nothing it does needs a gate — but its recommendation never executes itself. |
| **Evidence it produces** | Review findings as `manual-check` entries when it verified something directly. |
| **Must stop when** | The diff reaches outside the repository boundary — that is a cross-repository gate, full stop. |
| **On failure** | "I could not verify X" is a valid finding; silence is not. |
| **Handoff** | Decision entry + recommendation; owner decides. |

## Release verifier

| | |
| --- | --- |
| **Allowed inputs** | The production URL and the deployment checklist. Runs only when a deployment is known to be current. |
| **Required outputs** | A `production-check` evidence entry per verified claim — the ONLY thing that can unlock `verified-live`. |
| **May do automatically** | Load production, inspect responses, compare against acceptance criteria. |
| **Needs approval** | The deploy itself is the owner's; the verifier never deploys, never retries a deploy, never polls unbounded. |
| **Evidence it produces** | Production checks, pass or fail, timestamped with environment `production`. |
| **Must stop when** | The deployment's currency is uncertain (verifying a stale deploy proves nothing) — record `blocked`. |
| **On failure** | A failing production check moves the project back to `deployment-pending` or `build-failed`, and says which. |
| **Handoff** | Ledger entries; if all pass, the owner (or the workspace on their action) advances to `verified-live` — the transition itself re-checks the evidence. |

---

## The manager's questions

The record is built so an owner can ask, and the system can answer from data:

- What specifically creates this estimate? → the brief's scope lines, each grounded.
- Which part is implementation vs integration vs review vs uncertainty? → scope vs integrations vs decisions vs the assumed/missing bins.
- What is proven? What is only mocked? → the claim ladder over the ledger.
- What is the smallest test that resolves the uncertainty? → the test checklist + `nonSoftwareTest` recommendations.
- What evidence supports the blocker? → the blocker field next to the ledger.
- What does the developer still own after AI wrote the first draft? → everything in this table's "Needs approval" and "Must stop when" rows.

This system makes engineering work, assumptions, ownership, and evidence
visible. It does not replace the people doing it.
