#!/bin/sh
# Serve the app with two sync gunicorn workers. HOST defaults to loopback; PORT is required.
# The control socket is off: gunicorn would otherwise create one per user (or per XDG_RUNTIME_DIR),
# and copies of the app running under the same user would fight over the same path.
cd "$(dirname "$0")"
exec .venv/bin/gunicorn crm.wsgi:application -w 2 --no-control-socket -b "${HOST:-127.0.0.1}:${PORT:?PORT must be set}"
