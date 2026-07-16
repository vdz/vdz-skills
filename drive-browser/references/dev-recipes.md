# Dev-loop recipes

Load this when a browser task is part of an engineering loop — verifying a change,
chasing an error, checking perf, or pulling page content into context. Each recipe
names the cheapest tool for the job. `AB` = `agent-browser`, `PW` = `playwright-cli`,
`CDT` = the `chrome-devtools` MCP tools.

## 1. Post-change smoke: console errors + failed requests

The most common check after editing frontend code — did it render *and* stay quiet?

- **Dev server already in the in-app pane** → use the pane's `read_console_messages`
  (onlyErrors) + `read_network_requests` (filter non-2xx). Zero extra setup.
- **Standalone / headless** → `CDT`: `navigate_page`, then `list_console_messages`
  (keep `error`/`warning`) and `list_network_requests` (flag status ≥ 400).
- **Just "does JS throw on load?"** → `AB open <url>` then `AB eval "window.__errors||'ok'"`,
  or watch the `open` output — a thrown error surfaces there.

Reload before reading if you attached *after* the page loaded — the console buffer may not
hold errors thrown at initial mount, and mount-time errors are usually the whole point.

## 2. Screenshot for review or a visual diff

- `AB screenshot ~/…/scratchpad/before.png` → edit → `…/after.png`. Hand both back to the user.
- `CDT take_screenshot` when you're already attached for debugging.
- Save shots to the session scratchpad, never the repo.

## 3. Responsive + dark-mode pass

- `CDT resize_page` to a breakpoint, then `CDT emulate` for `prefers-color-scheme: dark`.
- Or the in-app pane's `resize_window` (presets mobile/tablet/desktop, `colorScheme`).
- Screenshot each state; report what breaks.

## 4. Log in once, reuse the session (authenticated flows)

agent-browser's `--profile`/`--cdp` have open bugs — don't use them for real logins.
Instead, a **persistent debug profile** the CDT MCP attaches to:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 --user-data-dir="$HOME/.chrome-drive-profile"
```

Log in by hand once in that window; cookies persist in that dir for next time. Attach
with `chrome-devtools` (`--browser-url=http://127.0.0.1:9222`).

**For a repeatable flow ("run it again next month")** the durable artifact is an authored
Playwright script that loads a saved `storageState.json` (cookies + localStorage captured
after one manual login), so re-runs skip login until the session expires (MFA still needs a
human each time). That authored script is the `webapp-testing` skill's territory — this skill
routes you there. The password itself is always entered by the user, never scripted in plaintext.

**Security:** port 9222
is unauthenticated — loopback only, never port-forward, don't visit sensitive sites you
don't intend to automate, quit the window when done. For throwaway runs with no login,
add `--isolated` (auto-deleted temp profile) instead.

## 5. Performance / Core Web Vitals

- Quick audit: `CDT lighthouse_audit` on the URL.
- Deep trace: `CDT performance_start_trace` → exercise the page → `performance_stop_trace`
  → `performance_analyze_insight`. Use for "why is this slow / janky", LCP/CLS/INP.

## 6. Scrape a page into clean text/markdown

- `AB read <url>` → agent-readable text (best for pulling docs/specs/changelogs into context).
- For structure, `AB snapshot` (a11y tree) or `AB eval "<js>"` to extract specific nodes.

## 7. Don't fight dynamic content

- After any navigation or click, **re-snapshot** — refs (`e1`, `e5`…) invalidate on DOM change.
- Wait explicitly: `AB wait "<selector>"` or `AB wait 500`; `PW` has the same. Never guess with sleeps in a loop.

## 8. Find the running dev server

- Check the repo's launch config / `package.json` scripts for the port first.
- Otherwise `lsof -iTCP -sTCP:LISTEN -n -P | grep -i node` to spot the listener, then drive `http://localhost:<port>`.

## 9. Always clean up

- `AB close --all` and `PW close` when the task is done — leaked headless Chromes pile up.
- The debug-profile Chrome (recipe 4) is user-launched; ask before quitting it.
