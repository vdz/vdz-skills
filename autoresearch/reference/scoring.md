# Scoring — the locked, blind judge

**When to read this:** when defining or validating the scorer (Gate B in
[setup.md](setup.md)), and every round when judging a variant.

## The scorer can be a function or a rubric

- **Score function** — `score.py` or any command that reads the asset and prints **one
  number**. Lower-is-better or higher-is-better, stated once in `instructions.md`. Best when
  the target is code/perf/anything mechanically measurable.
- **Score guide** — a natural-language `score.md` rubric that yields one comparable result.
  Legitimate when no function exists (copy, design, prose). Must be concrete enough that a
  judge applies it *consistently* — if it's vibes, sharpen it.

**Locked, both kinds.** The loop reads the scorer to judge. It never edits it and never
redefines "better." Moving the goalposts to manufacture a win is the one unforgivable move.

## Gate B — discrimination (before any round)

A scorer that scores everything the same is useless. Prove it separates better from worse by
scoring 2–3 deliberately different variants and confirming the scores spread and rank
sensibly. Saturated / noise-floor / too-fuzzy → sharpen or refuse. Full procedure in
[setup.md](setup.md).

## Blind judging (every round) — the default

If the same agent that wrote a change also grades it against a fuzzy rubric, it will
rationalise its own work as a win. That silently corrupts the keep/revert decision — the one
decision the loop depends on. So:

> **Each round, delegate scoring to a fresh subagent.** Hand it the locked scorer and the
> two versions **unlabeled** — it must not know which is baseline vs. variant. It applies the
> scorer and returns the number / picks the winner. The optimizer cannot lean on it.

For a score *function*, "blind" is automatic — just run it; the number is the number. The
blind subagent matters most for **rubric** scoring.

## Escalate to a blind panel — when scoring is hard

When scoring is subjective, or a "win" is within noise, one judge is too noisy. Escalate to a
**panel**: N blind judges (default 3) score independently; majority/median decides. Run the
panel as a `/workflows` fan-out (see [the-loop.md](the-loop.md)).

**Recommend the panel proactively** during setup whenever the rubric is subjective and the
stakes are high — don't wait for noisy results to force it.

## Ties and noise

A variant must beat the baseline by more than the scorer's noise to be kept. For functions
with run-to-run variance, define a margin (or average N runs) in `instructions.md`. For
rubric scoring, a tie = revert (favour the incumbent). Never keep a change that's merely
*not worse*.
