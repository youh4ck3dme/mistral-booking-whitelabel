#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

pnpm install --frozen-lockfile
supabase start

eval "$(supabase status -o env)"

export NEXT_PUBLIC_SUPABASE_URL="$API_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$ANON_KEY"
export SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
export SUPABASE_DB_URL="$DB_URL"
export NEXT_PUBLIC_APP_URL="http://127.0.0.1:3000"
export PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"
export PLAYWRIGHT_EMAIL="${PLAYWRIGHT_EMAIL:-playwright-admin@example.com}"
export PLAYWRIGHT_PASSWORD="${PLAYWRIGHT_PASSWORD:-Playwright-Admin-123!}"
export NOTIFICATION_CRON_SECRET="${NOTIFICATION_CRON_SECRET:-local-notification-cron-secret}"

wait_for_auth() {
  for _ in {1..60}; do
    if curl -fsS "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done

  curl -fsS "$NEXT_PUBLIC_SUPABASE_URL/auth/v1/health" >/dev/null
}

supabase db reset --local
wait_for_auth
pnpm setup:ui
pnpm bootstrap:playwright-auth
pnpm lint
pnpm build
pnpm test

pnpm --filter @repo/web start -- --hostname 127.0.0.1 --port 3000 >/tmp/mistral-booking-verify.log 2>&1 &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}

trap cleanup EXIT

for _ in {1..60}; do
  if curl -fsS "$PLAYWRIGHT_BASE_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

curl -fsS "$PLAYWRIGHT_BASE_URL" >/dev/null 2>&1
pnpm test:ui
