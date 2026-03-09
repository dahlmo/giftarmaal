#!/usr/bin/env bash
set -euo pipefail

if [ -f /app/.env ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' /app/.env | xargs) || true
fi

echo "Generating Prisma client..."
npx -y pnpm@9.12.2 prisma generate

ATTEMPTS=0
MAX_ATTEMPTS=30

echo "Waiting for database..."
until npx -y pnpm@9.12.2 prisma migrate deploy; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "Database not reachable after $MAX_ATTEMPTS attempts; giving up."
    exit 1
  fi
  echo "Waiting for database... ($ATTEMPTS/$MAX_ATTEMPTS)"
  sleep 2
done

# Optional one-time seed, only if explicitly enabled
if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "Running seed..."
  npx -y pnpm@9.12.2 prisma db seed || true
fi

echo "Starting application..."
exec npx -y pnpm@9.12.2 start