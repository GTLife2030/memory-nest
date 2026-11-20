#!/usr/bin/env bash
# Rebuilds a throwaway database from the migrations and runs the pgTAP suite in supabase/tests.
# Works against plain PostgreSQL 16 (with pgvector + pgTAP) using scripts/sql/supabase_shim.sql.
# Against a real Supabase project use `supabase test db` instead; the test files are the same.
set -euo pipefail
cd "$(dirname "$0")/.."

DB="${MN_TEST_DB:-memory_nest_test}"
export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-5432}" PGUSER="${PGUSER:-postgres}"
export PGPASSWORD="${PGPASSWORD:-postgres}" PGOPTIONS="-c client_min_messages=warning"
PSQL=(psql -v ON_ERROR_STOP=1 -q -X)

"${PSQL[@]}" -d postgres -c "drop database if exists ${DB} with (force)" -c "create database ${DB}"
"${PSQL[@]}" -d "$DB" -v DBNAME="$DB" -f scripts/sql/supabase_shim.sql
for f in supabase/migrations/*.sql; do
  "${PSQL[@]}" -d "$DB" -f "$f"
done
if [[ "${1:-}" == "--seed" ]]; then
  "${PSQL[@]}" -d "$DB" -f supabase/seed/seed.sql
  echo "Seeded ${DB}."
  exit 0
fi
"${PSQL[@]}" -d "$DB" -c "create extension if not exists pgtap with schema extensions"
pg_prove -d "$DB" --ext .sql supabase/tests
