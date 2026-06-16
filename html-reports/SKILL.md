---
name: html-reports
description: Use when the user wants a single, self-contained, *beautiful* HTML report — phrases like "make an HTML report", "write this up as a report", "a process/flow explainer", "a decision record / spec-decision report", "a shareable write-up of what we did and why". Triggers when the deliverable is a polished standalone .html document (one file, no build, opens in any browser) meant to be read and kept, not a dashboard or a slide deck.
---

# HTML Reports

## Overview

Produce **one self-contained `.html` file** — all CSS and JS inline, no build step,
no external assets except (optionally) a Google Fonts link — that a person opens
in a browser, reads top to bottom, and files away. The bar is *beautiful*: a
considered typographic system, a fixed emphasis vocabulary, and a couple of
tasteful interactions (notes, copy, theme), never a generic Bootstrap page.

**Core principle:** the look is a *system*, not ad-hoc CSS. Every report is one of
a small set of named **styles**; each style is a complete, documented design
(tokens + layout + components + behavior). You pick a style, copy its canonical
HTML, keep the `<head>` verbatim, and replace the body with your content. You do
not hand-write styles or invent a new look per report.

## The styles

Each style is a full design with its own spec under [`styles/`](styles/) and a
working example under [`examples/`](examples/). Read the chosen style's spec
before writing — it names every token and component so you reproduce, not reinvent.

| Style | Character | Canonical example | Design spec |
|-------|-----------|-------------------|-------------|
| **Editorial** | Literary broadsheet: serif-display masthead, a white sheet floating on a dotted ground, a right-aligned rail + main grid, switchable palettes. Webfonts. | [`examples/process-explainer.html`](examples/process-explainer.html) | [`styles/editorial.md`](styles/editorial.md) |
| **Ledger** | Warm paper-and-ink decision record: one 920px column of stacked ticket cards, system fonts, one fixed palette with a single dark "verbatim ask" panel. | [`examples/ledger.html`](examples/ledger.html) | [`styles/ledger.md`](styles/ledger.md) |

### Picking a style

- **Narrative, walked-through, one continuous argument** (a process/flow explainer,
  an onboarding, a how-it-works) → **Editorial**. Its rail + diagram + step rhythm
  carries a reader through a sequence.
- **Enumerated, per-item, accountable** (a decision record, a spec-decision report,
  a list of tickets/rulings each with a verbatim ask → crux → status) → **Ledger**.
  Its card-per-item rhythm and per-item note layer fit a document you file and revisit.

When the user names a style, use it. When they don't, infer from the content shape
above and say which you chose.

## The artifact

One `.html` file at a path the user names (or a sensible default like
`./report.html` or alongside the relevant docs). It is **self-contained**: opening
the file is the only step to view it. All interactive state persists in
`localStorage` under a single per-report key prefix — so a reader's notes/choices
survive a reload but never touch a server.

## Workflow

1. **Pick the style** (above). If unsure between two, ask; otherwise choose and say so.
2. **Read that style's spec** in [`styles/`](styles/) — it is the source of truth for
   the *why* and names every token/component. Skim the canonical example's `<head>`.
3. **Copy the canonical HTML** for that style as your starting point. Keep the entire
   `<head>` (the `<style>` block, the fonts link, the tokens) **verbatim** — do not
   edit tokens or restyle. The CSS is the source of truth for the look.
4. **Replace the body content** with the user's material, reusing the style's existing
   components (cards, callouts, steps/tickets, code blocks, notes). Don't introduce
   new components or colors; compose from what the style already defines.
5. **Rename the storage key prefix** so a new report's notes don't collide with another's.
6. **Verify in a browser** before declaring done — render it, check it reads top to
   bottom, and confirm the interactions (notes save, copy, theme switch) work.

## Discipline

- **One style per report.** Don't mix Editorial's rail with Ledger's cards.
- **Keep the `<head>` verbatim.** Retune only via the documented tokens (see each
  spec's *Retuning* section), never by hand-writing one-off CSS in the body.
- **Compose, don't invent.** Every block you need already exists in the style; if it
  truly doesn't, add it to the style's spec + example, not as a body-local hack.
- **Self-contained, always.** No external JS/CSS, no server. A Google Fonts `<link>`
  is the only allowed remote dependency (Editorial uses one; Ledger uses none).
- **Never copy a source report's real content into a template.** Templates are
  content-free; live reports get real content but a fresh storage prefix.

## Adding a new style

A style is captured by reverse-engineering a report you like into a spec under
`styles/` (same 8-section template the existing specs use: *When to use ·
Philosophy · Layout · Typography · Color & theming · Components · Functionality ·
Retuning*) plus a sanitized, content-free example under `examples/`. Keep the two
styles' specs structurally parallel so they can be compared at a glance.
