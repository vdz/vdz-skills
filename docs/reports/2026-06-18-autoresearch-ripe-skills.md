# Autoresearch — Ripe skills optimization runs (captured)

**Runs performed:** 2026-06-18 · **Captured to this doc:** 2026-08-24
**Method:** Karpathy-style improvement loop (`autoresearch` skill) — a fresh agent builds
from a target `SKILL.md`, output is scored, hypotheses mutate the skill, deltas are kept only
if they beat the best-so-far by a margin.

This doc preserves the findings from three autoresearch experiments whose worktrees/branches
were pruned after capture. The scaffolds (probes, baselines, scorers, scratch projects) were
disposable; the conclusions below are the lasting output.

**Provenance (pruned, unmerged, local-only — never pushed):**

| Experiment | Branch | Commit | Submodule base |
|---|---|---|---|
| components | `autoresearch/components` | `1822efd` | `main` @ `360f65f` (v2.1.0) |
| store | `autoresearch/store` | `4cdfa45` | `main` @ `360f65f` (v2.1.0) |
| tests | `autoresearch/tests` | `82654a9` | `main` @ `360f65f` (v2.1.0) |

---

## Headline finding

**All three Ripe skills already steer a fresh agent to a perfect (ceiling) score on their
baseline scenario.** In every run, Gate B proved the scorer discriminates good from bad code,
and then the baseline generation hit the metric ceiling — leaving the optimization loop with
no gradient to climb. This is a "skill already does its job" outcome, not a scorer failure.

The actionable takeaway is not about the skills (they pass) but about the *experiment design*:
the baseline scenarios are too easy to expose headroom. Each run below lists how to make it
loop-worthy (harder / multi-scenario metrics, multi-run averaging for noise).

---

## Run: `ripe-components`

- **Asset:** `skills/building-ripe-components/SKILL.md`
- **Scorer:** `.autoresearch/score.py` — weighted Ripe-component violations (H=3 M=2 L=1),
  **lower is better**. Target: 0 H and 0 M. Plateau K=10, max_rounds 50.
- **Spec:** `ProductCard` (display) + `OrdersPanel` (container w/ refresh).

**Gate B — scorer discrimination: PASS**

| variant | what it has | H+M | weighted |
|---|---|---|---|
| bad | raw HTML, `useState`, transient `$active` prop, 3 handler-less interactive tags, fat `product: Product` prop | 7 | **22** |
| mid | clean component, one stray raw `<span>` | 0 | **1** |
| clean | fully compliant (IDs, classes, semantic styled, dispatch) | 0 | **0** |

Spread 22 → 1 → 0, monotonic with quality; sharp H/M signal.

**Baseline (round 1):** score **0 weighted / 0 H+M** — generated code was genuinely clean
(function-declaration components, IDs not entities, class-based styling, semantic styled
names, dispatched intents, no `useState`/`useEffect`).

**Conclusion:** Baseline already meets target on a single generation → little headroom.
**Next moves:** (a) harden the spec with trickier components that tempt violations, or
(b) average ~5 generations per round to surface stochastic violations. As configured, the
loop would plateau immediately at 0.

---

## Run: `ripe-store` (slowest / most expensive — 1 code-gen + 3 blind judges per round)

- **Asset:** `skills/building-ripe-store/SKILL.md`
- **Scorer:** `.autoresearch/score.md` — rubric, **higher is better**, blind panel N=3 median.
  Range 0.00–2.00. Fixed scenario **S1** (greenfield `cart` branch). Target 1.80.

**Gate B — scorer discrimination: PASS (spread 1.70 / 2.00)**

| variant | shape | blind score |
|---|---|---|
| A | Ripe-shaped (items+byId, payload interfaces, `LOADING_STATES`, dumb reducer, tests, `@/`) | **1.90** (only ding: empty listener) |
| B | violating (flat array, `createAction<string\|number>`, bare `'idle'`, fetch+business `if`+compute in reducer, no tests, no listener, one-file) | **0.20** |

**Baseline (round 1):** panel median **2.00 / 2.00** — unanimous `[2.00, 2.00, 2.00]`,
all C1–C10 = 2. Metric ceiling; target 1.80 already exceeded.

**Conclusion:** Gate-A "already-saturated" outcome for S1 — do **not** start the loop as
configured (it would burn expensive rounds finding nothing).
**Next moves:**
1. Re-base the metric on harder/subjective scenarios (S3 `filteredItems` not `filteredIds`
   + recompute-in-reducer; S4 cross-branch listener placement; S5 refactor anti-pattern
   component; S6 Cardinal-Rule defence). Score = mean across a basket of 2–3. This is where
   the 3-judge panel earns its keep.
2. Average 2–3 code-gen runs per variant for Opus non-determinism before trusting a delta.
3. Only then arm the loop. **Panel recommended: YES** (N=3 median once headroom exists).

---

## Run: `ripe-tests`

- **Asset:** `skills/building-ripe-tests/SKILL.md`
- **Scorer:** `.autoresearch/score.py` — **higher is better**, [0,1]. Composite per run =
  `0.6*green + 0.4*compliance`, mean over 3 runs. Keep margin Δ > 0.01. Code-under-test =
  fixed `counter` branch in `.autoresearch/scratch`.

**Gate B — scorer discrimination: PASS (spread 0.60)**

| variant | description | score |
|---|---|---|
| `fixtures/good` | green + fully compliant | 1.0000 |
| `fixtures/noncompliant` | green but `configureStore` + `toMatchSnapshot` | 0.7333 |
| `fixtures/broken` | deliberately-wrong assertion → vitest fails | 0.4000 |

**Baseline (round 1):** **1.0000** — a fresh subagent produced 17 tests (reducer + listener
+ selector), all green, all 3 compliance checks passing, on 3/3 runs. Already at target.

**Conclusion:** No headroom for this asset against this scorer + code-under-test.
**Next moves:** either **stop** (skill already does its job for the `counter` shape), or
**raise the bar** — add compliance checks from `checklists/tests.md`
(TEST-L-NO-VI-RESETMODULES, TEST-L-DESCRIBE-COUNT, TEST-L-IMPLEMENTATION-LEAK, coverage of
every reducer case / every listener entry) and/or a harder code-under-test branch, then
re-baseline.

---

## What this means for the Ripe skills

The three optimized skills (`building-ripe-components`, `building-ripe-store`,
`building-ripe-tests`) are in good shape as of v2.1.0 — each reliably produces compliant,
high-scoring output from a cold start on its baseline scenario. Future autoresearch on them
should start from *harder* scenarios (see per-run "next moves") rather than the baselines used
here, which have no measurable headroom left.
