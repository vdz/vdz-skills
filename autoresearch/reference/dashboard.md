# Cross-run ledger + dashboard

**When to read this:** when recording rounds (so they reach the global ledger) and when the
human wants the cross-run view over *all* their autoresearch runs.

This is the cross-run counterpart to the per-run morning report. The per-run report is a
narrative `html-report`; this is a **data-driven, regenerated** dashboard built by a script.

## The ledger layer

Two files under `$AUTORESEARCH_HOME` (default `~/.autoresearch/`), shared across every run:

- **`experiments.jsonl`** — the global ledger: every round from every run, one JSON line,
  each carrying `run_id` (same shape as the per-run `experiments.jsonl`; see
  [visibility.md](visibility.md)).
- **`runs.json`** — the registry: one entry per run (`run_id`, asset, direction, status,
  best, rounds, last_update, workspace).

## Writing — `scripts/record.mjs`

Each round, instead of hand-appending the log line, call the recorder — it writes the per-run
log, the global ledger, and upserts the registry in one deterministic step:

```bash
node autoresearch/scripts/record.mjs <workspace-dir> '<json-record>'
# e.g.
node autoresearch/scripts/record.mjs .autoresearch/runs/landing \
  '{"run_id":"landing-cvr","round":7,"asset":"index.html","hypothesis":"shorter hero",
    "change":"rewrote H1","score_before":0.41,"score_after":0.47,
    "direction":"higher-is-better","kept":true,"best_so_far":0.47,"status":"running"}'
```

`ts` is auto-stamped if omitted. Pass `status` on the round that ends a run (`done`,
`plateau`, `stopped`) so the registry reflects it.

## Building — `scripts/build-dashboard.mjs`

Reads the ledger + registry and emits **one self-contained `.html`** (inlined JSON,
hand-rolled inline SVG, vanilla-JS interactivity, auto dark/light — no deps, no server):

```bash
node autoresearch/scripts/build-dashboard.mjs [out.html]
# default out: $AUTORESEARCH_HOME/dashboard.html
```

It renders: summary cards (runs / experiments / wins / active); a **normalized
best-so-far curve** with one line per run (improvement % vs baseline, so lower- and
higher-is-better runs share one axis) and clickable legend toggles; a runs table (rounds,
baseline→best, Δ%, win rate); and a **per-run detail** chart on row-click (per-round scores,
● kept / ○ reverted, dashed best-so-far line, hover for the hypothesis).

The data is baked in at build time, so the file is a **snapshot** — re-run to refresh.
(File-system `fetch` is blocked under `file://`, which is why the JSON is inlined rather than
loaded; this keeps the "opens anywhere, no server" guarantee.)

## Override the home

Set `AUTORESEARCH_HOME` to point both scripts at a different ledger root (used by the test
harness and by anyone who keeps the ledger outside `~`).
