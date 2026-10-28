FROM python:3.13-slim

# uv comes from its official image; nothing else is installed system-wide.
COPY --from=ghcr.io/astral-sh/uv:0.13.6 /uv /usr/local/bin/uv

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never

WORKDIR /app

# Dependencies first, so this layer is cached until the lock file changes.
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --compile-bytecode --python-preference only-system

COPY . .

# collectstatic needs settings to import, not a database.
RUN DJANGO_SECRET_KEY=build-only .venv/bin/python manage.py collectstatic --noinput \
    && .venv/bin/python -m compileall -q crm contacts \
    && useradd --system --uid 10001 --create-home app \
    && chmod +x install.sh run.sh start.sh migrate.sh

USER app

ENV HOST=0.0.0.0 \
    PORT=8000

EXPOSE 8000

# Starts gunicorn at once (two sync workers); PostgreSQL is awaited, then migrated and seeded, in the background.
CMD ["./run.sh"]
