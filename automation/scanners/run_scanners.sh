#!/usr/bin/env bash
set -euo pipefail

# Find repo root relative to this file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT_DIR"

echo "starting_scanners (cwd: $PWD)"

REPORT_DIR="automation/reports"
mkdir -p "$REPORT_DIR"

# PNPM / NPM audit
if [[ -f "pnpm-lock.yaml" || -f "package.json" ]]; then
  echo "running pnpm audit…"
  # adjust to npm audit if you use it
  pnpm audit --json > "$REPORT_DIR/pnpm_audit.json" || {
    echo "pnpm audit failed (non-critical), continuing"
  }
else
  echo "no package.json or pnpm-lock.yaml found in $PWD, skipping pnpm audit"
fi

echo "scanner_done"