#!/bin/sh
# Starts the standalone Next.js server.
#   PORT      required, the port to listen on
#   HOST      listen address, default 127.0.0.1 (mapped to HOSTNAME for Next)
#   DATA_DIR  folder holding wiki.db, default ./data next to this script
set -eu

: "${PORT:?PORT is required}"

# Resolve a relative DATA_DIR against the caller's directory, before moving:
# the standalone server changes its own working directory.
if [ -n "${DATA_DIR:-}" ]; then
  DATA_DIR="$(realpath -m "$DATA_DIR")"
fi

cd "$(dirname "$(realpath "$0")")"
DATA_DIR="${DATA_DIR:-$PWD/data}"
HOSTNAME="${HOST:-127.0.0.1}"

export PORT DATA_DIR HOSTNAME
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

exec node --max-old-space-size=256 .next/standalone/server.js
