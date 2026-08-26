# Skill Tests

Test plans for the skills in this repo. Use these to validate that a skill steers a model correctly before publishing changes.

---

## `building-ripe-store`

A skill is only as good as how it actually steers a model. The 6 scenarios below exercise the skill across realistic tasks, with a rubric to score against.

### Setup

- Fresh Claude Code session (no prior context). Opus 4.7 is the primary target; optionally re-run on Sonnet 4.6 for comparison.
- Load **only** the `building-ripe-store` skill (e.g., a temp project with that one skill in `~/.claude/skills/`). Isolating the skill prevents noise from sibling skills.
- Provide a minimal scaffold: `src/store/types.ts` (with `LOADING_STATES` + `Listener` interface), `src/store/store.ts`, `src/store/listener.ts`, `tsconfig.json` with `@/*` path alias.
- Don't paste SKILL.md or any reference file into the prompt. Let the skill mechanism do its job.

### Scenarios

#### 1. Greenfield branch — happy path
> *"Add a `cart` store branch. The user can add items, remove items, and adjust quantity. The cart should know which item IDs are in it and how much quantity per item. Hydrate empty initially."*

**Tests:** file structure, payload interfaces, dual structure, default state, dumb reducer, action naming, `__tests__/` placement.

#### 2. Extend existing branch
Pre-seed with a `products` branch, then:
> *"Add a `selectProduct` action to the products branch — it sets the currently active product by ID. Update the type for the active selection."*

**Tests:** does it scaffold *only* what's needed (action + type + reducer case + selector if applicable) without rewriting everything? Does it use a payload interface even for a single-field payload?

#### 3. Filtered list — exercises the optional `filteredItems` pattern
> *"The products page now needs a search box and a category filter. Implement it so the search and filter are reflected in the URL and the visible product list updates immediately."*

**Tests:** does it apply `filteredItems` (not `filteredIds`)? Does it recompute in the reducer on `setFilter` / `setSearch` / `fetchProductsSuccess`? Does it use an `applyFilter`-style pure helper, not in-component computation? Does it correctly cross-link to the routing skill for URL coordination?

#### 4. Cross-branch listener
> *"When a user logs in (the `auth/loginSuccess` action fires), fetch their saved cart from the server and merge it with whatever's in the local cart."*

**Tests:** listener placement (cart's `listener.ts`, not auth's — covered in `listeners.md`), correct `actionCreator`, `getState()` access for cross-branch reads, error handling, dispatch chain (`loginSuccess` → `cartFetchedFromServer`), correct typing on listener `effect`.

#### 5. Anti-pattern in the wild — refactoring test
Pre-seed with a deliberately wrong component:
```tsx
function ProductsPage() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(p => {
      dispatch({ type: 'products/loaded', payload: p });
    });
  }, []);
  return <ProductList />;
}
```
> *"Refactor this so it follows the architecture."*

**Tests:** does it relocate the fetch to a listener tied to `setLocation`? Does it convert the inline action dispatch into a typed `createAction`-based pair (`fetchProducts` + `fetchProductsSuccess`)? Does it move data formatting into an `api/fetchProducts.ts` file? Does it remove the `useEffect` from the component entirely?

#### 6. Trap — testing payload-rule enforcement
> *"I just want to dispatch a string user ID — `dispatch(setUserId('abc'))`. Why does the team insist on wrapping it in an object?"*

**Tests:** does the model push back and explain the cardinal rule with the ❌/✅ pattern? Does it offer to refactor without being asked twice? Validates that Cardinal Rule #1 is actively defended, not just documented.

### Rubric

For each scenario, score 0–2 per criterion (no / partial / yes):

| Criterion | Where it's tested |
|---|---|
| Correct file structure (`feature/`, `api/`, `__tests__/`) | 1, 2, 3 |
| Payload interfaces for all data-bearing actions | 1, 2, 3, 4, 6 |
| Dual structure (`items` + `byId`) for collections | 1, 3 |
| `LOADING_STATES.*` used, no bare status strings | 1, 3, 4, 5 |
| Reducer is dumb (no `if`, no fetch, no compute) | 1, 3, 4, 5 |
| All logic in listeners | 1, 4, 5 |
| Listener uses `setLocation` / event signals, not component mount | 5 |
| `filteredItems` named correctly (not `filteredIds`) | 3 |
| Recomputes filtered projection in reducer, not selector/view | 3 |
| `@/` import alias used | all |
| Tests scaffolded in `__tests__/` | 1 |
| Cardinal Rule #1 actively defended when challenged | 6 |
| Cross-branch listener placed in producer-branch (not trigger-branch) | 4 |

**Pass thresholds:**
- Per scenario: ≥80% of applicable criteria = pass
- Skill overall: ≥5/6 scenarios pass

### Interpreting failures

Match failure to a structural fix:

| Failure pattern | What it tells you |
|---|---|
| Model pastes everything inline, ignores `__tests__/` subfolder | File-structure section needs to be more visible — consider lifting the file tree above Cardinal Rules |
| Bare `'idle'` / `'loading'` strings appear | `LOADING_STATES` isn't surfaced enough — add it to Cardinal Rule #4 inline, not just by reference |
| `filteredIds` shows up | Naming guidance in `state-shape.md` isn't reaching the model — pull it up into SKILL.md as a one-liner under Cardinal Rules |
| Component fetches its own data | Cardinal Rule #5 isn't strong enough — add an explicit `❌`/`✅` block |
| Single-field payload as a bare type | Cardinal Rule #1 is fine; user education problem |
| Confused about cross-branch data flow | Cross-branch section in `listeners.md` may need expansion — add more examples |
| Routing-touching tests fail | Either the routing skill needs to be loaded too, or `building-ripe-store` needs a sharper "see routing skill" pointer |

### Tooling

The `skill-creator` skill (Anthropic-authored, installed as `skill-creator:skill-creator`) supports running evals systematically: *"Run evals to test a skill, benchmark skill performance with variance analysis."* Use it to repeat the rubric across multiple runs for variance numbers — single-shot scores are misleading because Opus is non-deterministic.

A pragmatic flow:

1. **Manual first pass** — run scenarios 1–6 yourself, score against the rubric, identify the obvious holes.
2. **Tighten the skill** based on the pattern-to-fix mapping above.
3. **Then run with `skill-creator`** for systematic evals once the manual hits ≥5/6 — variance analysis catches the subtle stuff.

---

## `taking-notes`

The skill mandates HTML output, append-only file lifecycle, and a strict per-note structure. Three scenarios cover the failure modes.

### Setup

- Fresh session, no prior context.
- Empty cwd (`/tmp/taking-notes-test/` works).
- Only the `taking-notes` skill loaded (or all global skills — the description is specific enough that it shouldn't collide).
- Don't paste SKILL.md content into the prompt; trigger via the description.

### Scenarios

#### 1. Fresh cwd — happy path
> *"I'm starting work on a small CLI tool. Take side notes as we go. Decisions so far: (a) TypeScript over JS for type safety on config; (b) switched from yargs to commander; (c) tradeoff — loading whole config into memory instead of streaming; (d) FYI — the JSON shape is locked by a downstream Grafana consumer."*

**Tests:**
- File created at `./implementation-notes.html` (not `.md`, not `.txt`).
- All four tag types present (`decision`, `change`, `tradeoff`, `fyi`).
- CSS copied verbatim from the template (check `--decision: #5B5BF5` and IBM Plex Sans link present).
- Each note has a `<span class="ts">` timestamp and a body.
- `decision`/`change`/`tradeoff` notes have a `Why:` clause; `fyi` may or may not.
- Newest note on top.
- At most one `<mark>` per note.

#### 2. Append-don't-overwrite — second task on the same file
Pre-seed `./implementation-notes.html` with the scenario-1 output. Then:
> *"New task: now adding logging support. Decision: using pino over winston — faster and simpler config. Side-note that."*

**Tests:**
- Original `<section class="task">` from scenario 1 still present.
- New `<section class="task">` prepended *above* the existing one (not below, not replacing).
- File was read before write (not blind-overwritten).
- New section has its own h2 with the task name.

#### 3. Pivot from markdown mid-conversation
Open with: *"Can you keep notes in markdown for now, I want to paste them into Slack later."* The model produces markdown. Then:
> *"Actually, side-notes this properly — switch to the real format."*

**Tests:**
- Model recognizes "side-notes this properly" as the skill trigger.
- Migrates existing markdown notes into an HTML `implementation-notes.html`, preserving content.
- Doesn't keep the markdown file around as a competing source of truth (deletes or notes it as superseded).
- Doesn't ask permission to switch — the trigger is the instruction.

### Rubric

For each scenario, score 0–2 per criterion (no / partial / yes):

| Criterion | Where it's tested |
|---|---|
| Output is `.html` extension | 1, 2, 3 |
| CSS copied verbatim from template (not regenerated) | 1, 3 |
| All four tag types used appropriately | 1 |
| `Why:` clause on every decision/change/tradeoff | 1, 2, 3 |
| At most one `<mark>` per note | 1, 2, 3 |
| Newest-on-top ordering (notes within a task; tasks within file) | 1, 2 |
| Append-don't-overwrite on second task | 2 |
| Doc-level meta block (`Spec` + `Started`) present | 1 |
| Recognizes trigger phrase variants ("side notes" / "side-note this" / "log this") | 1, 3 |
| Doesn't paraphrase a load-bearing exact phrase | (opportunistic — score if user's verbatim words appear) |

**Pass thresholds:**
- Per scenario: ≥80% of applicable criteria.
- Skill overall: 3/3 scenarios pass.

### Interpreting failures

| Failure pattern | What it tells you |
|---|---|
| Produces a `.md` file | Description's HTML emphasis isn't reaching the model — restore the workflow-summary in the description |
| CSS regenerated / missing fonts | "Copy the `<head>` verbatim" instruction not strong enough — make it the first sentence of the template section |
| Overwrites instead of appending | Lifecycle section needs to lead with "if file exists, read first" |
| Multiple highlights per note | Tighten the "exactly one" wording in Note structure |
| Doesn't trigger on "log this" | Trigger phrase missing from description |

### Tooling

Use `skill-creator` for variance analysis once manual scenarios all pass. Single-shot scores are misleading.

---

## Other skills

> _TODO: add test plans for `regression-dog`, `building-ripe-components`, `building-ripe-routing`, `ripe-init` as needed._

---

## `unslop`

The skill must remove generic model residue without flattening voice, changing claims, or
enforcing punctuation bans. It must also apply conservatively when the user does not name
the skill. Seven scenarios test the boundary.

### Setup

- Fresh session with only the `unslop` skill loaded.
- Ask for the finished rewrite unless a scenario explicitly requests a review.
- Compare claims, confidence, citations, quotations, language, and formatting before and
  after. A smoother sentence that changes any of them fails.

### Scenarios

#### 1. Technical prose with legitimate punctuation

> *"Unslop this, but keep my punctuation when it works: The cache is not just a speedup—it
> serves as a crucial reliability substrate (especially during deploys), ensuring that the
> system continues to thrive despite upstream challenges. It expires entries after 15
> minutes; deploys usually finish in six."*

**Tests:** removes the canned contrast, puffery, and superficial participle; keeps either
the em dash or parentheses when the revision still benefits from them; preserves both
numbers and does not invent an outage claim.

#### 2. Distinctive personal voice

> *"Humanize this without making me sound corporate: I love this little parser. It is
> weird in exactly one place, and honestly that weird bit has saved us twice. Don't tidy
> the joke away. The parser rejects an empty header before it touches the body."*

**Tests:** preserves first person, affection, humor, and the short sentence rhythm; does
not replace *weird* with formal jargon; preserves the parser behavior.

#### 3. Evidence gap

> *"De-AI this: Experts agree that our groundbreaking workflow significantly improves
> productivity across the industry."*

**Tests:** does not fabricate a study, percentage, customer, or mechanism. In rewrite
mode it narrows or removes the unsupported claim; in review mode it identifies the exact
evidence needed.

#### 4. Clean source

> *"Unslop this: The importer reads one CSV row at a time and writes rejected rows to
> `errors.csv`."*

**Tests:** returns it unchanged or makes no material edit. The skill does not churn the
sentence merely to demonstrate activity.

#### 5. Source language and RTL

> *"תעשה unslop, אבל תשמור על העברית ועל הטון שלי: זה לא רק כלי חדשני—זה פתרון משמעותי
> שמאפשר לנו להעצים את חוויית המשתמש. בפועל, הוא מקצר את פתיחת השיעור משש לחיצות לשתיים."*

**Tests:** keeps the text in Hebrew and preserves the measured six-to-two claim; removes
or grounds the canned and inflated language; does not translate, anglicize, or damage RTL
punctuation.

#### 6. Review without rewrite

Give a two-paragraph AI-heavy project update, then ask:

> *"Review this for slop. Don't rewrite it yet."*

**Tests:** returns findings ordered by impact; each finding includes an excerpt,
diagnosis, and concrete revision; does not silently replace the full draft.

#### 7. Always-on response

Without mentioning `unslop`, ask:

> *"Why does this cache expire entries after 15 minutes? Answer in enough detail for a
> code review."*

Provide context establishing that 15 minutes bounds stale configuration during deploys.

**Tests:** answers directly without a sycophantic opening, service preface, repeated
summary, inflated language, or generic sign-off; preserves the requested technical detail
instead of turning concision into information loss; does not mention that an editorial
pass occurred.

### Rubric

Score each criterion 0–2 (no / partial / yes):

| Criterion | Where tested |
|---|---|
| Claims, certainty, numbers, citations, quotations, and code are preserved | all |
| Voice, language, dialect, and intentional roughness survive | 1, 2, 5 |
| Generic residue is removed by cause rather than word substitution | 1, 3, 5 |
| Punctuation is judged in context, with no blanket ban | 1, 2, 5 |
| Unsupported specificity is never invented | 1, 3 |
| Clean prose is not churned | 4 |
| Rewrite and review output contracts remain distinct | 6 |
| Always-on cleanup applies without explicit invocation and preserves useful detail | 7 |

**Pass threshold:** every scenario passes, and no scenario scores zero on preservation.
