# Tool usage — agent-browser · playwright-cli · chrome-devtools

Load this after routing has picked a tool (see SKILL.md's table).

## agent-browser — the daily driver

Its authoritative, version-matched guide ships in the CLI. **Read it first for any
non-trivial flow:** `agent-browser skills get core --full` (`skills list` for electron/slack/etc.).

Core loop:

```bash
agent-browser open https://example.com
agent-browser snapshot -i          # interactive-only a11y tree with refs (e1, e2…)
agent-browser click @e2            # act by ref
agent-browser fill @e5 "jane@acme.com"
agent-browser read                 # agent-readable page text
agent-browser close --all          # tidy up when done
```

Its default launches its own Chrome for Testing (reliable). The `--cdp`/`--profile` flags
for driving the *real* Chrome have open bugs — for authenticated work use the debug-profile
recipe in dev-recipes.md, not those flags.

## playwright-cli — the robust fallback

```bash
playwright-cli open http://localhost:5173
playwright-cli snapshot --raw | grep "Sign in"   # find refs (no -i flag here — that's agent-browser's)
playwright-cli click e10
playwright-cli close
```

Refs are valid until the page changes; snapshots land in `.playwright-cli/`. Missing-browser
error? `npx playwright install chromium`.

## chrome-devtools MCP — the debugger

Registered at user scope, deferred (~free until invoked). Default mode = isolated Chrome.
For real-Chrome / authenticated debugging, see the debug-profile recipe in dev-recipes.md.
Tools cover `list_console_messages`, `list_network_requests`, `take_screenshot`,
`resize_page`+`emulate`, `performance_*`, `lighthouse_audit`.
