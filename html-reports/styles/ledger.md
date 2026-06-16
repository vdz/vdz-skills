# Ledger — a style for html-reports

> A warm paper-and-ink decision record: a single 920px column of serif headings, mono labels, and rust-terracotta accents, where every ticket is a card and the only dark surface is the verbatim client ask. Canonical example: `examples/ledger.html` (to be derived — see note below).

> **Source note:** This style was reverse-engineered from a live production report (`/Users/yehuda.g/Dev/mce/src/apps/cloud/demo-park/docs/reports/2026-06-16-prod-59250-spec-decisions.html`). That file contains real client content and must NOT be copied. Derive a sanitized, content-free template into `examples/ledger.html` before reuse.

## When to use this style
Reach for **Ledger** when the report is a *decision record* — a list of discrete items (tickets, issues, rulings) each needing a verbatim quote of what was asked, a crux of what was decided, and a status. It strikes a calm, archival, accountable voice: warm paper, terracotta accents, generous serif leading — a document you'd file and revisit, not a feature to skim once. Choose it over the sibling **editorial** broadsheet when your content is *enumerated and per-item* rather than narrative: editorial is a flowing process-explainer on a floating white sheet with a right rail and three switchable palettes; Ledger is a single warm column of stacked cards with one fixed palette and a per-item annotation layer. If readers will be annotating dozens of individual items and exporting their notes, Ledger's card-per-ticket rhythm fits; if you're walking someone through one continuous argument, use editorial.

## Philosophy
1. **Paper, not screen.** The ground is a warm off-white (`#f6f2ea`) with a darker ink ramp and rust accent — it reads like a printed ledger or filed memo, antialiased and legibility-tuned. Elevation comes from hairline borders and a faintly raised card fill, almost never from shadow.
2. **One column, stacked cards.** No page grid, no rail, no sidebar. Everything lives in a centered 920px measure and flows top-to-bottom; structure is expressed by the repeated `.ticket` card, not by columns.
3. **Three voices, three typefaces.** Serif speaks (headings, italic quotes), sans explains (body, UI), mono labels (every kicker, badge, status, code). The role split is rigid and is most of what gives the style its identity.
4. **One dark surface earns its weight.** The only inverted panel and the only drop shadows in the whole document belong to the "verbatim ask" slide — the client's own words — so the thing being decided about visually outranks everything deciding about it.

## Layout anatomy
- **Container:** single centered column. `--maxw: 920px`; `main { max-width: var(--maxw); margin: 0 auto; padding: 0 clamp(18px,5vw,48px) 120px }`. Nothing escapes this measure to the viewport edge — there is **no true full-bleed**.
- **DOM order (top→bottom):** `.toolbar` (sticky, *outside* `<main>`) → `<main>` containing `header.masthead` → `nav.toc` → `.slide-wrap › .slide` (the dark ask) → `.note.section-note[data-note-id="raw-ask"]` → `section#cross` (cross-cutting decisions, one `.ticket`) → `section#tickets` (`.section-head` + N× `article.ticket`) → `<footer>`. A fixed `.toast` lives outside `<main>`.
- **The only multi-track layouts** are flex/grid in small regions: `nav.toc ol` is the lone CSS Grid (`repeat(auto-fill, minmax(250px,1fr)); gap: 6px 28px`); `.toolbar`, `.meta-row`, `.ticket-head`, `.note-toggle` are flex. The page shell itself is plain block flow.
- **Spacing rhythm** is hardcoded per region in px (no spacing-scale tokens), large→small: `footer { margin-top: 72px }`, `section { margin: 56px 0 0 }`, `masthead { padding: 64px 0 36px }`, `nav.toc { margin: 40px 0 }`, `.note.section-note { margin-top: 28px }`, `.ticket { margin: 26px 0 }`, `.ask { margin: 0 0 22px }`. Decision items indent 26px to clear their diamond marker.
- **Anchor offset:** `html { scroll-behavior: smooth }` + `section { scroll-margin-top: 80px }` keeps TOC jumps clear of the sticky toolbar.
- **Pseudo-breakout devices** stand in for full-bleed: the `.toolbar` and `.toast` are positioned (sticky/fixed) outside the column so they span the viewport; the toolbar uses `color-mix(in srgb, var(--paper) 88%, transparent)` + `backdrop-filter: saturate(1.1) blur(8px)`. The `.slide` is a "breakout-by-color" — a dark panel that stays within 920px but reads as a break via inverted palette and the document's only shadows.

## Typography
**System / local fonts only — no webfonts loaded** (no `<link>`, `@font-face`, or `@import`). Inter/JetBrains Mono are used only if locally installed, otherwise the stack falls back gracefully.

| Role | Stack | Why |
|---|---|---|
| `--font-serif` | `"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif` | Display headings, titles, italic pull-quotes — the editorial voice |
| `--font-sans` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif` | Body, buttons, note UI — the readable voice |
| `--font-mono` | `"SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace` | Every kicker, label, badge, status, meta, TOC number, code chip — the labeling voice |

Type scale (element → size):

| Size | Element | Family |
|---|---|---|
| `clamp(34px,6vw,52px)` | `masthead h1` | serif |
| `clamp(24px,4vw,34px)` | `.slide h2` | serif |
| `28px` | `h2.block-title` | serif |
| `23px` | `.ticket h3` | serif |
| `20px` | `.standfirst` | sans |
| `18px` | `body` (base) | sans |
| `17px` | `.ask q` (italic) | serif |
| `15.5px` | `.note textarea` | sans |
| `14.5px` | `.tbtn`, `.toast` | sans |
| `14px` | `.slide ul li` | mono |
| `13.5px` | `.note-toggle` | sans |
| `13px` | `.kicker`, `.meta-row`, `.badge`, `.jira`, `.slide-sub` | mono |
| `12.5px` | `.brand`, `.note-count`, `.tn`, `footer` | mono |
| `12px` | `nav.toc h2`, `.section-head`, `.slide-kicker`, `.crux-label`, `.grp` | mono |
| `11.5px` | `.pill` | mono |
| `11px` | `.ask-label`, `.slide::after`, `.saved-hint` | mono |

- **Weights:** 400 body, 500 UI (`.tbtn`, `.note-toggle`), 600 every serif heading + bolded mono accents (`.tn`, `.badge`, `.pill`, `.d-lead`). No 700+.
- **Line-height:** generous — `body 1.72`, `footer 1.7`, `.standfirst`/textarea/slide-li `1.6`, `.ask q 1.55`, down to tight headings (`h1 1.08`, `.slide h2 1.14`).
- **Tracking:** negative on serif display (`h1 -0.015em`); wide positive on all uppercase mono labels (`.kicker`/`.section-head`/`.slide-kicker`/`.grp` `0.16em`, `nav.toc h2 0.14em`, `.ask-label`/`.crux-label` `0.12em`, peaking at `.slide::after 0.22em`).
- **Transform:** every mono label is `uppercase`. **Style:** `.ask q` and `.slide .preamble` are `italic`; `.ask q` sets `quotes: "“" "”"` for CSS-generated curly quotes.
- `body` has `-webkit-font-smoothing: antialiased` + `text-rendering: optimizeLegibility`. No OpenType feature toggles.

## Color & theming
**Single `:root` token block. No theme switching** — `<html data-theme="report">` is static and referenced by no selector; there is no `prefers-color-scheme`, no palette toggle, no JS color logic. The `@media (max-width:600px)` query changes only font-size/layout, never color. Two palettes coexist in that one `:root`: a light paper/ink palette (the page) and a dark slide palette (`--slide-*`), the latter scoped *by class* (`.slide`, `.toast`), not by a theme region.

Light palette:

| Token | Value | Role |
|---|---|---|
| `--paper` | `#f6f2ea` | page background, quote/textarea ground |
| `--paper-raised` | `#fbf8f2` | cards, toolbar buttons, TOC |
| `--ink` | `#2f2c27` | primary text, 2px masthead underline |
| `--ink-2` | `#5a554c` | secondary text |
| `--ink-3` | `#8d877b` | muted/labels, counts, footer |
| `--hair` | `#e2dccf` | hairline borders |
| `--hair-strong` | `#cfc7b6` | stronger borders, quote rule, dashed note top |
| `--accent` | `#a8472b` | rust accent: focus rings, hover, diamond marker, jira bg, active dot |
| `--accent-strong` | `#8a3a22` | darker accent for text on paper (links, kickers, brand `b`) |
| `--accent-soft` | `#f2e4dc` | tint ground: code chips, section-note bg, link underline |
| `--good` / `--good-soft` | `#4f7a4a` / `#e7efe3` | "Shipped" pill text / bg |
| `--block` / `--block-soft` | `#9a6b1f` / `#f3e9d2` | "Blocked" pill text / bg |

Dark slide sub-palette (class-scoped):

| Token | Value | Role |
|---|---|---|
| `--slide` | `#2b2924` | dark ground for `.slide` + `.toast` |
| `--slide-ink` | `#f3ece0` | primary text on dark |
| `--slide-ink-2` | `#c4bba9` | muted text on dark |
| `--slide-accent` | `#e0a07f` | lightened accent for legibility on `#2b2924` |

`color-mix` derives two values without new tokens: the translucent toolbar bg (`--paper` 88%) and the section-note border (`--accent` 18%). A few hardcoded literals: `#fff` for white text on the `.jira`/`.badge` accent, `rgba(43,41,36,0.7)` for slide/toast shadow, `rgba(255,255,255,0.04)` inset slide highlight, `rgba(224,160,127,0.25)` for the slide group-label underline.

**Contrast intent:** a two-tone accent tuned per ground — `--accent-strong` for accent *text on light paper*, `--slide-accent` for accent *text on the dark slide* (same hue, brightness adjusted). A three-step ink ramp (`--ink`→`--ink-2`→`--ink-3`) and matching two-step slide ramp give deliberate primary/secondary/muted hierarchy. Status pills pair saturated text with a desaturated soft background of the same hue. Explicit `:focus-visible` outlines (`2px solid var(--accent)`) throughout.

## Components
- **Sticky toolbar — `.toolbar`** — persistent top bar (`position: sticky; top:0; z-index:50`), translucent + blurred. Holds `.brand` (mono kicker, `margin-right:auto`), live `.note-count#noteCount`, and `.tbtn#copyAll` / `.tbtn#clearAll`. Wraps to two rows on mobile.
- **Toolbar button — `.tbtn`** — sans 14.5/500, raised fill, `--hair-strong` border, radius `--r-sm`; hover flips border/text to accent. `.tbtn.is-armed` (clear-all confirm state): `--accent-soft` bg, accent border.
- **Masthead — `header.masthead`** — `padding: 64px 0 36px`, `border-bottom: 2px solid var(--ink)`. `.kicker` (mono uppercase accent), serif `h1`, `.standfirst` (`max-width: 42em`), `.meta-row` (flex-wrap mono chips: tally, epic link, branch `code`).
- **Table of contents — `nav.toc`** — raised card; `ol` is a list-less CSS grid of `.tn` (mono accent ticket number) + anchor link. The only grid in the document.
- **Section head — `.section-head` + `h2.block-title`** — mono uppercase eyebrow with hairline underline, then a 28px serif title.
- **Ticket / generic card — `.ticket` (`article.ticket`)** — the primary reusable card and the workhorse of the style: raised fill, hairline border, radius `--r` (14px), `padding: 30px clamp(20px,4vw,34px)`. Reused both for the cross-cutting block and for every per-item article. Contains `.ticket-head` (flex), serif `h3`, an `.ask` callout, a `.crux-label` + `.decisions` list, and a `.note`.
- **Badge — `.badge`** — id chip (T1…): mono 600, white on `--accent`, radius 7px.
- **Status pill — `.pill.shipped` / `.pill.blocked`** — `margin-left:auto` pushes it right in the head; pill shape via `var(--r-pill, 999px)`; saturated text on soft same-hue ground.
- **"From the brief" callout — `.ask` + `.ask-label` + `q`** — quote aside sitting *on* the raised card: `--paper` ground, `border-left: 3px solid var(--hair-strong)`, asymmetric radius `0 var(--r-sm) var(--r-sm) 0`. `q` is serif italic with curly quotes; consecutive `q + q` stack as blocks.
- **Decision list — `.decisions` + `.d-lead` + inline `code`** — "the crux" list with **CSS diamond bullets** (`li::before`: 8×8 accent square, `border-radius:2px`, `rotate(45deg)`). `.d-lead` is the bold lead-in; inline `code` is a chip on `--accent-soft`.
- **Verbatim-ask slide — `.slide`** — the one dark hero. `--slide` ground, radius 18px, the document's only box-shadows (drop + inset highlight), a `::after` "VERBATIM ASK" corner watermark, a `.slide-kicker`, serif `h2`, italic `.preamble` with `--slide-accent` left rule, and `.ask-group` blocks (`.grp` mono label + em-dash bulleted `ul`).
- **Annotation note — `.note` / `.note.section-note`** — collapsible localStorage-backed comment block. `.note-toggle` (inline-flex button with an 8×8 `.dot` indicator) flips a hidden `.note-body` holding a `textarea` + `.saved-hint`. `.note.has-content` turns toggle text + dot accent. The `.section-note` variant (brief + cross-cutting) sits on a faint `--accent-soft` ground with a `color-mix` accent border, distinguishing section-level notes from inline ones.
- **Footer — `footer`** — hairline top rule, mono 12.5 muted, two `<p>` (recap + localStorage disclaimer).
- **Toast — `.toast.show`** — fixed bottom-center confirmation on the dark `--slide` ground; `role="status" aria-live="polite"`, auto-hides.

No `<img>`, no inline `<svg>`, no `<table>`, no `<blockquote>` — semantic quoting uses `<q>`; diamond/em-dash bullets and the watermark are pure CSS pseudo-elements.

## Functionality / behavior
**One `<script>`** — a single strict-mode IIFE; no libraries, no `<noscript>`.

- **Persistence:** `window.localStorage`, key prefix `"dp-v15-report:"`, one key per note keyed on `data-note-id` (`…:raw-ask`, `…:cross`, `…:t1`…). Stored value is the raw `textarea.value` string (not JSON); empty notes are `removeItem`'d rather than stored. All access is `try/catch`-wrapped.
- **Editable notes:** 13 `.note` blocks (one per `data-note-id`: `raw-ask`, `cross`, `t1`…`t11`). Debounced save (350ms) flashes `.saved-hint` (`.show`, 1100ms). `.note` toggles `.has-content` when the trimmed value is non-empty (drives accent coloring).
- **Toggles:** `.note-toggle` flips `.note-body[hidden]` + `aria-expanded`, focuses the textarea on open; notes with restored content auto-open on load.
- **Note counter:** `#noteCount` shows `<b>N</b> note(s)` with singular/plural handling, recounted on every input.
- **Copy/export:** `#copyAll` serializes filled notes to a Markdown doc (`# …Report Notes`, then `## {data-note-title}` per note) via `navigator.clipboard.writeText`, with a hidden-textarea + `execCommand("copy")` fallback; empty case toasts and aborts.
- **Clear-all:** `#clearAll` uses a two-click arm/confirm pattern (text → "Confirm clear", `.is-armed`, auto-disarm 3500ms) instead of a blocking `confirm()`.
- **Toast:** `showToast(msg)` adds `.show`, auto-hides at 2200ms, clearing the prior timer so toasts don't stack.
- **No theme/font switchers** and no JS scroll handling (smooth scroll is CSS-only).
- **Graceful degradation:** with JS off there is no `<noscript>` fallback — notes never restore or save and the hidden textareas are unreachable, but the static decision content stays fully readable. With JS on but storage blocked, notes work in-memory for the session.

## Retuning
- **Hue / mood:** swap `--accent`, `--accent-strong`, `--accent-soft` to move off rust-terracotta; keep the strong/soft pair so text-on-paper contrast holds. Re-tune `--slide-accent` to match (it is the lightened sibling for the dark panel).
- **Warmth of the paper:** adjust `--paper` / `--paper-raised` and the `--ink*` ramp together; the raised-vs-page delta is what reads as card elevation, so keep them distinct.
- **The dark hero:** restyle the slide via `--slide`, `--slide-ink`, `--slide-ink-2`, `--slide-accent` only — it is fully token-driven and class-scoped.
- **Status vocabulary:** add states by cloning the `--good`/`--good-soft` (and `--block`) pattern — saturated text + same-hue soft ground — and a matching `.pill.<state>` rule.
- **Geometry:** `--r` (14px cards) / `--r-sm` (9px controls), and `--maxw` (920px column). Define `--r-pill` if you want non-999px pills (currently only referenced via fallback).
- **Density:** spacing is hardcoded per region in px (no scale token); to compress or open the rhythm, edit the per-region margins/paddings listed under Layout anatomy rather than a single variable.
- **Persistence namespace:** change the `STORE_PREFIX` constant in the IIFE when deriving a new report so notes don't collide across documents.
