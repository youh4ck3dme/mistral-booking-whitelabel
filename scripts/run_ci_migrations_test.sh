#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgrespassword}"
export PGDATABASE="${PGDATABASE:-postgres}"

echo "==> Verifying PostgreSQL connection at $PGHOST:$PGPORT..."
if command -v pg_isready >/dev/null 2>&1; then
  until pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER"; do
    echo "Waiting for postgres..."
    sleep 1
  done
fi

echo "==> Applying test bootstrap schema..."
psql -v ON_ERROR_STOP=1 -f scripts/ci_test_bootstrap.sql

echo "==> Applying migrations 001 to 018..."
for migration in $(ls supabase/migrations/*.sql | sort); do
  echo "--> Applying migration: $migration"
  psql -v ON_ERROR_STOP=1 -f "$migration"
done

echo "==> Running SQL Verification Suites..."
for test_file in \
  supabase/tests/booking_concurrency_verification.sql \
  supabase/tests/active_staff_guard_verification.sql \
  supabase/tests/booking_manage_verification.sql \
  supabase/tests/staff_availability_verification.sql \
  supabase/tests/reminder_pipeline_verification.sql; do
  if [ -f "$test_file" ]; then
    echo "--> Running $test_file..."
    psql -v ON_ERROR_STOP=1 -f "$test_file"
  fi
done

echo "==> All migrations and SQL guard tests passed cleanly!"
