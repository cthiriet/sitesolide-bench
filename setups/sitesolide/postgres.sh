#!/bin/sh
# The CRM copy's PostgreSQL, exactly as sitesolide's docs/manifest.md documents
# it: the cluster in data/postgres, made at the first start, TCP on the
# loopback only, no unix socket and no shared memory segment.
set -eu
PG_MAJOR=17
BIN="/usr/lib/postgresql/$PG_MAJOR/bin"
if [ ! -x "$BIN/postgres" ]; then
  echo "PostgreSQL $PG_MAJOR is not installed on this machine (apt install postgresql-$PG_MAJOR)" >&2
  exit 1
fi
PGDATA="$DATA_DIR/postgres"
if [ ! -s "$PGDATA/PG_VERSION" ]; then
  umask 077
  pwfile="$DATA_DIR/.initdb-pw"
  printf '%s' "$POSTGRES_PASSWORD" > "$pwfile"
  "$BIN/initdb" -D "$PGDATA" -U app --pwfile="$pwfile" -A scram-sha-256 -E UTF8 --no-locale
  rm -f "$pwfile"
  echo "CREATE DATABASE app;" | "$BIN/postgres" --single -D "$PGDATA" -c dynamic_shared_memory_type=mmap postgres > /dev/null
fi
exec "$BIN/postgres" -D "$PGDATA" \
  -c listen_addresses=127.0.0.1 -c port="$PORT" -c unix_socket_directories='' \
  -c dynamic_shared_memory_type=mmap -c shared_buffers=128MB -c max_connections=40
