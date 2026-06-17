---
name: autoresearch
description: Use when the user wants to iteratively improve a single target — source code, HTML, email/ad copy, a config, a prompt, anything — by running an unattended improvement loop against a measurable goal. Triggers on "autoresearch", "optimize/improve X until", "hill-climb this", "keep iterating overnight", "make this convert/load/score better and keep what wins", or any "turn 'is it good?' into a number and grind on it" request. Models Karpathy's autoresearch (program/prepare/train) loop, generalised to improve anything.
---

# Autoresearch

## Overview

Pick **one** thing to improve, turn "is it good?" into **one comparable score**, then run a
long loop that each round makes **one change**, scores it with a **locked** scorer, **keeps
it only if it beats the current best, otherwise reverts** — until a stopping criterion is
met. It is hill-climbing with an LLM proposing each step. Modelled on Andrej Karpathy's
[`autoresearch`](https://github.com/karpathy/autoresearch), generalised beyond ML so the
target can be code, copy, a landing page, a config, a prompt — anything writable.

**Core principle:** a kept change must be *attributable* and *honestly judged*. That rests
on four invariants the loop never breaks:

1. **One asset, one change, one score per round.** Whatever machinery a round uses, it
   resolves to exactly one keep-or-revert decision. → [reference/the-loop.md](reference/the-loop.md)
2. **The scorer is locked.** The loop reads it to judge; it never edits it or redefines
   "better." No moving the goalposts. → [reference/scoring.md](reference/scoring.md)
3. **Judging is blind.** A fresh subagent scores the variant *unlabeled* so the optimizer
   can't inflate its own grade. → [reference/scoring.md](reference/scoring.md)
4. **The human's working branch is never touched until they accept.** All churn stays in an
   isolated, git-backed workspace. → [reference/workspace.md](reference/workspace.md)

## The four phases

| Phase | What happens | Read |
|-------|--------------|------|
| **1. Set up** | Resolve the three locked files — `instructions.md` (goal + rules + stop), the **Asset** (the only writable thing), the **Scorer** — via interview, prompt, or named files. Gate on the **fit-check** and a **scorer-discrimination probe**. | [reference/setup.md](reference/setup.md) |
| **2. Validate the scorer** | Before any round: confirm the scorer actually separates better from worse. If it can't, sharpen it or refuse — never run rounds for nothing. | [reference/scoring.md](reference/scoring.md) |
| **3. Loop** | Drive rounds with `/loop` against the git-backed `.autoresearch/` workspace; each round proposes → changes → blind-scores → keeps/reverts → logs. Self-cancel when the stop criterion hits. | [reference/the-loop.md](reference/the-loop.md) |
| **4. Land** | Present the winning diff + score delta and **stop**; one-command accept merges/copies the winner out. Offer an `html-report` morning summary (interactive charts from inlined experiment JSON). | [reference/workspace.md](reference/workspace.md) |

Running it safely over time — crash/token-limit **resume** (atomic rounds), bounded
escalation, and managing **many concurrent runs** — is [reference/operations.md](reference/operations.md).

## Entry points

The arg is polymorphic — all three converge on the same locked setup:

- `/autoresearch` — bare: full interview to build the three files from scratch.
- `/autoresearch <prompt>` — seed: absorb the brief, interview only for the gaps.
- `/autoresearch <file …>` — adopt files that already exist (your `instructions.md`, the
  asset, a `score.py`); interview only for what's still missing.

- `/autoresearch status` — pull-only check-in: print where the run stands (round, best,
  plateau, score curve) **without** running a round. See [reference/visibility.md](reference/visibility.md).

A loop is already running if `.autoresearch/state.json` exists and is active — then a bare
invocation runs the **next round**, it doesn't re-set-up. See [reference/the-loop.md](reference/the-loop.md).

## Visibility

While the loop runs unattended, the human sees in via **pull** surfaces — `state.json` (glance),
`results.md` (narrative), `git log` on the autoresearch branch (the **win trail** — only kept
rounds commit, so it's a noise-free ledger of real improvements), and `/autoresearch status` —
and **push** notifications on target-reached, plateau/stopped, refused/errored, and new-best.
Each round also feeds a global **cross-run ledger**; `scripts/build-dashboard.mjs` renders a
self-contained interactive dashboard over all runs. Full model:
[reference/visibility.md](reference/visibility.md) · [reference/dashboard.md](reference/dashboard.md).

## Discipline

- **Refuse a doomed loop.** No single writable asset, no discriminating scorer, or no
  stopping criterion → don't start. Reshape the target instead (see the fit-check).
- **Never edit the scorer or `instructions.md`** — they're human-owned and locked.
- **One keep/revert per round, always** — even when a round escalates to `/workflows`.
- **Escalate, don't dissolve.** `/workflows` may widen the proposal search, do complex
  multi-file edits, or run the blind judge **panel** for hard scoring — but the round still
  ends in one scored decision. → [reference/the-loop.md](reference/the-loop.md)
- **The loop must be able to stop itself.** Self-cancel on the criterion; never grind past
  the goal burning tokens.
- **Human gates anything reaching real code.** Present, don't auto-merge.

## Related skills

- **`/workflows`** — a round's amplifier: parallel proposals, complex edits, or the blind
  judge panel. Each is one well-scoped fan-out inside a single round.
- **`html-report`** — the morning summary (round-by-round, baseline→best curve, winning
  diff). `results.md` stays the always-on plain-text source of truth.
- **`/loop`** — the harness facility that drives the rounds; the skill schedules it and
  cancels it on the stopping criterion.
