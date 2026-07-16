#!/usr/bin/env bash
# drive-browser dependency manager. Idempotent — safe to re-run.
#
#   setup.sh            install anything missing (first-time bootstrap)
#   setup.sh --check    report installed vs latest versions; exit 1 if updates exist
#   setup.sh --update   update whatever --check found outdated
set -uo pipefail

MODE="${1:-install}"

latest_brew() { brew info --json=v2 "$1" 2>/dev/null | /usr/bin/python3 -c 'import json,sys; print(json.load(sys.stdin)["formulae"][0]["versions"]["stable"])' 2>/dev/null; }
latest_npm()  { npm view "$1" version 2>/dev/null; }

case "$MODE" in
--check)
  echo "→ drive-browser dependency check"
  OUTDATED=0

  # agent-browser (brew) — young & fast-moving; updates matter most here
  if command -v agent-browser >/dev/null 2>&1; then
    CUR=$(agent-browser --version 2>&1 | awk '{print $NF}')
    LATEST=$(latest_brew agent-browser)
    if [ -n "$LATEST" ] && [ "$CUR" != "$LATEST" ]; then
      echo "  ⬆ agent-browser $CUR → $LATEST   (brew upgrade agent-browser)"; OUTDATED=1
    else
      echo "  ✓ agent-browser $CUR (latest)"
    fi
  else
    echo "  ✗ agent-browser missing — run setup.sh"; OUTDATED=1
  fi

  # playwright-cli (npm global)
  if command -v playwright-cli >/dev/null 2>&1; then
    CUR=$(playwright-cli --version 2>&1)
    LATEST=$(latest_npm @playwright/cli)
    if [ -n "$LATEST" ] && [ "$CUR" != "$LATEST" ]; then
      echo "  ⬆ playwright-cli $CUR → $LATEST   (npm install -g @playwright/cli)"; OUTDATED=1
    else
      echo "  ✓ playwright-cli $CUR (latest)"
    fi
  else
    echo "  ✗ playwright-cli missing — run setup.sh"; OUTDATED=1
  fi

  # chrome-devtools MCP — registered as npx @latest, so it self-updates per session
  if claude mcp get chrome-devtools >/dev/null 2>&1; then
    echo "  ✓ chrome-devtools MCP (npx @latest — self-updating)"
  else
    echo "  ✗ chrome-devtools MCP not registered — run setup.sh"; OUTDATED=1
  fi

  # Chrome for Testing — pinned per agent-browser release; refresh after upgrading it
  AB_CHROME=$(ls "$HOME/.agent-browser/browsers" 2>/dev/null | head -1)
  [ -n "$AB_CHROME" ] && echo "  ℹ bundled browser: $AB_CHROME (re-run 'agent-browser install' after an agent-browser upgrade)"

  exit $OUTDATED
  ;;

--update)
  echo "→ drive-browser dependency update"
  brew upgrade agent-browser 2>&1 | tail -2
  agent-browser install 2>&1 | tail -2   # refresh Chrome for Testing to the version the new CLI pins
  npm install -g @playwright/cli 2>&1 | tail -2
  echo "→ done"; "$0" --check
  ;;

install|*)
  echo "→ drive-browser setup"

  # 1. agent-browser (Homebrew) + its bundled Chrome for Testing — the daily driver
  if command -v agent-browser >/dev/null 2>&1; then
    echo "  ✓ agent-browser $(agent-browser --version 2>&1 | awk '{print $NF}')"
  else
    echo "  installing agent-browser…"; brew install agent-browser
  fi
  if [ -z "$(ls -A "$HOME/.agent-browser/browsers" 2>/dev/null)" ]; then
    echo "  downloading Chrome for Testing…"; agent-browser install
  else
    echo "  ✓ agent-browser browser present"
  fi

  # 2. Playwright CLI (npm, global) — robust/repeatable flows & E2E
  if command -v playwright-cli >/dev/null 2>&1; then
    echo "  ✓ playwright-cli $(playwright-cli --version 2>&1)"
  else
    echo "  installing @playwright/cli…"; npm install -g @playwright/cli
  fi

  # 3. Chrome DevTools MCP (user scope, deferred) — network/console/perf debugging
  if claude mcp get chrome-devtools >/dev/null 2>&1; then
    echo "  ✓ chrome-devtools MCP registered"
  else
    echo "  registering chrome-devtools MCP…"
    claude mcp add --transport stdio --scope user chrome-devtools -- npx chrome-devtools-mcp@latest
  fi

  echo "→ done. If playwright-cli later errors about a missing browser, run: npx playwright install chromium"
  echo "  agent-browser ships its own guide: agent-browser skills get core --full"
  ;;
esac
