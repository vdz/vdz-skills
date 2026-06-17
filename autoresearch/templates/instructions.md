# Autoresearch instructions — LOCKED (human-owned)

> This file is edited only by the human. The loop reads it and never changes it.

## Goal

<!-- Plain English: what we are optimising, and WHY it matters. One thing only. -->

## The asset

- **Path:** <!-- the single file/dir the loop may change -->
- The loop writes **only** here. Nothing else is touched.

## The scorer

- **Type:** <!-- function (score.py) | rubric (score.md) -->
- **Direction:** <!-- lower-is-better | higher-is-better -->
- **Locked:** the loop reads it to judge; it is never edited and "better" is never redefined.

## Scoring noise / margin

<!-- A change must beat the baseline by MORE than this to be kept.
     e.g. "average 3 runs; keep only if improvement > 0.5%" or "rubric tie => revert". -->

## Stopping criterion (at least one; human-stop always applies)

- **Target:** <!-- e.g. score < 0.92 -->
- **Plateau:** stop after K = 10 rounds with no improvement
- **Safety ceiling:** max_rounds = 200, max_wallclock_hours = 8  <!-- progress-independent net + $ proxy -->
- **Human stop:** always available

## Escalation budget (per round, not a stop)

- **max_escalation_agents:** 5   <!-- ceiling on parallel proposals / judge-panel size per round -->

## Rules / constraints

<!-- Anything the loop must respect: don't break tests, stay under a size budget,
     keep the public API, tone of voice, etc. -->
