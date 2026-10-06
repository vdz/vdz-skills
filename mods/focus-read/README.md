# focus-read

Reading focus for Claude Code replies, iA Writer style. With the mod on, every finished
reply rests dimmed (dim zero). Hover a paragraph and it comes forward at full strength
while everything else, in every reply, drops further back (deep dim).

## What it looks like

Desktop Code tab, dark appearance.

**Dim zero.** Mode on, nothing hovered: the whole reply rests dimmed.

![A reply at dim zero: every paragraph dimmed evenly](docs/dim-zero.png)

**Deep dim.** The pointer rests on the last paragraph. It comes forward at full strength,
and the rest of the reply fades further.

![A reply in deep dim: the hovered last paragraph bright, the rest faded](docs/deep-dim.png)

**The toggle.** `◐ reading focus` in the prompt footer turns it on and off.

![The prompt footer with the reading focus toggle](docs/footer.png)

## Load it

```bash
claude --plugin-dir ~/Dev/vdz-skills/mods/focus-read
```

Terminal and the desktop app's Code tab are supported (the mod draws with per-paragraph
`Client` regions, which only those two surfaces have). On other surfaces the engine draws
replies as usual.

## Use it

| Command | Effect |
| --- | --- |
| `/focus` | toggle on/off (default on) |
| `/focus on`, `/focus off` | set it |
| `/focus list` | say whether it is on |
| `◐ reading focus` button | in the prompt footer's mode labels (right side); one click toggles, `○` when off |

Mode persists across sessions. The earlier themes (`dim`, `spotlight`, `ink`) and the
focus bar are retired; naming one reports that.

## Behaviour

- Focus unit is the paragraph: blank-line blocks, with fences, lists, tables and
  blockquotes kept whole and a heading glued to the block after it.
- Focus needs the pointer to rest 80 ms, so skimming focuses nothing; leaving clears
  at once.
- Dim zero is the engine's dim (60% opacity, the terminal's dim colour) plus, on desktop, a
  light veil (alpha 0.42), leaving text near 35%.
- Deep dim uses a heavier veil (alpha 0.67) in the transcript's own background colour
  (surface-1: `#fcfcfb` light, `#151515` dark), so it paints no visible box and only
  fades the text, to near 20%. It follows light and dark appearance. If the app's
  background ever changes, update `VEIL_LIGHT`/`VEIL_DARK` in `hooks/paragraph.tsx` (strengths: `VEIL_ALPHA`), or
  the veil shows as a tinted box. The
  terminal has a single dim step, so there deep dim looks the same as dim zero and only
  the focused paragraph changes.
- It keeps working while a turn runs, so you can read earlier reports while agents work;
  the reply being written is dimmed too.
- Single-paragraph replies are dimmed like any other.

## Develop

```bash
claude plugin validate ~/Dev/vdz-skills/mods/focus-read
claude plugin test ~/Dev/vdz-skills/mods/focus-read
```

`hooks/split.ts` is the paragraph splitter, `hooks/paragraph.tsx` the per-paragraph
hover sensor (a `Client` laid over the paragraph, transparent unless it draws the deep-dim veil), `hooks/register.tsx` the
hooks, the command, the state and the drawing of each paragraph.

Why the sensor draws nothing: the desktop page's `Client` sandbox renders only `Box`,
`Text`, `Svg` and the form elements. A `Markdown` inside a `Client` is refused there with
"returned a tree the page cannot draw", so the Markdown lives in the render hook's tree
and the `Client` only reports the pointer. Once the mod has loaded in a session the engine lays
`.claude-plugin/types/`, after which `tsc -p .` type-checks it.

Hot reload in the Desktop app: its bundled engine (2.1.288) does not see edits made through a
symlinked plugin folder (fixed in 2.1.289), so the session's `~/.claude/dev-mods/<session>/focus-read`
must be a real directory. Copy after each edit:

```bash
rsync -a --delete --exclude .claude-plugin ~/Dev/vdz-skills/mods/focus-read/ ~/.claude/dev-mods/<session>/focus-read/
```

## Not yet

- Blur or enlarge of the focused paragraph: the terminal grid cannot, and the desktop
  path needs an `Svg isInteractive` sandbox. Separate spike.
- Keyboard navigation (j/k).
- Text selection inside a reply: the sensor overlay holds the pointer after a press, so
  drag-selecting a paragraph's text is blocked while the mod is on (`/focus` to turn off).
