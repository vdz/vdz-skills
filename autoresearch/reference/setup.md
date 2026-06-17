# Setup — locking the three files

**When to read this:** at the very start, before any round, whenever `.autoresearch/` does
not yet hold an active run. Your job here is to produce three locked things and prove the
target is worth a loop. Do **not** start rounds until all gates pass.

## The deal (say this first)

Greet briefly and state the contract in your own words: *we pick ONE thing, turn "is it
good?" into one honest number, then loop — changing it, scoring it, keeping what wins and
trashing what loses — until the goal is hit or you stop me.* Then run setup.

## What you must produce

Three files in `.autoresearch/` (see [workspace.md](workspace.md) for layout):

1. **`instructions.md`** — human-owned, locked to you. Plain-English goal (what we optimise
   and *why*), the rules, and the **stopping criterion**. Use [templates/instructions.md](../templates/instructions.md).
2. **The Asset** — the single thing the loop may change. A file/dir/copy/config. The loop
   writes *only* here.
3. **The Scorer** — `score.py` (or any runnable command that prints one number) **or** a
   natural-language `score.md` rubric. Locked: read to judge, never edited. See
   [scoring.md](scoring.md).

## Three ways in (resolve, don't re-ask)

- **Bare `/autoresearch`** — interview from scratch.
- **`/autoresearch <prompt>`** — absorb the brief; interview only the gaps.
- **`/autoresearch <file …>`** — adopt the named files as instructions / asset / scorer;
  interview only what's still missing.

Interview one question at a time. Never re-ask what the prompt or named files already answer.

## The interview (only for gaps)

1. **Asset** — what are we optimising, exactly? Get the file(s)/path and confirm you have
   write access. One asset only; if they name several, find the single thing that's actually
   the lever, or split into separate runs.
2. **Metric** — what one number means "better"? Push for a single comparable result. If
   it's subjective, draft the rubric together (see [scoring.md](scoring.md)).
3. **Stopping criterion** — always set at least one: a **target score**, a **plateau**
   (default K=10 rounds with no improvement), and human-stop is always available.

## Gate A — the fit-check

Be honest; refuse a doomed loop and reshape the target instead of pretending.

**Must-haves (all three required):**
- **Objectively scorable** — a real result, not "make it look nicer."
- **Fast feedback** — minutes/hours, not weeks (no SEO-reindex, no 6-month churn).
- **Write access** — you can actually change the asset (a file/API, not a published video).

**Nice-to-haves (more = more powerful):** high feedback volume · cheap to fail · a
consistent, repeatable measuring stick (fair comparisons, no list fatigue).

If a must-have fails, say so plainly and propose a better-shaped target.

## Gate B — the scorer-discrimination probe

A scorer that can't separate better from worse gives the loop no gradient — it would run
forever for nothing. Before round 1, **prove the scorer discriminates**:

- Produce 2–3 deliberately different variants of the asset (e.g. an obviously-worse one, the
  baseline, an obviously-better one).
- Score each with the locked scorer.
- Confirm the scores **spread** and **rank sensibly**. If everything scores ~the same, or
  the metric is already saturated / at the noise floor, the scorer is too blunt.

If it fails: sharpen the rubric / pick a finer metric, or — for subjective scoring —
recommend the blind **panel** (see [scoring.md](scoring.md)). Do not start until it passes.

## On success

Write the three files, record the baseline score in `state.json`, tell the human the run is
armed, and hand off to [the-loop.md](the-loop.md) to start the loop.
