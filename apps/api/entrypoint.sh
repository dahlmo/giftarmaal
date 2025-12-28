#!/usr/bin/env bash
set -euo pipefail

export PATH=$(npm root -g)/.bin:$PATH

if [ -f /app/.env ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' /app/.env | xargs) || true
fi

npx -y pnpm@9.12.2 i
npx -y pnpm@9.12.2 prisma:generate

ATTEMPTS=0
MAX_ATTEMPTS=30
until npx -y pnpm@9.12.2 prisma:migrate; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "Database not reachable after $MAX_ATTEMPTS attempts; giving up."
    exit 1
  fi
  echo "Waiting for database... ($ATTEMPTS/$MAX_ATTEMPTS)"
  sleep 2
done

npx -y pnpm@9.12.2 prisma:seed || true

exec npx -y pnpm@9.12.2 start:dev
