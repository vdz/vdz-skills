# session-pulse

A Claude Code mod that keeps one session's "where are we" in view, so you never have to
type `status?` and Claude never has to remember to restate it. Terms are in the repo's
`CONTEXT.md` under "session-pulse mod".

```
Tests are green.

◂ your move · 3/5 · next: approve the PR        ← the Pulse line, drawn dim
```

- **Pulse line.** Every prompt carries a short hidden rule asking Claude to end each
  reply with one line while work is open: `▸ working`, `◂ your move`, `■ blocked` or
  `✓ done`, then `n/m`, then `next: …`. The rule replaces the CLAUDE.md "restate state
  every turn" line. The current Pulse rides along too, so `status?` costs no digging.
- **Footer.** `◂ 3/5 · next: approve the PR` sits ahead of the mode labels (and
  focus-read's Toggle). Click it for the Pulse pane: the Pulse, the last five before it,
  and context %, rate-limit windows and cost as the engine figures them. Where no pane
  can be placed, the same text comes up as a toast.
- **`/pulse`** answers in place, with no model turn; `/pulse pane` opens the pane.
- **Stale.** A reply that leaves work open with no Pulse line keeps the old Pulse,
  marked stale (dimmed in the footer). A done Pulse never goes stale.
- **Survives** compaction, resume and restart (stored per session id). `/clear` starts
  a fresh Pulse; the earlier ones stay in the history.
- Subagent replies never move the Pulse.

## Load

Installed from this repo's marketplace: `claude plugin install session-pulse@vdz-skills`.
While developing: `claude --plugin-dir ~/Dev/vdz-skills/mods/session-pulse`, or an
`rsync -a --delete --exclude .claude-plugin/types` copy into the session's dev-mods
folder (Desktop 2.1.288 ignores edits under a symlinked folder).

## Check

```
claude plugin test mods/session-pulse
claude plugin validate mods/session-pulse
tsc -p mods/session-pulse
```
