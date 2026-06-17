# 1. First autoresearch targets: the three Ripe instruction skills (B, C, E)

Date: 2026-06-18
Status: Accepted

## Context

We built the `autoresearch` skill (a Karpathy-style improve-one-thing loop) and needed real
targets to run it on. A fan-out of scout agents surfaced candidate experiments across both
repos; the only scorable targets are skill/instruction-quality loops (the repos are pure
markdown — no build, bundle, or test suite to optimise). Five viable candidates emerged:

- **A** — teaching bake-off: optimise the 4 teaching skills' `description:` for triggering
  accuracy. Cheapest setup (just a labeled prompt bank).
- **B** — `building-ripe-components/SKILL.md` → minimise weighted `ripe-audit` grep
  violations on a fixed component task.
- **C** — `building-ripe-tests/SKILL.md` → maximise % of fresh-agent runs whose generated
  tests pass `vitest` + harness greps.
- **E** — `building-ripe-store/SKILL.md` → maximise the blind rubric score already written in
  `TESTS.md` (6 scenarios).

A was recommended as the cheapest first spin.

## Decision

Run autoresearch on **B, C, and E** — the three Ripe *instruction* skills — as the first real
experiments, in parallel, each in its own `ripe-skills` worktree. Defer A.

The unifying reason: B/C/E all optimise the **agent-instruction artifacts that drive how
Ripe code gets generated** — the part of the toolchain whose quality compounds across every
future project. They share one scorer pattern (fresh agent generates from the skill →
deterministic check) and the winning edits transfer between them. A is cheaper but optimises
*triggering*, a one-off, lower-leverage property.

Reports: per-run morning reports are produced via the **`html-report` skill** (narrative +
inlined-experiment charts); the cross-run view is the `build-dashboard.mjs` snapshot.

## Consequences

- Higher setup cost than A: each needs a scratch Ripe project (`ripe-init`), a fixed
  task/spec, and a `score.py` (B: grep audit; C: vitest + greps; E: blind rubric from
  `TESTS.md`). B is runnable without `npm` (grep generated files); C needs a real test run.
- Cost risk is **N fresh agent generations per round** — pin the task small and N=3.
- Three concurrent runs exercise the multi-run ledger/dashboard for real.
- A remains available as a cheap future run; this is reversible — it's a choice of *what to
  point the loop at*, not an architectural commitment.

## Alternatives considered

- **Start with A** (recommended for cost): rejected for first spin — lower leverage; we'd
  rather stress the loop on the targets whose improvements compound. A is queued, not dropped.
- **One target first, then the rest**: rejected — running B/C/E together is the honest test
  of the concurrent-runs machinery we just built.
