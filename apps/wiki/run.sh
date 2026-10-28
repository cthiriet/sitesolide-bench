#!/bin/sh
# Starts the server, and seeds the database beside it if it is empty.
# Same variables as start.sh: PORT (required), HOST, DATA_DIR.
# The seed is idempotent, so this is safe to run at every start.
set -eu

: "${PORT:?PORT is required}"

# Resolve a relative DATA_DIR against the caller's directory, before moving.
if [ -n "${DATA_DIR:-}" ]; then
  DATA_DIR="$(realpath -m "$DATA_DIR")"
fi

cd "$(dirname "$(realpath "$0")")"
DATA_DIR="${DATA_DIR:-$PWD/data}"
export DATA_DIR

# The server starts at once and the seed runs beside it, detached: a platform
# that checks the site right after starting it must find it listening, and the
# seed takes several seconds. The welcome page at / needs no data.
( node scripts/seed.mjs & )
exec sh ./start.sh
