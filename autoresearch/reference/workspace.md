# Workspace, reverting, and landing the winner

**When to read this:** when creating the workspace at setup, and at the end when the human
returns to accept a winner.

## Layout — `.autoresearch/`

A single directory is the source of truth for the whole run. With more than one run active,
namespace it by `run_id` (`.autoresearch/<run_id>/`) so concurrent runs never collide — and
register the run in the global `~/.autoresearch/runs.json` (see [operations.md](operations.md)).

```
.autoresearch/[<run_id>/]
├── instructions.md   # locked: goal + rules + stopping criterion (human-owned)
├── score.py | score.md   # locked Scorer (function or rubric)
├── results.md        # always-on plain-text log, one entry per round
├── experiments.jsonl # structured record per round (dashboard-ready) — see visibility.md
└── state.json        # round #, best score, plateau counter, loop status, asset path
```

The Asset itself lives where it normally lives (in the repo, or a path the human gave) — the
workspace points at it via `state.json`; it is not copied in.

## Always git-backed — uniform revert

The loop never reasons about "git vs. snapshot." There is always git underneath; the only
question is *which* git:

- **Asset is in a git repo** → run the loop in an **isolated worktree on a dedicated branch**
  (e.g. `autoresearch/<asset>`). Each kept round is a commit; revert is `git reset --hard`.
  The human's working branch is never touched.
- **Asset is not tracked** (loose copy, a config outside any repo) → `git init` the workspace
  as a **throwaway scratch repo** so commit/revert/diff work identically.

Either way: kept change → commit; rejected change → `git reset --hard` to the baseline commit.
Same logic, no special-casing.

## Landing the winner (human-gated)

The loop **never auto-merges**. When it ends (criterion met or human stop):

1. **Present** the winning diff (baseline → best) and the score delta. Stop there.
2. The human eyeballs it.
3. **One-command accept** then lands it — merge the autoresearch branch, or copy the winning
   asset out — only once the human has approved. Nothing reaches their real code unattended.

This is the whole safety posture of an unattended loop: the human is the gate on anything
reaching real code.

## The morning report

- **`results.md`** is always there — the plain-text round-by-round source of truth.
- Offer a polished **`html-report`** summary: the round-by-round table, the baseline→best
  score curve, and the winning diff. Hand off to the `html-report` skill; don't hand-roll it.
