<!-- Policy document. Codified 2026-08-19 from mattpocock-skills v1.2.3 local docs + aihero.dev + the Aug 14 2026 video (x.com/mattpocockuk/status/2088290952704151671). Referenced from ~/.claude/CLAUDE.md. -->

# Pocock workflow — codified (mattpocock-skills v1.2.x)

Agent-facing. Codifies the four main paths, the on-ramps, and the routing rules. Source of truth for mechanics: the local plugin docs (`~/.claude/plugins/cache/mattpocock/mattpocock-skills/`); aihero.dev and the Aug 14 2026 video match on emphasis and ordering.

## Invocation contract

- **Slash-only skills** (`grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `wayfinder`, `triage`, `handoff`, `grill-me`, `ask-matt`, `setup-matt-pocock-skills`, `improve-codebase-architecture`, `wait-what`, `to-questionnaire`, `teach`): the user types them. Never auto-invoke. When one clearly fits, say so in one line and wait.
- **Model-invocable skills** (`grilling`, `domain-modeling`, `tdd`, `codebase-design`, `code-review`, `diagnosing-bugs`, `research`, `prototype`, `resolving-merge-conflicts`, `wizard`, `writing-for-agents`): invoke when the situation calls for it. These hold the reusable discipline; slash skills orchestrate them. A user-invoked skill may call model-invoked skills, never another user-invoked one.
- Precondition once per repo: `/setup-matt-pocock-skills` (tracker choice, triage label strings, domain-doc layout → `docs/agents/*.md`).

## Routing (first question: session count, not project size)

| Situation | Route |
|---|---|
| Idea, fits one session | **Path A**: `/grill-with-docs` → `/implement` in the same context |
| Idea, build needs multiple sessions | **Path B**: `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement` per ticket |
| Even the plan won't fit one session / route foggy | **Path C**: `/wayfinder` → (map clears) → `/to-spec #<map_issue>` → Path B tail |
| No working directory | `/grill-me` instead of `/grill-with-docs` |
| Design question needing runnable code | `prototype` detour: `/handoff` out → prototype on `prototype/<name>` branch → `/handoff` back |
| Issues that arrived from other people | `/triage` (never for self-created tickets); merges into flow at `ready-for-agent` → `/implement` |
| Hard bug / perf regression | `diagnosing-bugs` (Phase 1 = build a red-capable feedback loop; that IS the skill) |
| Architecture drift, every few days | `/improve-codebase-architecture` (HTML report; survey, not rescue) |
| Merge conflict | `resolving-merge-conflicts` (by intent, hunk by hunk, never `--abort`) |
| Unsure | `/ask-matt` — recommends and stops |

## Path A — single-session feature

1. `/grill-with-docs`: interview to shared understanding. Terms → `CONTEXT.md` inline as they resolve (glossary and nothing else). ADR only if **all three**: hard to reverse + surprising + real trade-off. Zero ADRs is a valid outcome.
2. Same context window: `/implement`. Execution only — no interview, no clarifying round, no alternative proposals. Drives `tdd` at pre-agreed seams (no test at an unconfirmed seam; refactoring belongs to review, not the loop). Typecheck + individual test files throughout; full suite once near the end.
3. Closes with `code-review`: two parallel sub-agents — **Standards** (repo conventions + fixed 12 Fowler smells; every finding cites a rule or named smell) and **Spec** (fidelity to originating plan; skips entirely when no spec exists). Axes never merged or re-ranked. Then one commit.

## Path B — multi-session build

1. `/grill-with-docs` as above.
2. `/to-spec` — **same unbroken context**, no re-interviewing: "a record of decisions already made, not a place where new ones get made." Sketches testing seams first and confirms them (ideal seam count: one). Publishes one tracker issue, `ready-for-agent` label.
3. `/to-tickets` — **still same context** (avoids refetching). Tracer-bullet tickets: vertical slices through schema/API/UI/tests, each independently demonstrable, each sized to one fresh context window, blocking edges declared, blockers published first. Wide refactors → expand–contract instead. User approves granularity. **No auto-dispatch.**
4. `/implement` per ticket, one ticket per fresh session, `/clear` between. Never parallel implements in one checkout. **Known gap: implement ends at the commit and never closes the ticket — close it manually or downstream tickets never visibly unblock.**

## Path C — wayfinder (multi-session planning; plans, never does)

- Chart: name the Destination via grilling; map fog breadth-first (no fog → stop, use Path B). Map issue labeled `wayfinder:map` (Destination / Decisions so far / fog / Out of scope) + decision tickets typed `research` (AFK subagent), `prototype` (HITL), `grilling` (HITL, default), `task` (manual).
- Work: one frontier ticket (open + unblocked + unclaimed; assignee = claim) per session, research tickets excepted. Resolve → comment → close → one-line gist to Decisions-so-far.
- Exit: map clears → `/to-spec #<map_issue>` → `/to-tickets` → Path B tail. Wayfinder produces no spec and no implementation tickets itself.

## Path D — phase boundaries (ordered; apply at every phase boundary or near ~150k tokens)

1. **Continue** — only if next phase needs current context verbatim (only move preserving a primary source).
2. **`/clear`** — everything behind is disposable (e.g. between implement tickets).
3. **`/handoff`** — only when work must travel; exactly four triggers: new harness, new directory/repo, colleague, mid-phase fork. Output: one markdown in OS temp dir (never workspace), suggested-skills section, artifacts referenced by path never copied, secrets redacted. Review and downgrade unverified assumptions before handing off. Portability, not compression.
4. **Subagent** — tightly scoped, unattended tasks.
5. **`/compact`** — the default: same harness, same directory, phase done. Compact at boundaries, not mid-phase.

**Hard rule:** never `/clear`/`/compact` between grill-with-docs, to-spec, and to-tickets — one unbroken context.

## Ripe intersection (personal wiring — the public skills stay Pocock-blind)

On a Ripe-architecture repo (ripe-skills family installed):

- `/grill-with-docs` on a Ripe feature **subsumes Step 0** of `creating-a-branch.md` — its output IS the state composition. `/implement` must not re-run Step 0 as an interview; Step 0 becomes a read of the grill's decisions.
- A tracer-bullet ticket = one Ripe vertical slice, ordered by `building-ripe-store` → The Feature Loop (state → actions → reducer cases → listeners → api → wiring → routes → components → selectors → tests).
- `/to-spec`'s "sketch testing seams" = pick among Ripe's fixed seams (reducer / listener-harness / selector / component behaviour, per `building-ripe-tests`); the listener/harness seam is the usual single seam.
- `code-review`'s **Standards** sub-agent on a Ripe repo: run `ripe-audit` (or feed it the audit checklists) instead of generic smells alone. The **Spec** axis stays Pocock's.
- `diagnosing-bugs` Phase 1 on a Ripe repo = a failing `makeTestHarness` test.
- Handoffs stay in the OS temp dir (the skill default); `ripe-overview`'s `docs/handoffs/` lane is knowingly empty on these repos — revisit if that starts to hurt (decision 2026-08-26).

## Known gaps (from the author's own docs)

- `implement` never closes tickets (see Path B step 4).
- `/ask-matt` falsely reports slash-only skills as "not installed" (harness omits them from the injected list).
- `grill-with-docs` file-writing silently fails inside another orchestration wrapper — run it directly.
- Dead names, never use: `/to-prd`→`to-spec`, `/to-issues`→`to-tickets`, `/diagnose`→`diagnosing-bugs`, `/zoom-out`→`improve-codebase-architecture`, `/ubiquitous-language`→`grill-with-docs`+`domain-modeling`.

## Vocabulary (plugin CONTEXT.md canon)

"Issue tracker" (never backlog) · "Issue" (never ticket, except **decision ticket** = a wayfinder child issue holding a question) · "Triage role" = canonical label mapped via `docs/agents/triage-labels.md`.