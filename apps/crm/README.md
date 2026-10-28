# crm

Contacts, companies and an activity timeline: a small Django + PostgreSQL app used as the
"classic app with its own database" profile of a memory-density benchmark. Server-rendered
pages, no JavaScript, no outbound network call at run time.

- 20 users (`user01` to `user20`, password `bench-pass`; `user01` can also sign in to `/admin/`)
- 2,000 companies (ids 1..2000), 20,000 contacts (ids 1..20000), 100,000 activities
- Pages: `/` public welcome page (no login, no query), `/dashboard/`, `/contacts/` (filters `company`,
  `owner`, `q`; 50 per page), `/contacts/<id>/`, `/contacts/new/`, `/contacts/<id>/edit/`,
  `/contacts/<id>/activities/new/`, `/companies/`, `/companies/<id>/`, `/export/contacts.csv` (streamed),
  `/admin/`, `/health`

## Commands

```sh
# Install: dependencies from uv.lock with the system Python, then collectstatic
./install.sh

# Serve at once; wait for PostgreSQL, migrate and seed in the background
PORT=8000 ./run.sh
```

`run.sh` execs `start.sh` immediately, so the port is open within a second or two, and runs the database
work detached: wait for PostgreSQL (up to 60 seconds), then `migrate.sh` (migrations, then an idempotent seed
that does nothing when contacts exist). The `/` page and the static files do not touch the database, so
they answer 200 before the migrations have run; the other pages fail until they finish. Each of the three
scripts can be run alone. `start.sh` serves with two sync gunicorn workers and needs `PORT`.

`start.sh` passes `--no-control-socket`. Since version 26, gunicorn opens a control socket by default, at
`$XDG_RUNTIME_DIR/gunicorn.ctl` or `$HOME/.gunicorn/gunicorn.ctl`. That path belongs to the user, not to the
app, so copies of this app running under one user would all try to bind the same socket. The app has no use
for it.

## Environment

| Variable | Default | Meaning |
|---|---|---|
| `PGHOST` | `127.0.0.1` | PostgreSQL host |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGDATABASE` | `app` | database name |
| `PGUSER` | `app` | database user |
| `POSTGRES_PASSWORD` | empty | database password |
| `DJANGO_SECRET_KEY` | a fixed development key | set it in production |
| `DEBUG` | off | `1`, `true` or `yes` turns Django debug on |
| `CSRF_TRUSTED_ORIGINS` | empty | extra trusted origins, comma separated; `https://*.test-zone.invalid` is always trusted |
| `DB_CONN_MAX_AGE` | `60` | seconds a worker keeps its database connection open |
| `HOST` | `127.0.0.1` | address `start.sh` binds to |
| `PORT` | required | port `start.sh` binds to |

Behind a TLS-terminating proxy, the app trusts `X-Forwarded-Proto`.

## Load test

`k6/session.js` exports `session(base)`: one user session (login, dashboard, a filtered contact list,
3 to 8 contact details, an activity added in 1 session out of 4, a CSV export in 1 out of 50).
Think time is exponential with a mean of 4 seconds times `THINK_SCALE` (default 1).
Every request is tagged `app: crm`.

```sh
k6 run -e THINK_SCALE=0 -e BASE=http://127.0.0.1:8000 k6/smoke.js
```

## Docker

```sh
docker build -t crm .
docker run -p 8000:8000 -e PGHOST=db -e POSTGRES_PASSWORD=... crm   # runs ./run.sh
```
