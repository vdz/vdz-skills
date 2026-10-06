# Context Glossary

Canonical language for the skills in this repo. Terms only — no implementation.

## focus-read mod

A Claude Code mod (`mods/focus-read`) that helps a person read a long reply by letting
them hover one part of it while the rest steps back, in the spirit of iA Writer's focus
mode.

- **Reply** — one assistant message as drawn in the transcript. The only text the mod
  touches; prompts, tool output and panes are never affected.
- **Paragraph** — the unit of focus: a run of lines separated by blank lines. A code
  fence, a list, a table or a blockquote is one Paragraph however many blank lines it
  holds, and a heading belongs to the Paragraph that follows it.
- **Focus** — the Paragraph the pointer rests on, drawn at full strength. There is at
  most one Focus across the whole transcript, and none until the pointer has rested
  briefly, so skimming focuses nothing.
- **Dim zero** — how every Paragraph of every finished Reply looks while Mode is on and
  there is no Focus: stepped back, still readable.
- **Deep dim** — every Paragraph other than the Focus, in every Reply, while a Focus
  exists: further back than Dim zero, so the Focus stands out clearly against it.
- **Mode** — whether the mod is on or off. Off, every Reply is drawn by the engine as
  usual. Persists across sessions; `/focus` or the **Toggle** flips it.
- **Toggle** — the one control the mod shows of its own, among the mode labels in the
  prompt's footer: it names the current Mode and flips it.
- **Generating** — the span from a turn's start to its completion. Dim zero, Deep dim and
  Focus all hold while Generating, so earlier Replies stay readable while agents work.
