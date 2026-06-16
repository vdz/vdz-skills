# Editorial — a style for html-report

> A literary broadsheet: a serif-display masthead and a warm dotted-paper ground
> with a single white "sheet" floating on it. Reads like a printed explainer or
> a feature spread, not a dashboard. Canonical example:
> [`examples/process-explainer.html`](../examples/process-explainer.html).

## When to use this style

Reach for **Editorial** when the report is meant to be *read*, top to bottom, by
a person who wasn't in the room — a process/flow explainer, a decision narrative,
an onboarding walk-through. It rewards prose, numbered steps, diagrams, and a
calm authorial voice. Its signature move is a **right-aligned rail** carrying
numbers/actors/asides beside a fixed-width main column, so the page reads like a
margin-annotated manuscript. Prefer the sibling style when the content is denser
and more tabular/technical and wants a tighter, less "printed" feel.

## Philosophy

1. **A printed page, not a screen.** A floating paper sheet on a dotted ground,
   serif body, old-style figures, hanging punctuation — the warmth is the point.
2. **One rhythm governs everything.** A single vertical step (`--space`) and its
   integer multiples set every gap. Nothing is spaced by eye.
3. **The dark is reserved.** Color is muted-constructivist ink on paper; the only
   dark surface in the whole report is a code panel, so code reads as a deliberate
   "fly-out" rather than decoration.
4. **Quiet chrome, loud content.** Labels/kickers/meta are small uppercase mono in
   muted ink; the serif display and the one highlight per block carry the eye.

## Layout anatomy

- **Ground** — `body` paints `--ground` plus a `radial-gradient` dot grid
  (`background-size:22px 22px`); the dotted page sits *behind* everything.
- **Sticky `.bar`** — a translucent utility strip (`backdrop-filter:blur`) holding
  the doc id (left) and a right-aligned `Copy all notes` button.
- **`.sheet`** — the white page: `max-width:calc(var(--rail-w) + var(--gutter) +
  var(--main-w) + 6rem)`, `margin:var(--s-2xl) auto`, `border-radius:3px`, a soft
  contact shadow, and `padding:var(--sheet-pad-y) var(--sheet-pad-x)`.
- **`.doc` grid** — `grid-template-columns:var(--rail-w) var(--main-w)`
  (`8.5rem` rail + `55rem` main), `column-gap:var(--gutter)`, `row-gap:var(--section)`.
  Each `.row` is `display:contents`; `.rail` is `text-align:right` muted ink,
  `.main` is the prose column. `.full` spans `1 / -1` for breakout blocks.
- **Vertical flow** — siblings inside `.main` get exactly one `margin-top:var(--space)`;
  rail items get `--rhythm/3`. The grid `row-gap` handles between-section space.
- **Full-bleed** — the footer breaks out with negative margins equal to the sheet
  padding tokens; `figure.swim` is laid *wider* than the sheet
  (`margin-left:50%; width:min(92vw,1240px); transform:translateX(-50%)`) to bleed
  past both edges.

### Rhythm & spacing tokens

`--rhythm:1.85rem` is the unit. `--space:calc(rhythm*1.25)` is the base block step;
`--section:calc(space*2)` is the grid row gap. The `--s-xs … --s-2xl` ramp
(`.5 / .75 / 1 / 1.5 / 2 / 3 ×` rhythm) covers padding. Measure tokens:
`--rail-w:8.5rem`, `--main-w:55rem`, `--gutter:2.25rem`, `--notes-w:40%`.

## Typography

| Role | Stack (`--token`) | Why |
|------|-------------------|-----|
| Display | `--serif-display` = `"Literata"` (Georgia fallback) | Masthead/headings; set at weight **900** for a heavy printed feel. |
| Body | `--serif-text` = `"Source Serif 4"` → Iowan/Georgia | Reading text; its italic carries `.action`/notes/`.raw-ask` quotes. |
| Mono | `--mono` = JetBrains Mono (Nerd Font first) | All chrome: kickers, labels, meta, code, tool UI. |

Loaded via one Google Fonts `<link>` with several variable serif faces (Literata,
Source Serif 4, plus switcher candidates Fraunces / Playfair / Newsreader /
Bodoni Moda) and JetBrains Mono. `body` enables `font-feature-settings:"onum","liga","kern"`
(old-style figures) and `hanging-punctuation`.

| Element | Size / weight | | Element | Size / weight |
|---|---|---|---|---|
| `h1.title` | 4.25rem / 900 | | body | 1.1875rem, lh `--rhythm` |
| `h2` | 2.65rem / 900 | | `.standfirst` | 1.34rem |
| `h3` | 1.8rem / 800 | | `.rail .num` | 2.4rem serif / 500 |
| `.kicker` | .8rem mono, .14em tracked, uppercase | | labels/meta | .72rem mono uppercase |

## Color & theming

All color lives in `:root` tokens; **three switchable palettes** change only color,
never type or rhythm. The switch is an attribute on `<html>` (`data-palette`),
applied live by the footer Palette tool and persisted. Daylight is the bare
`:root`; the shipped example defaults to **Dusk** (`<html data-palette="dusk">`).

| Palette | Character | `--paper` / `--ink` |
|---|---|---|
| **Daylight** (`:root`) | warm paper, constructivist inks | `#F5F1E9` / `#1E1A14` |
| **Dusk** (`[data-palette="dusk"]`) | cool slate paper, blueprint inks | `#E8EBF0` / `#14171E` |
| **Vivid** (`[data-palette="vivid"]`) | bright blue ink on cool paper | `#E8EAED` / `#2D52BE` |

Token families (each palette redefines them):

- **Surfaces** — `--ground` (dotted page, *not* palette-bound), `--sheet` (the page),
  `--paper`, `--dot`, `--card-bg` + `--card-border` (live-adjustable), `--rule` / `--rule-2`.
- **Ink ramp** — `--ink` → `--ink-strong` → `--ink-2` → `--ink-3` (heading → body →
  secondary → muted; tuned so muted text stays legible on paper).
- **Accent triads** — `--red`, `--blue`, `--ochre`, `--green`, `--violet`, each with a
  darker `-ink` (text) and pale `-soft` (fill) partner; used for actor/lane identity.
- **Code** — a fixed Tokyo-Night set (`--tn-bg/-bar/-fg/-dim/-kw/-str/-comment/-num/-fn`);
  deliberately *constant across palettes* so code always looks the same.
- **Highlighters** — `--mark` (emphasis wash) and `--code-mark` (warm yellow under
  inline `<code>`), both translucent so they sit on top of any text.

## Components

| Component | Class(es) | Notes |
|---|---|---|
| Utility bar | `.bar` `.id` `.status` | Sticky, translucent; mono id left, `Copy all notes` button flush right. |
| Masthead | `.kicker` · `h1.title` · `.standfirst` · `dl.meta` | Kicker (mono red), heavy serif title, lede, mono key/value meta grid. |
| Raw ask | `.raw-ask` | Card (`--card-bg` + hairline) with a mono label and an italic `<q>`. |
| Step row | `.step` (`display:contents`) | Rail = `.num` + `.pills` (actor tags) + italic `.action`; main = prose. |
| Done checkbox | `.done-box[data-done]` | Custom checkbox after `h3`; checking adds `.done` → strikes + dims title. |
| Swimlane | `figure.swim` + inline `<svg>` | White plate, full-bleed wider than the sheet; nodes scale on hover. |
| Photo plate | `figure.photo` `.frame` `.handnote` `.asset` | Polaroid: deep bottom lip, blue handwritten caption, hover-revealed download. |
| Inline code | `code` | Mono, angled `clip-path`, warm marker-wash background (no border). |
| Emphasis | `mark` | Angled translucent highlight; box-decoration-break:clone for multi-line. |
| Code disclosure | `.toggle` → `.code-panel` | "View/Hide code" text disclosure opens a dark Tokyo-Night panel. |
| Standalone code | `pre.block` | Dark Tokyo-Night block in the main flow. |
| Copy button | `.copy-btn` | Injected onto every code block; "Copy → Copied" with reset. |
| Note line | `.note-row` `.note-field` `textarea[data-note]` | Italic write-on line over a dotted-ink underline; hover lifts a card via `::before` (no reflow). |
| Two-up | `.two-up` `.panel` (`.panel.pick`) `.url` | Side-by-side compare cards; `.url` chips on white with host/qs/hash coloring. |
| Callout | `.callout` `.tag` | Card with mono tag label. |
| Footer tray | `.tools.full` + `.tool` | Recessed full-bleed band of report tools (see below). |
| Serif overlay | `.serif-compare` `.sc-card` `.spec` | Full-screen side-by-side specimen of every candidate face. |

## Functionality / behavior

All state persists under **one** `localStorage` key, a JSON object keyed by feature
(example key: `"pre-auth-link-explainer-notes"`). Sub-keys:

| Sub-key | Holds |
|---|---|
| per-note (`data-note` value) | the textarea contents of each step note |
| `done` | `{ stepKey: bool }` for the done-checkboxes |
| `report-palette` | active palette name (`daylight`/`dusk`/`vivid`) |
| `report-notes-layout` | `inline` vs `column` notes mode |
| `report-serif-display` | chosen display-serif stack |
| `report-card-bg` | live block-fill color |
| `report-card-border` | `{hex, a}` block-hairline color + opacity |

Behaviors: **auto-growing** note textareas; **Copy all notes** assembles every
non-empty step note (`Step N — Title` + body) to the clipboard with a status
flash; a **Copy** button on each code block; the **View/Hide code** toggle
reparents the note below the expanded panel and back; footer **switchers**
(Palette, Notes layout, Serif) flip a `data-*` attribute or inline custom property
and persist; the **Serif compare** overlay builds one live specimen per candidate
(Esc / backdrop / × to close); footer **color tools** live-edit `--card-bg` and
`--card-border` via swatches, native color inputs, and an opacity slider.

**Graceful degradation:** with JS off the report is fully readable — notes become
empty underlines, switchers are inert, and the palette is whatever `data-palette`
is hard-set on `<html>`.

## Retuning

- **Recolor:** edit the `:root` token block, or swap/add a `html[data-palette="…"]`
  override block. Only color tokens belong there — never type or rhythm.
- **Re-space:** change `--rhythm` (everything scales) or the `--space` / `--section`
  derivation; tweak the `--s-*` ramp for padding.
- **Re-measure:** `--rail-w`, `--main-w`, `--gutter`, `--notes-w` set the grid;
  `--sheet-pad-x/-y` set the page inset (and the footer's breakout).
- **Type scale** is inline per-selector (`h1.title`, `h2`, `h3`, `.standfirst`).
- Responsive: rail narrows at `1180px`, collapses to one column at `680px`.
