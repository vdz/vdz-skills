# The loop — rounds, driving, escalation, stopping

**When to read this:** once setup has passed both gates, and on every loop firing thereafter.

## The round (the whole engine)

One round = one keep-or-revert decision. Always, no exceptions:

1. **Read state + recover** — load `.autoresearch/state.json`. If `round_in_progress` is set
   or the worktree is dirty, the previous round was cut mid-flight: `git reset --hard` to the
   baseline commit, log it `aborted`, and clear the flag. Then mark `round_in_progress` and
   load the baseline asset. See [operations.md](operations.md) and [workspace.md](workspace.md).
2. **Propose ONE hypothesis** — one coherent idea for why a specific change should improve
   the score. Read `results.md` first so you don't retry a dead end.
3. **Make ONE change** to the Asset (and *only* the Asset).
4. **Blind-score** the variant against the locked scorer (see [scoring.md](scoring.md)).
5. **Decide** — beats baseline by more than noise? **Commit** it: it becomes the new
   baseline, reset the plateau counter. Otherwise **revert** (git reset) and increment the
   plateau counter.
6. **Log** — append the prose row to `results.md` (round #, hypothesis, change, before →
   after, kept/reverted) *and* the structured **experiment record** (one JSONL line) to
   `.autoresearch/experiments.jsonl`. Update `state.json`. See [visibility.md](visibility.md).
7. **Notify if warranted** — push on new-best, and on the terminal events below. See
   [visibility.md](visibility.md).
8. **Check the stopping criterion** (below). Met → cancel the loop, notify, write the final
   summary. Not met → let the next firing run.

> **Invariant:** however much machinery a round uses, it resolves to exactly one scored
> keep/revert. A round never commits two unrelated changes "to save time" — that destroys
> attribution.

## Driving with `/loop`

The loop is driven by the harness `/loop` facility, not by Claude holding state in its head
(it can't — each firing is a fresh turn; all state is on disk).

- After setup, **start the loop**: schedule `/loop` to re-invoke `/autoresearch` (it detects
  an active `state.json` and runs the next round).
- **Cadence** is chosen from feedback speed, not hard-coded to 5 minutes: a fast `score.py`
  → tight self-paced rounds; a slower rubric/panel → looser. Let `/loop` self-pace when the
  round time is variable.
- **Self-termination is mandatory.** When the stopping criterion is met, the skill cancels
  the loop (`/cancel`) and stops scheduling. A loop that can't stop itself burns tokens past
  the goal — design against it.

## Stopping criterion

End the loop when **any** holds (all set in `instructions.md`):

- **Target reached** — best score crosses the goal.
- **Plateau** — plateau counter hits K (default 10) rounds with no improvement.
- **Safety ceiling** — `max_rounds` or `max_wallclock` trips (a progress-independent net,
  and the practical $ proxy since exact spend isn't readable).
- **Human stop** — always available.

Each round is **atomic** so the loop survives interruption (token limit, crash): a half-done
round is rolled back and retried on the next firing, never committed. See [operations.md](operations.md).

## Escalating a round to `/workflows`

A round may delegate to `/workflows` — as an **amplifier**, never to break the one-keep
invariant. Three legitimate uses:

- **Widen the proposal search** — fan out N candidate changes in parallel, blind-judge them,
  keep the single best. (Judge-panel pattern; beats serial guessing when the space is wide.)
- **Complex execution** — the chosen change spans several files / steps. The workflow does
  the heavy lifting; the result is still scored and kept/reverted as one unit.
- **Hard scoring** — run the blind judge **panel** (see [scoring.md](scoring.md)) as the
  workflow.

Escalate when the change is multi-file/multi-step or the search space is wide; otherwise keep
the round a cheap inline edit. Either way the round ends in exactly one scored decision.
