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
- **Style** — a named set of choices for how Focus and the stepped-back Paragraphs look
  (how far back they sit, how the Focus stands out, what moves the Focus). Mode says
  whether the mod acts; Style says how. One Style is current at a time and it persists.
  _Avoid_: theme (the app's light/dark), look.
- **Calm**, **Spotlight**, **Typewriter**, **Solo** — the Styles the mod ships. Calm is
  the default, gentle and hover-driven; Spotlight steps nothing back until a Focus
  exists; Typewriter is Pinned, with a Highlight and a Gradient within its own Reply;
  Solo is Pinned and hides everything but the Focus.
- **Rest level** — how far back Dim zero sits; may be none, in which case nothing steps
  back until a Focus exists.
- **Deep level** — how far back Deep dim sits: strong, or hidden. Hidden Paragraphs
  keep their space, so the transcript never jumps.
- **Highlight** — a soft tinted background behind the Focus, as a marker would leave. The
  only place the mod deliberately paints; stepped-back Paragraphs never get one.
- **Trigger** — what moves the Focus. **Hover**: the pointer resting on a Paragraph.
  **Pinned**: a click sets the Focus and the keyboard moves or releases it; the pointer
  alone changes nothing.
- **Rest delay** — how long the pointer must rest before a Hover moves the Focus.
- **Gradient** — the Paragraphs next to the Focus sit between it and Deep dim, like the
  lines around a typewriter's.
- **Reach** — which Replies Deep dim covers: every Reply, or only the Focus's own (the
  others stay at Dim zero).
- **Toggle** — the mod's own controls among the mode labels in the prompt's footer: one
  names the Mode and flips it; the one beside it names the current Style and moves to
  the next.
- **Generating** — the span from a turn's start to its completion. Dim zero, Deep dim and
  Focus all hold while Generating, so earlier Replies stay readable while agents work.

## session-pulse mod

A Claude Code mod (`mods/session-pulse`) that keeps one session's "where are we" in view, so
the person never has to ask `status?` and Claude never has to remember to restate it.

- **Pulse** — the session's current answer to "where are we": which step of how many,
  whose move it is, and the Next action. One Pulse per session; it survives compaction,
  resume and restart. `/clear` starts a fresh Pulse, but the earlier ones stay in the
  session's history.
- **Pulse line** — the Pulse as written by Claude: one fixed line at the end of a reply.
  It stays visible in the reply, drawn quietly, so the Pulse is never hidden state.
- **Next action** — the one concrete thing that moves the work forward, small enough to do
  in a couple of minutes.
- **Stale** — a Pulse whose latest reply did not carry a Pulse line. It is still shown,
  marked as possibly out of date, and never guessed at.
- **Step** — one bounded piece of the work, counted as "N of M". Only the main
  conversation moves the Step; subagent replies never change the Pulse.
