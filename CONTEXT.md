# Context Glossary

Canonical language for the skills in this repo. Terms only — no implementation.

## autoresearch skill

A skill that iteratively improves a single target until a stopping criterion is met,
modelled on Karpathy's `autoresearch` "program / prepare / train" loop. Generalised to
improve *anything*, not only ML training code.

- **Asset** — the single thing being optimised, and the *only* thing the loop may change
  (source file, HTML, email copy, ad, config, …). The equivalent of Karpathy's `train.py`.
- **Scorer** — the objective measuring stick that turns "is it good?" into one comparable
  result. May be a runnable **score function** (e.g. `score.py`) *or* a natural-language
  **score guide** (a rubric). Locked: the loop reads it to judge, never edits it, never
  redefines "better". Before any round runs, the skill **validates the Scorer is
  discriminating** — it must reliably separate better from worse (probed by scoring a few
  deliberately different variants and confirming the scores spread). A saturated, noisy, or
  too-fuzzy Scorer gives the loop no gradient; the skill refuses to start and sharpens it
  rather than running rounds for nothing.
- **Judge** — who applies the Scorer each round. Default: a single **blind subagent**
  handed the rubric and the two versions *unlabeled*, so the optimizer cannot inflate its
  own grade. Escalates to a **blind panel** (N judges, majority vote) when scoring is
  subjective or a win is within noise; the skill recommends the panel when scoring is hard.
- **Instructions** — the plain-English statement of the goal, the rules, and the stopping
  criteria. Human-owned; the loop never edits it. Karpathy's `program.md`.
- **Baseline** — the current best-scoring version of the Asset. A round that beats it
  replaces it; a round that doesn't is reverted.
- **Round** — one iteration: form one hypothesis → make one change to the Asset → score →
  keep-if-better-else-revert → log. **Invariant:** a round always resolves to exactly one
  scored keep/revert decision, however much machinery it uses to get there.
- **Escalation** — a round may delegate to `/workflows` to (a) widen the proposal search
  with parallel candidates, (b) do mechanically complex multi-file edits, or (c) run the
  blind judge **panel** for hard/subjective scoring. Escalation amplifies a round; it never
  dissolves the one-keep-per-round Invariant.
- **Workspace** — the `.autoresearch/` directory holding all loop state: `instructions.md`,
  the locked Scorer, the `results.md` log, and `state.json` (round #, best score, plateau
  counter). Always backed by git so revert is uniform — an isolated **worktree on a
  dedicated branch** when the Asset is in a repo, otherwise a throwaway scratch repo. The
  human's working branch is never touched until they accept the winner.
- **Loop driver** — the mechanism that re-invokes the skill across rounds. Uses the
  harness `/loop` until the stopping criterion is met or the human stops it. The skill
  cancels its own loop when the criterion is hit and writes a final summary.
- **Stopping criterion** — the condition that ends the loop: a target score reached, a
  plateau (no improvement for K rounds), or human stop.
- **Results log** — the running, human-readable record of rounds (what changed, score
  before → after, kept or reverted) the human reads later. `results.md` is the always-on
  plain-text source of truth; the final morning summary is offered as an `html-report`.
- **Experiment record** — one structured (JSONL) line per Round capturing run id, asset,
  hypothesis, change, score before → after, kept/reverted, best-so-far. The
  machine-readable twin of the `results.md` prose entry.
- **Cross-run ledger** — the global `~/.autoresearch/experiments.jsonl` (every Round of every
  run, keyed by run id) + the run registry. `scripts/record.mjs` writes it; the **dashboard**
  (`scripts/build-dashboard.mjs`) renders a self-contained interactive view over all runs —
  normalized score curves, win rates, per-run drill-down.
- **Status check** — a pull-only invocation (`/autoresearch status`) that reads `state.json`
  + the log and prints where the run stands, without running a Round.
- **Notification** — a push signal (via the harness notifier) on events worth interrupting a
  human for: target reached, plateau/stopped, refused/errored, and new-best. Everything else
  is pull-only.
- **Safety ceiling** — a progress-independent stop (`max_rounds` / `max_wallclock`) folded
  into the stopping criterion; since exact token spend isn't readable, round/time counts are
  the $ proxy. Cost is handled here, not as a separate guardrail apparatus.
- **Atomic round** — a Round either fully commits (kept) or fully reverts; a `round_in_progress`
  flag + baseline commit let an interrupted Round be rolled back and retried on the next
  firing, never half-committed. This is what makes a run resumable after a token limit/crash.
- **Run registry** — the global `~/.autoresearch/runs.json` listing every run (id, asset,
  status, best, last update, path), so concurrent runs have one at-a-glance home.
- **Communication signature** — the low-key monospace header + per-event sigil
  (`↑` best · `↺` revert · `◎` target · `▣` plateau · `⚠` error · `…` in progress) that tags
  autoresearch's terminal output so its context is recognizable at a glance.
- **Win trail** — the autoresearch branch's commit history. Because only kept Rounds commit,
  `git log` *is* the noise-free ledger of genuine improvements.
- **Accept** — the human-gated step that lands the winner. The loop never touches the
  human's working branch on its own: it presents the winning diff + score delta and stops;
  a one-command accept then merges / copies the winner out once the human has reviewed it.
