#!/usr/bin/env bash
# Verifies supabase/seed/002_demo_salon.sql against a LOCAL Postgres that has
# scripts/ci_test_bootstrap.sql and all migrations applied.
# Checks: opt-in guard, idempotency (two runs), tenant isolation (other
# tenants' rows unchanged), and the expected demo data shape.
# Uses the standard PG* env vars. Refuses any non-local PGHOST, a non-loopback
# PGHOSTADDR, PGSERVICE/PGSERVICEFILE, conninfo in PGDATABASE, and any
# connection string that looks hosted. Never point this at a hosted database.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SEED="$ROOT_DIR/supabase/seed/002_demo_salon.sql"
DEMO_TENANT_ID='de000000-0000-4000-8000-000000000001'
SEED_PGOPTIONS='-c nexify.allow_demo_seed=on -c nexify.allow_demo_seed_docker=on'

case "${PGHOST:-}" in
  ''|localhost|127.0.0.1|::1|/*) ;;
  *)
    echo "REFUSE: PGHOST=${PGHOST} is not local (localhost, 127.0.0.1, unix socket)"
    exit 2
    ;;
esac

if printf '%s' "${PGHOST:-} ${SUPABASE_DB_URL:-} ${DATABASE_URL:-}" | grep -qiE 'supabase\.co|supabase\.in|pooler\.supabase'; then
  echo "REFUSE: connection target looks like a hosted Supabase project"
  exit 2
fi

# PGHOSTADDR bypasses PGHOST name resolution in libpq.
if [ -n "${PGHOSTADDR:-}" ]; then
  case "${PGHOSTADDR}" in
    127.0.0.1|::1) ;;
    *)
      echo "REFUSE: PGHOSTADDR=${PGHOSTADDR} is not loopback (127.0.0.1 or ::1)"
      exit 2
      ;;
  esac
fi

# A service file can point at any host; refuse implicit routing.
if [ -n "${PGSERVICE:-}" ] || [ -n "${PGSERVICEFILE:-}" ]; then
  echo "REFUSE: PGSERVICE/PGSERVICEFILE is set; refuse implicit service-file hosts"
  exit 2
fi

# libpq treats PGDATABASE as a conninfo string when it contains '='
if printf '%s' "${PGDATABASE:-}" | grep -q '='; then
  echo "REFUSE: PGDATABASE looks like a libpq conninfo string"
  exit 2
fi

psql_q() { psql -X -v ON_ERROR_STOP=1 -At "$@"; }

other_tenants_fingerprint() {
  psql_q -c "
    SELECT md5(string_agg(t.row_text, '|' ORDER BY t.row_text)) FROM (
      SELECT 'tenant:' || row(x.*)::text AS row_text FROM public.tenants x WHERE x.id <> '$DEMO_TENANT_ID'
      UNION ALL SELECT 'branding:' || row(x.*)::text FROM public.tenant_branding x WHERE x.tenant_id <> '$DEMO_TENANT_ID'
      UNION ALL SELECT 'slots:' || row(x.*)::text FROM public.time_slots_config x WHERE x.tenant_id <> '$DEMO_TENANT_ID'
      UNION ALL SELECT 'service:' || row(x.*)::text FROM public.services x WHERE x.tenant_id <> '$DEMO_TENANT_ID'
      UNION ALL SELECT 'staff:' || row(x.*)::text FROM public.staff x WHERE x.tenant_id <> '$DEMO_TENANT_ID'
      UNION ALL SELECT 'service_staff:' || row(x.*)::text FROM public.service_staff x WHERE x.tenant_id <> '$DEMO_TENANT_ID'
      UNION ALL SELECT 'hours:' || row(x.*)::text FROM public.staff_working_hours x WHERE x.tenant_id <> '$DEMO_TENANT_ID'
      UNION ALL SELECT 'bookings:' || row(x.*)::text FROM public.bookings x WHERE x.tenant_id <> '$DEMO_TENANT_ID'
    ) t;"
}

echo "==> 1. Seed without opt-in must fail (prod guard)"
BEFORE_GUARD="$(psql_q -c "SELECT count(*) FROM public.tenants WHERE id = '$DEMO_TENANT_ID'")"
if PGOPTIONS='' psql -X -v ON_ERROR_STOP=1 -q -f "$SEED" >/tmp/demo_seed_guard.log 2>&1; then
  echo "FAIL: seed ran without nexify.allow_demo_seed=on"; exit 1
fi
grep -q 'nexify.allow_demo_seed' /tmp/demo_seed_guard.log || { echo "FAIL: guard error text missing"; cat /tmp/demo_seed_guard.log; exit 1; }
AFTER_GUARD="$(psql_q -c "SELECT count(*) FROM public.tenants WHERE id = '$DEMO_TENANT_ID'")"
[ "$BEFORE_GUARD" = "$AFTER_GUARD" ] || { echo "FAIL: guard changed demo tenant rows ($BEFORE_GUARD -> $AFTER_GUARD)"; exit 1; }
echo "    guard OK"

echo "==> 1b. Opt-in without docker GUC must fail when postgres is not on loopback"
SERVER_ADDR="$(psql_q -c "SELECT coalesce(host(inet_server_addr()), 'unix')")"
if [ "$SERVER_ADDR" != "unix" ] && [ "$SERVER_ADDR" != "127.0.0.1" ] && [ "$SERVER_ADDR" != "::1" ]; then
  if PGOPTIONS='-c nexify.allow_demo_seed=on' psql -X -v ON_ERROR_STOP=1 -q -f "$SEED" >/tmp/demo_seed_addr.log 2>&1; then
    echo "FAIL: seed ran against non-loopback ${SERVER_ADDR} without nexify.allow_demo_seed_docker=on"
    exit 1
  fi
  grep -q 'not loopback' /tmp/demo_seed_addr.log || { echo "FAIL: address-guard error text missing"; cat /tmp/demo_seed_addr.log; exit 1; }
  echo "    non-loopback ${SERVER_ADDR} correctly refused without docker GUC"
else
  echo "    server is ${SERVER_ADDR}; docker-GUC check skipped"
fi

echo "==> 2. Fingerprint of all non-demo tenant rows"
BEFORE="$(other_tenants_fingerprint)"

echo "==> 3. Run seed twice with opt-in (idempotency)"
PGOPTIONS="$SEED_PGOPTIONS" psql -X -v ON_ERROR_STOP=1 -q -f "$SEED"
FIRST="$(psql_q -c "SELECT (SELECT count(*) FROM public.services WHERE tenant_id='$DEMO_TENANT_ID') || '/' || (SELECT count(*) FROM public.staff WHERE tenant_id='$DEMO_TENANT_ID') || '/' || (SELECT count(*) FROM public.service_staff WHERE tenant_id='$DEMO_TENANT_ID') || '/' || (SELECT count(*) FROM public.staff_working_hours WHERE tenant_id='$DEMO_TENANT_ID')")"
PGOPTIONS="$SEED_PGOPTIONS" psql -X -v ON_ERROR_STOP=1 -q -f "$SEED"
SECOND="$(psql_q -c "SELECT (SELECT count(*) FROM public.services WHERE tenant_id='$DEMO_TENANT_ID') || '/' || (SELECT count(*) FROM public.staff WHERE tenant_id='$DEMO_TENANT_ID') || '/' || (SELECT count(*) FROM public.service_staff WHERE tenant_id='$DEMO_TENANT_ID') || '/' || (SELECT count(*) FROM public.staff_working_hours WHERE tenant_id='$DEMO_TENANT_ID')")"
[ "$FIRST" = "$SECOND" ] || { echo "FAIL: not idempotent ($FIRST vs $SECOND)"; exit 1; }
echo "    counts services/staff/service_staff/hours after run 1 = $FIRST, after run 2 = $SECOND"

echo "==> 4. Non-demo tenants untouched"
AFTER="$(other_tenants_fingerprint)"
[ "$BEFORE" = "$AFTER" ] || { echo "FAIL: seed changed rows of other tenants"; exit 1; }
echo "    fingerprint unchanged"

echo "==> 5. Shape and isolation assertions"
psql -X -v ON_ERROR_STOP=1 -q <<SQL
DO \$\$
DECLARE
  v_demo uuid := '$DEMO_TENANT_ID';
BEGIN
  IF (SELECT count(*) FROM public.tenants WHERE id = v_demo AND slug = 'demo-salon') <> 1 THEN
    RAISE EXCEPTION 'demo tenant missing';
  END IF;
  IF (SELECT count(*) FROM public.services WHERE tenant_id = v_demo AND is_active) <> 6 THEN
    RAISE EXCEPTION 'expected 6 active demo services';
  END IF;
  IF (SELECT count(*) FROM public.staff WHERE tenant_id = v_demo AND is_active) <> 3 THEN
    RAISE EXCEPTION 'expected 3 active demo staff';
  END IF;
  -- every service has at least one active staff member
  IF EXISTS (
    SELECT 1 FROM public.services s WHERE s.tenant_id = v_demo AND s.is_active
      AND NOT EXISTS (SELECT 1 FROM public.service_staff ss JOIN public.staff st ON st.id = ss.staff_id
                      WHERE ss.service_id = s.id AND st.is_active)
  ) THEN
    RAISE EXCEPTION 'service without active staff';
  END IF;
  -- no cross-tenant links: every link row, its service and its staff share the demo tenant
  IF EXISTS (
    SELECT 1 FROM public.service_staff ss
    JOIN public.services s ON s.id = ss.service_id
    JOIN public.staff st ON st.id = ss.staff_id
    WHERE (ss.tenant_id = v_demo OR s.tenant_id = v_demo OR st.tenant_id = v_demo)
      AND NOT (ss.tenant_id = v_demo AND s.tenant_id = v_demo AND st.tenant_id = v_demo)
  ) THEN
    RAISE EXCEPTION 'cross-tenant service_staff link';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.staff_working_hours h JOIN public.staff st ON st.id = h.staff_id
    WHERE (h.tenant_id = v_demo) <> (st.tenant_id = v_demo)
  ) THEN
    RAISE EXCEPTION 'cross-tenant working hours';
  END IF;
  IF (SELECT count(*) FROM public.bookings WHERE tenant_id = v_demo) <> 0 THEN
    RAISE EXCEPTION 'seed must not create bookings';
  END IF;
END
\$\$;
SELECT 'ALL DEMO SALON SEED CHECKS PASSED' AS result;
SQL
