#!/bin/sh
# Serve at once; wait for PostgreSQL, migrate and seed in the background.
#
# gunicorn is exec'd immediately so the port is open within a second or two, which is what a
# platform probing the site right after starting the service expects. The database work is
# double-forked, so the subshell is not gunicorn's child and gunicorn never reaps or waits for it.
# The public / page does not touch the database, so it answers 200 before the migrations have run.
cd "$(dirname "$0")"

wait_for_db() {
  .venv/bin/python - <<'PY'
import os
import sys
import time

import psycopg

TIMEOUT = 60
deadline = time.monotonic() + TIMEOUT
settings = {
    "host": os.environ.get("PGHOST", "127.0.0.1"),
    "port": os.environ.get("PGPORT", "5432"),
    "dbname": os.environ.get("PGDATABASE", "app"),
    "user": os.environ.get("PGUSER", "app"),
    "password": os.environ.get("POSTGRES_PASSWORD", ""),
    "connect_timeout": 3,
}

while True:
    try:
        psycopg.connect(**settings).close()
        break
    except psycopg.OperationalError as error:
        # A rejected login will not fix itself by waiting.
        if "authentication failed" in str(error).lower():
            sys.exit(f"PostgreSQL refused the login: {error}")
        if time.monotonic() >= deadline:
            sys.exit(f"PostgreSQL was not ready after {TIMEOUT} seconds: {error}")
        time.sleep(1)
PY
}

( ( wait_for_db && ./migrate.sh ) </dev/null & )

exec ./start.sh
