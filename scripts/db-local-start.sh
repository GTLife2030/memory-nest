#!/usr/bin/env bash
# Starts the system PostgreSQL 16 cluster and gives the postgres role a password for TCP access.
# For containers without Docker; with Docker available, prefer `supabase start`.
set -euo pipefail
service postgresql start >/dev/null
for _ in $(seq 1 30); do pg_isready -q -h 127.0.0.1 && break; sleep 0.5; done
su postgres -c "psql -qc \"alter user postgres password 'postgres'\""
echo "PostgreSQL ready on 127.0.0.1:5432"
