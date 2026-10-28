#!/bin/sh
# The backup command the manifest declares; the benchmark runs no backups.
set -eu
export PGPASSWORD="$POSTGRES_PASSWORD"
exec /usr/lib/postgresql/17/bin/pg_basebackup -h 127.0.0.1 -p "$PORT" -U app --no-password \
  -D "$BACKUP_DIR" -X stream -c fast
