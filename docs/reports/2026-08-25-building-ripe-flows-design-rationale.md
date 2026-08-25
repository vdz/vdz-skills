# building-ripe-flows — Design Rationale

*For the human reviewer. Not a skill file — this records what was drafted, the decisions behind it, exact cross-references, and open questions. Delete before shipping the skill (or move to the repo's design-docs folder).*

## What was drafted

A navigator-shaped `SKILL.md` plus six scenario-based reference files:

| File | Purpose |
|---|---|
| `SKILL.md` | Navigator: 6 cardinal rules, the mental model, the eight-actions table, the file layout, the two-altitudes callout, Common Tasks, the sibling-skill map, the workflow checklist, the References table. |
| `creating-a-flow.md` | End-to-end walkthrough (Step 0 human decision → definition → utils → brain → optional R2 → components → wiring), linear-vs-branching, and the renovation loop. |
| `the-brain-listener.md` | The deepest file: the brain's anatomy, the `switch(currentStep)` pattern, guards-as-`return undefined`, the two advance triggers, async intake on entry, retry-is-re-entry, sub-flow resume, conclude/cancel, the inert-vs-disruptive guard rule, the re-entry-is-replay contract. |
| `flow-state-model.md` | R1/R2 boundary test, "most flows have no reducer", the R2 amendment (owned atom), one-way projection, the simplicity gate. |
| `gates-and-preflight.md` | Whole file marked `[contract-only]`: gates-as-steps, the `runGate` contract, gate ≠ verdict, owner-altitude placement, what was rejected. |
| `flow-components.md` | Host-is-composition, self-gating steps, step-as-`(data)→screen`, StepProps, the mount-once contract + the headline bug, the two-piece conductor, sub-flows. |
| `flow-tests.md` | The behavioural store test, the `settle()` loop, the capability matrix, re-entry coverage, sub-flow-via-`flowDone`, pure-util tests. |

Every code example is transcribed from real files in `~/Dev/ripe-flows` (branch `feat/device-doctor-flow`), not fabricated. Contract-only patterns (from `@mcesystems/dtl` and VFUK) are shown as shape sketches and marked `[contract-only]`.

## Key design decisions

**1. Navigator SKILL + 6 refs, matching the store/tests skills exactly.** `SKILL.md` opens with Cardinal Rules (6, like building-ripe-store's 6), then routing tables and a workflow checklist. Each ref opens with "When to read this" + "Contents", per house style. The six refs are the smallest set that covers the model without splitting a concept across files or padding — they match the set the task proposed. I considered merging (e.g. folding gates into the brain, or tests into a general note) and rejected each: gates are a self-contained contract-only topic that would blur the demonstrated/contract line if folded; the view-layer mount-once bug is a component concern distinct from the listener brain; flow-tests can't live in `building-ripe-tests` (separate skill) but the flow-specific patterns need a home.

**2. The two-altitudes problem is treated as first-class.** The single biggest risk flagged in research: `ripe-flows` demonstrates the core (engine + brain + R2-as-report + sub-flow) but has *no* gates, owned atoms, projection, `useTestLifecycle`, or engine-level default-advance listener — those are proven only in `@mcesystems/dtl` and VFUK. A reader who greps `ripe-flows` for `runGate` finds nothing. The skill handles this with (a) an explicit "Two Altitudes" table in `SKILL.md`, and (b) an inline `[contract-only]` marker on every section (or whole file, for gates) that isn't demonstrated in-repo. This lets the skill teach the authoritative model while never lying about where the code lives.

**3. Teach the code's shape, not the docs' wording (seed drift).** ADR-0001/design-HTML/CONTEXT reference a `seedFlows` helper + `preloadedState`; the actual engine seeds via `createFlowsReducer(definitions)` inline and `flows.helpers.ts` holds only `nextStep`/`prevStep`. The skill teaches the code and calls the drift out once in `SKILL.md`.

**4. Linear-advance divergence taught explicitly.** Canonical ships no engine listener; each feature writes its own six-line linear brain (`cleanup.listener.ts`). Production DTL adds an engine-level `flows.listener.ts` mapping `flowNext` → linear advance. The skill teaches the six-line brain as the baseline and presents the engine-level listener as a `[contract-only]` DRY improvement — so a reader cross-referencing canonical isn't surprised by its absence.

**5. Renovation folded into `creating-a-flow.md`, not its own file.** VFUK's Stage-1 behaviour-preserving loop is a discipline *around* building a flow, not a separate model. It lives as a section (config-divorced-in-code is the anchoring ADR) and is surfaced in Common Tasks. Kept the file count at 6 per the "don't pad" instruction. (Open question below on whether it deserves promotion.)

**6. Concepts that relate but are distinct are split, each with a one-line cross-ref.** One-way projection has a *state-shape* half (what mirrors where, one-way rule → `flow-state-model.md`) and a *listener-guard* half (inert-vs-disruptive, where to put the guard → `the-brain-listener.md`). Re-entry-is-replay is stated as a cardinal rule and covered in the brain (listener form, idempotent by construction), while the component-latch form + the headline bug lives in `flow-components.md` (a lifecycle concern). Each site cross-references the other so there's a single source of truth per concept.

## Included / excluded

**Included:** the engine/brain split; the eight actions; step-as-milestone; R1/R2 + the R2 amendment; re-entry-is-replay; the mount-once bug; self-gating steps + FlowHost; gates-as-steps + preflight (contract-only); the simplicity gate; sub-flow-as-composition; the behavioural test + settle loop + re-entry coverage; the renovation loop; the inert-vs-disruptive guard rule; the two advance triggers.

**Excluded, deliberately:**
- **The NavigationAdapter (ADR-0002).** Designed but unbuilt; the ADR warns against building it prematurely. The skill teaches only today's reality (route-start via `setLocation`, internal moves via `flowNext`/`flowSetCurrent`, no per-step URL) and notes the adapter as deferred, pointing at `building-ripe-routing`.
- **The mce-blueprint visual authoring model** (two-altitude plan graph, 9 block kinds, ports). It's a *design-first* representation of the same flow and can drift from code (ADR-0003 says a visualizer must read the brain because there's no transition table). Teaching it as if it generated the code would mislead. Left out; flagged as an open question.
- **`clearFlow` / teardown / persistence.** Deferred in the design; terminal instances are never pruned. Not taught as a feature; could be a one-line "known gap" if the reviewer wants it.
- **The X-Ray recorder, iOS motion dance, and other dev-harness concerns** layered on flows in DTL/VFUK — out of scope, not flow patterns.
- **The backend/GraphQL trade-in contracts** — cross-tenant plumbing, unchanged by the renovation, not the flow.

## Cross-references (exact)

All sibling links use `../<skill>/...`, valid once `building-ripe-flows/` sits alongside the others in `ripe-skills/skills/`. Anchors verified against the current heading text of each target file.

| From | To | Anchor |
|---|---|---|
| SKILL.md, the-brain-listener.md | `building-ripe-store/SKILL.md` | `#cardinal-rules` |
| SKILL.md, creating-a-flow.md | `building-ripe-store/creating-a-branch.md` | `#step-0-state-composition-is-a-human-decision` |
| the-brain-listener.md, flow-components.md | `building-ripe-store/listeners.md` | `#service-modules--exempt-from-all-logic-in-listeners` |
| SKILL.md, flow-components.md | `building-ripe-components/SKILL.md` | — |
| flow-tests.md | `building-ripe-tests/SKILL.md` | `#the-harness` |
| flow-tests.md | `building-ripe-tests/listener-tests.md` | `#pipeline-tests-crossing-branches` |
| SKILL.md | `building-ripe-routing` | (prose only — deferred adapter) |
| SKILL.md | `ripe-init` | (prose — engine not in base scaffold today) |
| SKILL.md | `ripe-audit` | (prose — no new audit rules) |
| SKILL.md | `show-me-your-work`, and creating-a-flow.md | (prose — renovation decision trail) |

**Reviewer action:** two cross-references assert facts worth confirming — (a) that the flow engine is *not* part of `ripe-init`'s base scaffold today (verified: `ripe-init` scaffolds store root + app/router branches, no `store/flows/`), and (b) that `ripe-audit` needs no new flow-specific checks. If flows become common, `ripe-audit` may want a `checklists/flows.md` (e.g. "engine unedited", "flowSetCurrent is sole currentStep writer", "entry effects idempotent", "no decision in reducer/component"). Flagged below.

## Open questions for the reviewer

1. **How much contract-only to teach, and how.** The skill teaches gates / owned atoms / projection / `useTestLifecycle` as prose contract with shape sketches, marked `[contract-only]`, sourced from `@mcesystems/dtl` and VFUK (neither was in the primary `ripe-flows` research scope for full code reads). Options if this feels too thin: (a) ship a minimal runnable gate example in the skill; (b) reference the DTL repo paths directly; (c) keep prose-only. Current choice is (c) + repo path citations. Confirm this is the right depth, and whether DTL should be a named dependency the skill points at.

2. **Is `feat/device-doctor-flow`'s per-step-file shape the intended final scaffold?** The skill scaffolds named per-step component files (`TriageStep.tsx`, `BatteryStep.tsx`, …), matching the working-tree WIP and the ADR-0001 amendment (named step components, no generic step). This reads as intended, but it's WIP — confirm before codifying.

3. **Should renovation be promoted to its own file?** Currently a section in `creating-a-flow.md`. It's a rich, distinct discipline (reverse-engineer → behaviour map → transcribe → parity-verify, reproduce quirks on purpose) proven by a real renovation. Promote to `renovating-a-flow.md` if the audience does renovations often; keep folded if new-build is the common case. I kept it folded per "smallest set / don't pad".

4. **"Two flows, no more" — law or scoping choice?** Framed in the skill (flow-components.md scope note) as a *test-bed scoping choice*, not an engine limit — the engine is `flowId`-keyed and could run more. The task phrasing ("two-flows-no-more") risks overstating a scope decision as a law; I deliberately softened it. Confirm that's right.

5. **The NavigationAdapter and per-step URL — teach or omit?** Omitted (see Excluded). The ADR warns against premature building. But VFUK *does* project flow state to hierarchical URLs (`/eligibility/<step>`, popstate→`flowBack`). Should the skill teach URL-as-projection as a `[contract-only]` pattern (it's real in VFUK), or stay silent to avoid readers building the deferred adapter? Currently silent + a pointer to `building-ripe-routing`.

6. **Should `ripe-audit` gain a `checklists/flows.md`?** No new audit rules are claimed today. If flows proliferate, the audit could check: engine unedited, `flowSetCurrent` sole writer, entry effects idempotent, no decision in reducer/component, `status` (not `currentStep`) used to detect done. Out of scope for this skill, but worth a decision.

7. **The mce-blueprint visual model — connect it or ignore it?** Excluded (drift risk). If the team authors flows visually first, the skill might need a short "the blueprint is a design aid, not a generated view" note. Currently absent.

8. **`clearFlow` / persistence known-gap note?** Not mentioned. Add a one-liner in `flow-state-model.md` if the reviewer wants readers warned that terminal instances aren't pruned and there's no persistence (both deferred; the layered-on-top answer would be a thin interpreter, never a core retrofit).

---

## Grill-session outcomes (2026-08-24/25) — ALL open questions resolved with the owner

Ground truth was re-verified by three deep-read agents (canonical `ripe-flows`, `@mcesystems/dtl`, VFUK trade-in branch) before the interview. Decisions, as applied:

1. **Extensibility is first-class** (was Q1). The engine-drives + feature-extends model got promoted; `[contract-only]` redefined as a *provenance tag*, never a "secondary" signal (SKILL.md two-altitudes intro).
2. **One coupling rule, three state shapes** (new section in flow-state-model.md): a feature couples to a flow only through actions + selectors; *where its state lives is the engineer's decision* — A owned-branch + one-way MIRROR-OUT (DTL diagnostics), B no-branch verdicts-in-the-engine-bag (VFUK eligibility, the default), C owned-branch that pulls flow intake via public selectors (VFUK tradein). "One-way always" was corrected to a shape-A property.
3. **Cardinal Rule #1 reworded**: engine deliberately thin, feature listeners drive, engine-level linear-advance default is legitimate for trivial cases but *engine listeners must stay simple — resist the pressure for them to become the drivers* (owner's phrasing). Ground truth: DTL has `flows.listener.ts:11-22`; VFUK has composable brain factories; canonical has none.
4. **"Two flows, no more" dropped everywhere** (was Q4) — it only described the demo; engine is flowId-keyed.
5. **Teardown/persistence one-liner stays** (was Q8).
6. **The WIP scaffold codified** (was Q2): per-step component files composed declaratively — "they still sit together as parts of one flow" (owner). The WIP was committed in `ripe-flows` @ b556121 so the skill cites committed code.
7. **Renovation promoted to `renovating-a-flow.md`** (was Q3), enriched with VFUK citations (resolveEligibilitySteps, shouldRunStep single inversion, three skip-verdict shapes incl. 2026-07-19 "skip means fail" ruling, passOnUnknown, in-flight lock + re-check triad).
8. **URL-per-step is the DEFAULT** (was Q5, upgraded): every screen/step/logical location gets its own URL; one pure state→URL format; URL = one-way projection; popstate → flow intents. New section in flow-components.md; generic NavigationAdapter still unbuilt by design.
9. **Contract-only depth = prose + exact `file:line` citations** (was Q1-depth); DTL not a named dependency.
10. **ripe-audit `checklists/flows.md` spun off as a separate follow-up task** (was Q6); **blueprint** gets a one-line "design aid, not a generated view" note in SKILL.md, no chapter (was Q7).
11. **NEW owner directive — declared over generated**: `createFlowsReducer(...)` is a stopgap; the intended end-state is an explicitly declared flows reducer (a generating function obfuscates declarative logic). Noted in SKILL.md + creating-a-flow.md Step 6; saved to agent memory.
12. **Two factual corrections landed during verification**: `initialData` is NOT re-applied on `flowStart` replay (canonical clears `data={}`; VFUK's fork re-seeds — flagged as engine divergence in renovating-a-flow.md); the M1 "every effect guards isMine" overgeneralization was fixed earlier.
