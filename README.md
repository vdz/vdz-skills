
# Here're the Skills I use (for a friend)

> This is my collection of the skills, I'm sure you have own of your own, but this one here is mine ...

I use this skills primarily with Claude Code for **engineering** mainly, when my emphasis is creating a **predictable & high-quality code**, optimized for maintenance and scale in function & team. I've been doing software engineering professionally since 1999, and I specialize in user-facing applicaions i.e. front-end.

## Skills I'd authored

Each of these exists because I kept doing the same thing by hand and wanted it to be
consistent and repeatable. Here's what each one is and *why I actually need it*.

### Architecture — [`ripe-skills`](ripe-skills/) (submodule)

I use a [Ripe Architecture](https://github.com/vdz/ripe-skills#readme) in my application
work on the web — I love it! It's battle-tested, and is great for the agentic age. Read
the full architecture: [in this repo](ripe-skills/ripe-architecture-docs/the-ripe-method.md)
or [on GitHub](https://github.com/vdz/ripe-skills/blob/main/ripe-architecture-docs/the-ripe-method.md).
It's easy to use, but you better grok the architecture to really enjoy it.

**Why I need it:** front-end work sprawls fast. Ripe gives an agent a predictable place
for everything — store branches, components, routing, tests — so the code stays
maintainable and reviewable as the app (and the team) grows. It's the backbone of how I
build, so it lives here as a submodule (it's also published to NPM as `ripe-skills`).

### Reporting — [`html-report`](html-report/)

A single, self-contained, *beautiful* `.html` file — a process explainer, a spec-decision
record, a write-up of what changed and why. One file, no build, opens anywhere.

**Why I need it:** when I finish a piece of work I often want to hand someone something
they can open and keep, not a dashboard and not slides. This keeps those write-ups
consistent and good-looking (a real typographic system + a couple of tasteful
interactions) instead of ad-hoc CSS every time.

### Working log — [`taking-notes`](taking-notes/)

"Side-note this" → it lands in a running log of decisions, tradeoffs, and FYIs captured
*alongside* the implementation work.

**Why I need it:** I don't want to stop mid-task and context-switch into a doc to record
why we did something. This captures the reasoning in the moment, beside the code, so the
"why" survives.

### Regression guard — [`regression-dog`](regression-dog/)

A focused reviewer that reads a diff for one thing only: *what might this change break?*

**Why I need it:** general code review wanders. Sometimes I just want the narrow,
paranoid pass — regressions, nothing else — before I ship.

### Writing — [`unslop`](unslop/)

An always-on editorial pass that removes generic model residue from user-facing prose
while preserving facts, language, punctuation, and voice. When given a draft, it can
rewrite it or diagnose the passages that still sound inflated, canned, or over-structured.

**Why I need it:** AI cleanup often becomes another house style: ban a punctuation mark,
swap words from a blacklist, and sand away anything distinctive. This skill treats those
patterns as evidence instead of laws. It tightens the writing without replacing the writer.

### Teaching — a deliberate trial: [`teaching`](teaching/) · [`teach-me`](teach-me/) · [`teach-me-deeply`](teach-me-deeply/) · [`explain-it-back`](explain-it-back/)

Four overlapping takes on "teach me this." They're here **on purpose** — I'm dogfooding
them by real use to find which one actually makes things stick. I pick one per session by
its slash name; eventually one wins and the rest get archived.

- **`teaching`** — the original shape: the teacher explains, then verifies mastery.
- **`teach-me`** — my discipline-enforcing rewrite: verify don't assume, gated
  progression, problem before solution.
- **`teach-me-deeply`** — a lean, quick-start → workflow → rule version (Pocock-style).
- **`explain-it-back`** — inverted: *I* do the explaining and the agent diagnoses my
  misconception (Socratic, smallest-hint-first).

**Why I need them:** I often want to genuinely *understand* a piece of work, not just have
it done — and I haven't decided which teaching style works best for me, so I'm comparing
them in the wild rather than guessing.

## Skills I use (external)

These aren't in this repo — credit to their authors. Listed here so anyone seeing my workflow knows the rest of my stack.

**superpowers** | [obra/superpowers](https://github.com/obra/superpowers) by Jesse Vincent | Brainstorming, writing/executing plans, TDD, systematic debugging, code review, parallel-agent dispatch, git worktrees, verification-before-completion |
**mattpocock/skills** | [mattpocock/skills](https://github.com/mattpocock/skills) by Matt Pocock | `diagnose`, `tdd`, `grill-me`, `triage`, `to-prd`, `to-issues`, `caveman`, `git-guardrails`, `improve-codebase-architecture`, plus per-repo `setup` |
