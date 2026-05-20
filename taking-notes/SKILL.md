---
name: taking-notes
description: Use when the user says "side notes", "side-note this", "log this", "take a note", "running notes", "keep notes as we go", or otherwise asks for a running log of decisions, changes, tradeoffs, or FYIs captured alongside the actual implementation work.
---

# Taking Notes

A running journal of **decisions, changes, tradeoffs, and FYIs** captured *alongside* the real work. Output is a single self-contained HTML file in the cwd, append-only, newest on top.

## Output is always HTML

The format is HTML — not markdown, not chat, not `.txt`. The color-coded pill tags, `<mark>` highlights, and dotted-paper styling are load-bearing; markdown loses them.

Use `implementation-notes.html` in this skill directory as the starting template. **Copy its `<head>` (the whole `<style>` block) verbatim** — do not regenerate the CSS.

## File location & lifecycle

`./implementation-notes.html` in the cwd. One cumulative file per project.

- **New task** → prepend a new `<section class="task">` to the top of `<body>`.
- **New note within a task** → prepend a new `<li class="note">` to the top of `<ul class="notes">`.
- **File exists** → read, prepend, write. Never overwrite.

## Tags

Four tags, color-coded. The pill class is the tag name lowercased.

| Tag | When | Pill |
|---|---|---|
| `decision` | A choice that closes alternatives. | indigo |
| `change` | A material edit to the design or artifact (presupposes an earlier state). | amber |
| `tradeoff` | A knowingly-imperfect choice — cost X accepted for benefit Y. | red |
| `fyi` | Context the future reader needs but isn't a decision. | gray |

`decision` vs `change`: if there's nothing being changed *from*, it's a `decision`.

See the template HTML for live examples of all four.

## Note structure

```html
<li class="note">
  <span class="ts">2026-05-19 14:24</span>
  <span class="tag decision">decision</span>
  <div class="body">
    Did the thing. <mark>One key phrase per note</mark> wrapped in <code>&lt;mark&gt;</code>. <span class="why">Why: the reason, in italics, as a trailing clause.</span>
  </div>
</li>
```

- **Timestamp:** `YYYY-MM-DD HH:MM` local.
- **Body:** 1–3 sentences. Wrap *exactly one* phrase in `<mark>` — the phrase that alone tells a skimmer what this note is. More than one defeats the highlight.
- **Why clause:** prefix with `Why:`, wrap in `<span class="why">`. Required on every `decision`, `change`, and `tradeoff`. If there's no why, the note is probably a `fyi`.

### Inline elements

- `<mark class="alarm">` — pink-tinted, for urgent / blocking / "this will bite us". Use sparingly.
- `<q class="verbatim">` — when the user's exact phrasing IS the decision (e.g. <q class="verbatim">just ship it and we'll see</q>). Paraphrasing loses fidelity; quote them.

## Doc-level meta

The header `<dl class="doc-fields">` has at least:
- **Spec** — link to the file / PR / issue the notes belong to.
- **Started** — date the notes began.

## Capture cadence

Add a note **the moment a decision/change/tradeoff/fyi occurs in the conversation** — not at the end of the task. Late-batched notes lose the why and become a summary, not a log.

## When NOT to use

- One-off questions with no implementation arc.
- Pure code-review / PR-review tasks — the review IS the log.
- The user explicitly asks for markdown instead.

## Common mistakes

| Mistake | Fix |
|---|---|
| Produced markdown instead of HTML | Re-do in HTML. The CSS is load-bearing. |
| Multiple `<mark>` highlights per note | One phrase max — if everything's highlighted, nothing is. |
| Batched all notes at the end | Notes go in *when the decision happens*. |
| Decision/change/tradeoff without a `Why:` | Add the why, or downgrade to `fyi`. |
| Overwrote the existing file | Read → prepend → write. |
| Paraphrased a load-bearing exact phrase | Use `<q class="verbatim">`. |
