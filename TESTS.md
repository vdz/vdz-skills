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

## Other skills

> _TODO: add test plans for `regression-dog`, `building-ripe-components`, `building-ripe-routing`, `ripe-init` as needed._
