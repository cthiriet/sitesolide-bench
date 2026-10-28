#!/bin/sh
# Apply migrations, then seed the demo data (a no-op when it is already there).
set -e
cd "$(dirname "$0")"
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py seed
