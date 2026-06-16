# Choosing structure & tooling

> Read this when starting a report and the *shape* isn't obvious. It decides the two
> things a style can't decide for you: how the content is **organized** internally,
> and which **interactions** it earns. Style (the look) follows from these.

The order is always: **job → organization → tooling → style**. A beautiful style on
the wrong organization is still hard to read; the right organization in plain CSS is
already legible. So spend the first decision here, not on the palette.

## 1. What is the report's job?

Ask one question: *what does the reader do with this?* The answer picks the organization.

| The reader needs to… | Organization | Why |
|----------------------|--------------|-----|
| Follow how something works, start to finish | **Narrative / linear** | One continuous thread; sections build on each other. |
| Look up / account for individual items | **Enumerated / per-item** | Each item is a self-contained, addressable unit. |
| Weigh options against each other | **Side-by-side / comparative** | Differences only read when aligned in parallel columns. |
| Understand how parts relate in space | **Spatial / diagram** | Boxes-and-arrows; flattening to prose loses the structure. |
| See what happened when | **Timeline / temporal** | Order and gaps in time *are* the information. |
| Scan many rows of like-shaped data | **Tabular** | Dense, sortable, comparable; the grid is the point. |
| Be walked through slide-by-slide | **Sequential / deck** | One idea per view, advanced deliberately. |

A report can nest these (a narrative report with one comparative table inside), but it
has **one dominant** organization. Name it before writing.

## 2. Which interactions does it earn?

Default to **none**. A report that is only read needs no JS at all. Add an affordance
only when the reader will actually *do* the thing it enables. Each maps to a snippet in
[`tooling.md`](tooling.md).

| Affordance | Add it when… | Skip it when… |
|------------|--------------|---------------|
| **Inline notes** | The reader reviews and reacts (decisions, reviews, triage). | Pure reference they won't annotate. |
| **Copy / export** | Content gets carried elsewhere — into a PR, a ticket, a doc. | Self-contained read. |
| **Theme switch** | Read in varied light (shared link, presented + read later). | Single controlled context. |
| **Collapsibles** | Long detail most readers skip but some need (logs, full diffs). | Everything is meant to be read. |
| **TOC / scrollspy** | Long enough that readers jump (> ~5 sections). | Short, read straight through. |
| **Tabs** | Parallel variants of one thing (per-language code, before/after). | Content read in sequence. |
| **Editable fields / toggles** | The report is also a tool (flag editor, prompt tuner, triage). | Static record. |
| **Drag-to-reorder** | The reader's ordering is an output (prioritization, planning). | Order is fixed/authoritative. |

**Discipline:** every interaction is a maintenance and clutter cost. Three well-chosen
affordances beat ten. If you can't name the reader action, drop it.

## 3. Map to a style

Organization + tooling usually implies the style outright:

- **Narrative / linear, walked-through** → **Editorial** (rail + main grid, step rhythm,
  switchable palettes). Notes + copy + theme fit naturally.
- **Enumerated / per-item, accountable** → **Ledger** (one column of cards, per-item note
  layer). Notes + copy-all are its native tooling.
- **Comparative, spatial, timeline, tabular, deck** → no dedicated style yet. Start from
  the closest existing style's `<head>` (Editorial for narrative-ish, Ledger for
  item-ish), compose the needed component, and if it's a shape you'll reuse, **promote it
  to a new style** (see SKILL.md → *Adding a new style*) rather than leaving a one-off.

When the content shape and the style disagree, trust the **organization** — it's what the
reader feels. See [`example-map.md`](example-map.md) for ~20 worked need→style→tooling rows.
