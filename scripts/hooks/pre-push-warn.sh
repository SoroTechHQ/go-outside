#!/usr/bin/env bash
# Claude Code hook — fires before every Bash tool call.
# If the command is a git push, checks for launch-blocking files and warns.

INPUT=$(cat)
COMMAND=$(printf '%s' "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('command', ''))
except Exception:
    print('')
" 2>/dev/null)

# Only run for git push commands
if ! echo "$COMMAND" | grep -qE 'git (push|push --force|push -f)'; then
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -z "$ROOT" ] && exit 0

BLOCKING=()

[ -d "$ROOT/apps/web/app/seed" ]        && BLOCKING+=("apps/web/app/seed/ (seed UI — remove before production)")
[ -d "$ROOT/apps/web/app/api/seed" ]     && BLOCKING+=("apps/web/app/api/seed/ (seed API — remove before production)")
[ -d "$ROOT/apps/web/lib/seed" ]         && BLOCKING+=("apps/web/lib/seed/ (seed data module — remove before production)")

if [ ${#BLOCKING[@]} -gt 0 ]; then
  echo ""
  echo "┌─────────────────────────────────────────────────┐"
  echo "│  LAUNCH READINESS WARNING                       │"
  echo "├─────────────────────────────────────────────────┤"
  for item in "${BLOCKING[@]}"; do
    echo "│  ✗  $item"
  done
  echo "├─────────────────────────────────────────────────┤"
  echo "│  Run: node scripts/check-launch-readiness.mjs  │"
  echo "│  See: pre-launch/BEFORE_LAUNCH.md              │"
  echo "└─────────────────────────────────────────────────┘"
  echo ""
  echo "This is a WARNING — the push will still proceed."
  echo "Resolve the above before pushing to production."
  echo ""
fi

exit 0
