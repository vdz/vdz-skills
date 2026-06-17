# Operations — resume, escalation cost, and many runs

**When to read this:** on every firing (recover from interruption), when a round escalates,
and when more than one run is active at once.

> **Cost** is handled by the **stopping criterion**, not a separate apparatus — plateau and
> target already stop a dead or finished run, and `instructions.md` adds a hard **safety
> ceiling** (`max_rounds` / `max_wallclock`) as a progress-independent net. The skill can't
> read exact token spend, so round/time counts are the $ proxy. The one cost lever that
> *isn't* a stop condition is per-round escalation breadth, below.

## Escalation cost (per round, not a stop condition)

`/workflows` is the expensive path. Keep it bounded so one round can't fan out unboundedly:

- **`max_escalation_agents`** — ceiling on parallel proposals / judge-panel size per round.
- When a round escalates, pass the workflow a **token budget** (the workflow `budget`
  mechanism) so the fan-out self-limits.
- **Escalate sparingly** — a cheap inline edit is the default; `/workflows` is only for
  genuinely multi-file changes, wide searches, or hard scoring.

## Resume after interruption (token/context limit, crash, stop)

All durable state is on disk (`state.json`, baseline in git, `experiments.jsonl`), so a run
is resumable **if every round is atomic**. Guarantee atomicity:

1. **Mark in-flight.** At round start, set `state.json.round_in_progress = true` and record
   the `baseline_commit`. Clear the flag only after the round commits (kept) or reverts.
2. **Recover on every firing.** Before proposing, if `round_in_progress` is `true` **or** the
   worktree is dirty → the previous round was cut mid-flight. `git reset --hard
   <baseline_commit>`, log that round as `aborted`, clear the flag, then start a fresh round.
   **Never commit a half-finished change** — a partial edit must never become the baseline.
3. **`/loop` re-fires automatically**, so resume needs no human action — only crash-safety.
4. **Keep rounds small; push big work to `/workflows`.** A workflow has its own context
   window, so the round that would blow the main context becomes a delegated job whose result
   is scored as one unit. This is both the one-change discipline *and* token-limit defense.

> Atomicity over salvage: discarding and retrying an interrupted round is safer than trying
> to resume a half-applied edit. (A workflow that was mid-run can be resumed via its
> `resumeFromRunId` if it's expensive — but the round's keep/revert still happens once, clean.)

## Many runs at once

Several long-running loops need **isolation** and **one-glance aggregate visibility**.

- **Isolation** — each run has a `run_id` and its own git worktree/branch; its `.autoresearch/`
  workspace is namespaced by `run_id` so concurrent runs never collide.
- **Registry** — append each run to a global `~/.autoresearch/runs.json`: `run_id`, asset,
  branch, status, best score, `last_update`, workspace path. The single list of what's alive.
- **Multi-run status** — `/autoresearch status` with no active run in the cwd reads the
  registry and prints a compact table:

  ```
  RUN              ASSET            RND   BEST    Δ24h   STATUS     ROUNDS
  landing-cvr      index.html        41   0.47    +.06   running    41/200
  cold-email       outreach.md       18   0.31    +.00   plateau→stop
  api-latency      handler.ts        93   88ms    -7ms   running    93/300
  ```

- **Aggregate cost** — budgets are per-run; the status table's round counts are the
  at-a-glance spend signal across runs. A global budget is possible but not built (stage II).
- **Cross-run dashboard** — the visual view over all runs reads the per-run
  `experiments.jsonl` files (or a merged global ledger). Stage II; see [visibility.md](visibility.md).
