# Example map

> A lookup table from *what you're making* to its **organization**, a starting **style**,
> and the **tooling** it earns. Use it after [`choosing.md`](choosing.md) when you want a
> concrete precedent instead of reasoning from scratch.

The categories follow Thariq Shihipar's
[html-effectiveness](https://thariqs.github.io/html-effectiveness/) survey of what HTML
artifacts are good for. His thesis is the same as this skill's: **spatial information —
diffs, diagrams, layouts, comparisons — gets harder to process when flattened into linear
chat or markdown**, and a self-contained HTML file (no build, no deps) is the right medium
to preserve it. Each row below is a kind of artifact that survey identifies; the right
three columns are how this skill builds it.

Styles: **Editorial** and **Ledger** exist today; **(new)** means there's no dedicated
style yet — start from the noted base and promote it if you'll reuse the shape.

## Exploration & planning

| Artifact | Organization | Style | Tooling |
|----------|--------------|-------|---------|
| Three code approaches (trade-offs) | Side-by-side | **(new)** from Editorial | Tabs per approach, copy-code, notes |
| Visual design directions | Side-by-side | **(new)** from Editorial | Tabs/gallery, theme switch |
| Implementation plan (timeline + risks) | Narrative + timeline + table | **Editorial** | TOC, collapsible detail, notes |

## Code review & understanding

| Artifact | Organization | Style | Tooling |
|----------|--------------|-------|---------|
| Annotated pull request (diff + margin notes) | Spatial (diff) + per-item | **(new)** from Ledger | Inline notes, severity badges, collapsible hunks |
| PR writeup for reviewers (motivation, before/after, file tour) | Narrative | **Editorial** | TOC, tabs for before/after, copy |
| Module map (boxes + arrows, hot paths) | Spatial (diagram) | **(new)** SVG-first | Clickable nodes, collapsible legend |

## Design

| Artifact | Organization | Style | Tooling |
|----------|--------------|-------|---------|
| Living design system (swatches, tokens) | Tabular + spatial | **(new)** | Copy-token, theme switch |
| Component variants (states × sizes contact sheet) | Tabular / grid | **(new)** | Theme switch, copy |

## Prototyping

| Artifact | Organization | Style | Tooling |
|----------|--------------|-------|---------|
| Animation sandbox (tunable sliders) | Spatial + controls | **(new)** | Editable fields/sliders, live render |
| Clickable flow (linked screens) | Spatial / deck | **(new)** | In-page navigation, deck keys |

## Illustrations & diagrams

| Artifact | Organization | Style | Tooling |
|----------|--------------|-------|---------|
| SVG figure sheet | Spatial | **(new)** SVG-first | Minimal; maybe copy-SVG |
| Annotated flowchart (clickable steps) | Spatial (diagram) | **(new)** | Clickable steps, collapsible notes |

## Decks

| Artifact | Organization | Style | Tooling |
|----------|--------------|-------|---------|
| Arrow-key slide deck | Sequential / deck | **(new)** | Keyboard nav, progress, theme switch |

## Research & learning

| Artifact | Organization | Style | Tooling |
|----------|--------------|-------|---------|
| How a feature works | Narrative | **Editorial** | Collapsibles, tabbed code, TOC, notes |
| Concept explainer (interactive viz + glossary) | Narrative + spatial | **Editorial** | Live viz, glossary tooltips, notes |

## Reports

| Artifact | Organization | Style | Tooling |
|----------|--------------|-------|---------|
| Weekly status (charts) | Narrative + tabular | **Editorial** | Inline charts (SVG), copy, theme |
| Incident timeline / post-mortem | Timeline | **(new)** from Ledger | Timeline, collapsible detail, copy-all |
| Spec-decision record (per decision) | Enumerated / per-item | **Ledger** | Per-item notes, copy-all, status badges |
| Process / flow explainer | Narrative | **Editorial** | Notes, copy-all, theme switch |

## Custom editing interfaces

| Artifact | Organization | Style | Tooling |
|----------|--------------|-------|---------|
| Ticket triage board | Enumerated / kanban | **(new)** from Ledger | Drag-to-reorder, editable, markdown export |
| Feature flag editor | Tabular | **(new)** | Toggles, dependency warnings, export |
| Prompt tuner | Side-by-side | **(new)** | Editable template, live render, copy |

## How to read this

- **Two styles do a lot.** Most narrative reports are Editorial; most enumerated/
  accountable ones are Ledger. Reach for those first.
- **(new) is a prompt, not a blocker.** Build it from the nearest base `<head>`, get it
  right once, then codify it as a real style so the next one is a copy, not a rebuild.
- **The tooling column is a ceiling, not a checklist.** Add only what the reader will use
  (see [`choosing.md`](choosing.md) §2); the implementations are in [`tooling.md`](tooling.md).
