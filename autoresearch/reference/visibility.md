# Visibility — seeing into a running loop

**When to read this:** when starting a loop (to set up the logs + notifications), on a
`/autoresearch status` check-in, and whenever the human asks "what's it doing?"

An unattended loop is only useful if the human can see into it. Visibility splits into
**pull** (surfaces the human checks) and **push** (events that pull the human back).

## Pull — surfaces, by altitude

- **`state.json`** — machine glance: round #, best, plateau counter, status, branch. The
  single source of truth. (See [workspace.md](workspace.md).)
- **`results.md`** — human narrative: round-by-round hypothesis → before/after →
  kept/reverted. `tail -f` it.
- **Win trail — `git log --oneline`** on the autoresearch branch. Only kept rounds commit,
  so the commit history *is* the noise-free ledger of real improvements. Each commit message
  is the winning hypothesis + score delta. Free; falls out of the design.
- **`/workflows` progress tree** — live, when a round escalates (parallel proposals or the
  judge panel). Watch the fan-out in real time.
- **`/autoresearch status`** — pull-only check-in: read `state.json` + `results.md`, print a
  clean summary and a score sparkline, **without running a round**.

## Push — notifications

Use the harness notifier. Notify on **all four** of these (everything else stays pull-only):

- 🎯 **Target reached** — hit the goal, self-cancelled.
- 🛑 **Plateau / stopped** — K rounds no improvement; ended on its own.
- ⚠️ **Refused / errored** — failed a gate, lost write access, scorer broke. *Silence here is
  the dangerous failure mode — the human must learn a dead loop is dead.*
- 🌟 **New best** — every round that beats the baseline (heartbeat that progress is real).

## Communication signature (ASCII tagging)

Autoresearch's terminal output must be recognizable at a glance amid everything else in the
session. Tag it low-key — monospace, no reliance on color. Lead status/notification lines
with a compact header and a per-event sigil:

```
┄┄ autoresearch · run:landing-cvr · round 41 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄
  ↑ NEW BEST   0.41 → 0.47   (shorter hero headline)        kept
```

Event sigils (consistent everywhere — log, status, notifications):

| Sigil | Event |
|-------|-------|
| `↑` | new best (kept) |
| `↺` | reverted (no improvement) |
| `◎` | target reached |
| `▣` | plateau / stopped |
| `⚠` | refused / errored |
| `…` | round in progress |

Keep it to one header line + one result line per round in chat; the full detail lives in
`results.md`. The point is instant context, not decoration.

## The morning report — graph + inlined JSON

Hand the run's data to the `html-report` skill, which stays one self-contained file (no
server, no external chart lib). Make it interactive by **inlining the experiments as JSON**
and rendering charts with hand-rolled inline SVG/JS:

- Convert `experiments.jsonl` → a JSON array embedded in the report
  (`<script type="application/json" id="experiments">…</script>`).
- Render: **score-over-rounds** with the *best-so-far* step line; **kept vs. reverted**
  markers; **gain-per-round** bars. Hover for the round's hypothesis.
- The inlined JSON also lets the reader filter/sort offline — greater visibility than a
  static image, while honoring html-report's "one file, opens anywhere" rule.

## The experiment record (structured log)

Beyond the prose `results.md` row, each round appends **one JSONL line** to
`.autoresearch/experiments.jsonl` — the machine-readable twin, so a future dashboard renders
history without reparsing prose:

```json
{"run_id":"autoresearch/landing","ts":"2026-06-17T22:14:03Z","round":7,"asset":"index.html","hypothesis":"shorter hero headline","change":"replaced H1 copy","score_before":0.41,"score_after":0.47,"direction":"higher-is-better","kept":true,"best_so_far":0.47}
```

Get `ts` from `date -u +%FT%TZ`. Keep keys stable — the dashboard depends on them.

## Stage II — global ledger + dashboard (not built yet)

Planned, deliberately deferred: a **centralized cross-run log** (e.g. append each
`experiments.jsonl` line to `~/.autoresearch/experiments.jsonl` keyed by `run_id`) that a
**dashboard** reads to show every experiment across every run — score curves, win rates,
which assets improved most. Stage I writes the per-run records in the right shape so the
ledger is a cheap append and the dashboard a pure read; do **not** block stage I on it.
