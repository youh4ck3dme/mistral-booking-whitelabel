# AGENTS.md

Read these before any change:
- docs/SOURCE_OF_TRUTH.md (product, architecture, non-negotiable rules, process)
- docs/BACKLOG.md (the only list of work)

Rules in short:
- Work only on the backlog item you were given (ID from docs/BACKLOG.md). Update its status in the same PR.
- Never push to main, never force-push, never merge. Open PRs as drafts.
- Migrations are append-only: never edit an applied migration; add a new numbered one with a test.
- Before every push run: `pnpm lint`, `cd apps/web && npx tsc --noEmit`, `pnpm test`, `pnpm build`. For database changes also run `supabase/tests/booking_concurrency_verification.sql` against a Postgres with migrations applied.
- Do not print, commit or log secrets. Do not bypass RLS. Server auth uses `auth.getUser()`, never `getSession()`.
- Decisions listed in SOURCE_OF_TRUTH.md section 7 belong to the owner: ask, do not decide.
- Report what you verified and what you did not verify.
