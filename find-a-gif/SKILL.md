---
name: find-a-gif
description: Use when the user asks for an animated GIF — "find a gif of X", "get me a gif", "drop a gif here", "I need a reaction gif", "what gif fits this?", or wants to spice up a Slack/note/doc with a GIF. Powered by gifgrep + Giphy.
---

# Find a GIF

Find a great animated GIF for a moment, show a few candidates with inline previews, and hand back a clean URL the user can paste anywhere (Slack, docs, PRs, Obsidian).

## The tool

`gifgrep` (https://gifgrep.com) — installed via `brew install steipete/tap/gifgrep`. Requires `GIPHY_API_KEY` in env.

If `gifgrep` isn't on PATH, tell the user and stop — don't try to install it inside the skill.

If `GIPHY_API_KEY` is missing, tell the user — get a key at https://developers.giphy.com/dashboard (API tier, beta), then `export GIPHY_API_KEY=...` in `~/.zshrc`.

## Default workflow — "show me options"

This is the default. The user said "find a gif of X" — they want to **see** options, not get one blind URL.

1. Run `gifgrep "<query>" --max 5 --format url`.
2. Reply with **markdown image embeds** so the user sees the GIFs inline:

   ```markdown
   ![1](https://media.../giphy.gif)
   ![2](https://media.../giphy.gif)
   ...
   ```

   Number them 1–5. Below the previews, list the same URLs in a numbered code block so the user can copy-paste any one.

3. End with a short prompt: "Pick a number to copy to clipboard, or refine the query."

When the user picks a number → run `echo "<url>" | pbcopy`, confirm with "Copied #N." in one line.

## Variant — "just one, ready to paste"

If the user says "just give me one", "the top one", "I'm in a hurry", or similar:
- Run `gifgrep "<query>" --max 1 --format url`.
- Reply with the single inline preview, the URL on its own line, and copy to clipboard immediately.
- One sentence: "Copied — paste anywhere."

## Variant — "browse them"

If the user says "let me browse", "show me lots", "open the picker":
- Run `gifgrep tui "<query>"` in the foreground via Bash (it's an interactive TUI; the user drives it directly).
- Don't try to parse the TUI output. After it exits, ask which one they kept.

## Variant — "save it as a file"

If the user wants a local file (for an Obsidian vault, a presentation, a README asset):
- Run `gifgrep "<query>" --download --max 1 --format url`.
- Reveal in Finder with `gifgrep --reveal` or `open ~/Downloads`.
- Report the path.

## Query craft

The user's first phrasing is often too short. A 2–4 word emotional/action query beats a literal one.

| User said | Better query |
|---|---|
| "shipping" | `shipping it confidence` or `nailed it` |
| "i'm tired" | `exhausted slump` or `monday mood` |
| "celebrate" | `team high five` or `confetti celebration` |
| "wtf" | `confused math lady` or `surprised pikachu` |

If the first batch is weak, **rephrase silently and re-run** — don't ask the user to re-query unless 2 attempts both miss.

## Safety / tone

- Default to `--rating g`-style content; `gifgrep` defaults to safe-for-work via Giphy, but if a query trends NSFW, refine to a tamer phrasing.
- Avoid GIFs of real, named people in negative/mocking contexts (memes of public figures are fine, but read the room — internal Slack ≠ public PR).

## What this skill is NOT

- It's not a GIF *editor*. For stills/sheets/extracts, use `gifgrep still` and `gifgrep sheet` directly — they're documented in `gifgrep --help`.
- It's not a Discord/Slack poster. It returns URLs; the user pastes.
