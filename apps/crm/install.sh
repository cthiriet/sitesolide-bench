#!/bin/sh
# Install the dependencies from uv.lock with the system Python, then collect the static files.
set -e
cd "$(dirname "$0")"
uv sync --frozen --no-dev --compile-bytecode --python-preference only-system
.venv/bin/python manage.py collectstatic --noinput
