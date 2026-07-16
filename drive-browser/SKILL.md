---
name: drive-browser
description: Use when a task needs a real browser driven or inspected — clicking through a site, filling or submitting a form, logging in then doing something, testing or exercising a web app, checking a deployed/staging/localhost page, scraping page content, automating a multi-step flow, reproducing a UI bug, or investigating a page's console errors, failed network requests, or performance. Covers E2E and UI checks beyond the in-app preview pane.
---

# Drive a browser

Pick the **cheapest tool that fits the job**, then drive it from the shell so every
command — and what it saw — is legible. Full rationale + token math:
`~/Dev/claude-browser-automation-setup.html`.

## Contents

| Section | Where |
|---|---|
| [Routing — which tool](#routing--which-tool) · [Safety](#safety) | this file |
| Tool usage: agent-browser · playwright-cli · chrome-devtools | `references/tools.md` |
| Dev-loop recipes: error sweeps, screenshots, auth sessions, perf, scraping, cleanup | `references/dev-recipes.md` |
| [Setup](#setup-once-per-machine) · [Keeping deps fresh](#keeping-deps-fresh) | this file + `setup.sh` |

## Routing — which tool

**First: do you even need a browser?** For static, server-rendered text, `WebFetch` is
cheaper and needs no setup. Reach for a browser only when the page is JS-rendered,
interactive, or behind a login.

| The job | Tool | Why |
|---|---|---|
| "Did the change I just made render?" (dev server) | **in-app Browser pane** (`mcp__Claude_Browser__*`, or the `run`/`verify` skills) | Zero setup, already open, correct surface for "does it show up." |
| Drive a page fast — open, snapshot, click, fill (the 90% case) | **agent-browser** CLI | ~200–400 tok/page. Shell-driven, ref-based, no per-step schema tax. |
| Robust/repeatable flow, multi-step auth, or an authored E2E test | **playwright-cli** | Battle-tested engine; snapshot-to-file + `grep`. ~27k vs the MCP's ~114k for a 10-step task. |
| Inspect console / network / DOM / performance of a real Chrome | **chrome-devtools** MCP (deferred) | The one job a CLI can't match — CDP + Core Web Vitals. Loads on demand. |
| Must be the user's own logged-in Chrome | **Claude in Chrome** (`mcp__claude-in-chrome__*`) | Slow, vision-driven. Last resort — prefer the debug-profile recipe. |

After routing, load `references/tools.md` for the chosen tool's core loop and gotchas;
for engineering-loop tasks (error sweeps, screenshots, responsive/dark checks, logged-in
sessions, perf, scraping, cleanup) load `references/dev-recipes.md`.

Do **not** reach for `@playwright/mcp` — the always-on plugin is disabled on purpose;
use `playwright-cli`. If one repo genuinely needs the MCP protocol, add it project-scoped
via a committed `.mcp.json`, never globally.

**Pane vs chrome-devtools:** for a *running dev server* the in-app pane already exposes
`read_console_messages` and `read_network_requests` — use it for render + console + network
in one tool. Escalate to chrome-devtools only for what the pane can't do: performance traces,
Lighthouse, or attaching to a real logged-in Chrome.

## Safety

Never type credentials into a field: for a login, drive up to the form but the **user enters
their own password**. Downloads, purchases, form submissions, and irreversible clicks
(send / publish / delete) need the user's explicit go-ahead first.

## Setup (once per machine)

If a tool is missing (preflight: `command -v agent-browser playwright-cli`;
`claude mcp get chrome-devtools`), run the idempotent bootstrap:

```bash
bash ~/.claude/skills/drive-browser/setup.sh
```

## Keeping deps fresh

The stack is young and fast-moving. When a tool misbehaves in a way that smells like a
tool bug — a crash, a snapshot glitch, a known-buggy flag — or it's been weeks, run:

```bash
bash ~/.claude/skills/drive-browser/setup.sh --check   # exit 1 ⇒ updates available
```

If outdated, **suggest the update to the user** (current → latest) and only on their
go-ahead run `setup.sh --update`. Never auto-update mid-task — finish on the current
version first.

## Not this skill's job

Dev-server render verification and authored Python Playwright test scripts belong to the
`run` / `verify` / `webapp-testing` skills — this skill routes to them when they fit.
