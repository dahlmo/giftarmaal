#!/usr/bin/env bash
set -euo pipefail

# Find repo root relative to this file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "starting_scanners (cwd: $PWD)"

REPORT_DIR="automation/reports"
mkdir -p "$REPORT_DIR"

# ── pnpm audit ────────────────────────────────────────────────────────────────
if [[ -f "pnpm-lock.yaml" || -f "package.json" ]]; then
  echo "running pnpm audit…"
  pnpm audit --json > "$REPORT_DIR/pnpm_audit.json" 2>/dev/null || {
    echo "pnpm audit completed with findings (non-critical), continuing"
  }
else
  echo "no package.json or pnpm-lock.yaml found, skipping pnpm audit"
fi

# ── TypeScript type check ─────────────────────────────────────────────────────
API_TSCONFIG="apps/api/tsconfig.json"
if [[ -f "$API_TSCONFIG" ]] && command -v pnpm &>/dev/null; then
  echo "running tsc --noEmit…"
  TSC_OUT=$(pnpm exec tsc --noEmit --project "$API_TSCONFIG" 2>&1 || true)
  # Wrap output as JSON so load_reports() can consume it
  python3 -c "
import json, sys
out = sys.argv[1]
errors = [l for l in out.splitlines() if l.strip()]
print(json.dumps({'tool': 'tsc', 'errors': errors, 'count': len(errors)}, indent=2))
" "$TSC_OUT" > "$REPORT_DIR/tsc.json"
  echo "tsc check done ($(python3 -c "import json; d=json.load(open('$REPORT_DIR/tsc.json')); print(d['count'])" 2>/dev/null || echo '?') issues)"
fi

# ── Semgrep ────────────────────────────────────────────────────────────────────
if command -v semgrep &>/dev/null; then
  echo "running semgrep…"
  semgrep scan --config auto apps/api/src \
    --json --output "$REPORT_DIR/semgrep.json" \
    --quiet 2>/dev/null || {
    echo "semgrep completed (results in semgrep.json)"
  }
else
  echo "semgrep not installed, skipping (install: pip install semgrep)"
fi

echo "scanner_done"
