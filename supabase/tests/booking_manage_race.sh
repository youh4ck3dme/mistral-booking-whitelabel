#!/usr/bin/env bash
# Real concurrency check for customer reschedule: two sessions race for the same slot.
# Session A holds the transaction open (pg_sleep) after rescheduling, so session B
# must wait on the EXCLUDE constraint and then get 'slot_taken'.
#
# Destructive for the database it is given: it creates and drops its own scratch DB.
# Usage: PGHOST=127.0.0.1 PGPORT=5544 PGUSER=postgres supabase/tests/booking_manage_race.sh <migrated-base-db>
set -euo pipefail

BASE_DB="${1:?usage: $0 <database with migrations 001-015 applied>}"
DB="booking_race_$$"
TMP="$(mktemp -d)"
trap 'psql -q -d postgres -c "DROP DATABASE IF EXISTS $DB" >/dev/null 2>&1 || true; rm -rf "$TMP"' EXIT

psql -q -v ON_ERROR_STOP=1 -d postgres -c "CREATE DATABASE $DB TEMPLATE \"$BASE_DB\"" >/dev/null

psql -q -v ON_ERROR_STOP=1 -d "$DB" <<'SQL'
INSERT INTO auth.users (id, email) VALUES
  ('a7000000-0000-0000-0000-000000000001', 'race-a@example.test'),
  ('a7000000-0000-0000-0000-000000000002', 'race-b@example.test');
INSERT INTO public.tenants (id, name, slug, locale) VALUES
  ('a8000000-0000-0000-0000-000000000001', 'Race Tenant', 'race-tenant', 'sk');
INSERT INTO public.services (id, tenant_id, name, duration, price, is_active) VALUES
  ('a9000000-0000-0000-0000-000000000001', 'a8000000-0000-0000-0000-000000000001', 'Race Service', 60, 10, true);
INSERT INTO public.time_slots_config (tenant_id, start_time, end_time, is_active) VALUES
  ('a8000000-0000-0000-0000-000000000001', '08:00', '18:00', true);
INSERT INTO public.bookings (id, tenant_id, user_id, service_id, start_time, end_time, status) VALUES
  ('aa000000-0000-0000-0000-000000000001', 'a8000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000001',
   'a9000000-0000-0000-0000-000000000001', '2030-04-01 09:00+00', '2030-04-01 10:00+00', 'confirmed'),
  ('aa000000-0000-0000-0000-000000000002', 'a8000000-0000-0000-0000-000000000001', 'a7000000-0000-0000-0000-000000000002',
   'a9000000-0000-0000-0000-000000000001', '2030-04-01 12:00+00', '2030-04-01 13:00+00', 'confirmed');
-- Both customers hold valid links (hashes of 'race-token-a' and 'race-token-b').
INSERT INTO public.booking_manage_tokens (booking_id, tenant_id, token_hash, expires_at) VALUES
  ('aa000000-0000-0000-0000-000000000001', 'a8000000-0000-0000-0000-000000000001',
   encode(sha256(convert_to('race-token-a', 'UTF8')), 'hex'), '2030-04-03 00:00+00'),
  ('aa000000-0000-0000-0000-000000000002', 'a8000000-0000-0000-0000-000000000001',
   encode(sha256(convert_to('race-token-b', 'UTF8')), 'hex'), '2030-04-03 00:00+00');
SQL

cat > "$TMP/a.sql" <<SQL
BEGIN;
SELECT public.reschedule_booking_by_token(
  encode(sha256(convert_to('race-token-a', 'UTF8')), 'hex'), 'race-tenant',
  '2030-04-01 15:00+00', encode(sha256(convert_to('race-token-a-next', 'UTF8')), 'hex'))->>'status' AS result;
SELECT pg_sleep(2);
COMMIT;
SQL

cat > "$TMP/b.sql" <<SQL
SELECT public.reschedule_booking_by_token(
  encode(sha256(convert_to('race-token-b', 'UTF8')), 'hex'), 'race-tenant',
  '2030-04-01 15:30+00', encode(sha256(convert_to('race-token-b-next', 'UTF8')), 'hex'))->>'status' AS result;
SQL

# A takes the slot first and holds it; B starts 0.5 s later, after A's update is in flight.
psql -tA -v ON_ERROR_STOP=1 -d "$DB" -f "$TMP/a.sql" > "$TMP/a.out" 2>&1 &
PID_A=$!
sleep 0.5
psql -tA -v ON_ERROR_STOP=1 -d "$DB" -f "$TMP/b.sql" > "$TMP/b.out" 2>&1 || true
wait "$PID_A" || true

RESULT_A="$(grep -E '^(ok|slot_taken|outside_hours|invalid|expired|in_past|not_editable|already_cancelled)$' "$TMP/a.out" | head -1)"
RESULT_B="$(grep -E '^(ok|slot_taken|outside_hours|invalid|expired|in_past|not_editable|already_cancelled)$' "$TMP/b.out" | head -1)"

echo "session A: ${RESULT_A:-<none>}"
echo "session B: ${RESULT_B:-<none>}"

# Exactly one reschedule may win. Two wins would mean the constraint did not hold.
WINNERS=0
[ "$RESULT_A" = "ok" ] && WINNERS=$((WINNERS + 1))
[ "$RESULT_B" = "ok" ] && WINNERS=$((WINNERS + 1))
if [ "$WINNERS" -ne 1 ] || { [ "$RESULT_A" != "ok" ] && [ "$RESULT_A" != "slot_taken" ]; } || { [ "$RESULT_B" != "ok" ] && [ "$RESULT_B" != "slot_taken" ]; }; then
  echo "RACE CHECK FAILED: expected exactly one ok and one slot_taken"
  cat "$TMP/a.out" "$TMP/b.out"
  exit 1
fi

OVERLAPS="$(psql -tA -d "$DB" -c "
  SELECT count(*) FROM public.bookings x JOIN public.bookings y ON x.id < y.id
  WHERE x.service_id = y.service_id AND x.status <> 'cancelled' AND y.status <> 'cancelled'
    AND tstzrange(x.start_time, x.end_time, '[)') && tstzrange(y.start_time, y.end_time, '[)');")"
if [ "$OVERLAPS" != "0" ]; then
  echo "RACE CHECK FAILED: $OVERLAPS overlapping active booking pair(s)"
  exit 1
fi

echo "ALL RACE CHECKS PASSED"
