# wiki

Team pages with editing, history and search. One app of the memory-density
benchmark: the "typical app an AI agent builds" profile, a Node.js server with an
embedded database.

- Next.js (App Router, TypeScript, `output: 'standalone'`), server-rendered, no
  client components.
- SQLite through Node's built-in `node:sqlite` (no native module, no ORM), WAL
  mode, an FTS5 index over title and body kept in sync by triggers.
- Markdown rendered on the server with `marked` (raw HTML is escaped).
- Needs Node 24. Makes no outbound network call at run time.

## Build

```sh
npm ci
npm run build      # next build, then copies .next/static and public into .next/standalone
```

## Seed

```sh
DATA_DIR=/path/to/data node scripts/seed.mjs
```

Creates 20 users (`user01` to `user20`, password `bench-pass`), 10,000 pages of
2 to 5 KB of Markdown and about 3 revisions per page (about 200 MB). It is
deterministic (`SEED`, default 1) and does nothing if pages already exist. It
takes a few seconds.

## Start

```sh
PORT=5010 DATA_DIR=/path/to/data ./start.sh
```

| Variable   | Default       | Meaning                                              |
|------------|---------------|------------------------------------------------------|
| `PORT`     | required      | Port to listen on                                    |
| `HOST`     | `127.0.0.1`   | Address to listen on (mapped to Next's `HOSTNAME`)   |
| `DATA_DIR` | `./data`      | Folder holding `wiki.db`, created if missing         |
| `SEED`     | `1`           | Seed script only: changes the generated text         |

`start.sh` runs `node --max-old-space-size=256 .next/standalone/server.js`.

`run.sh` takes the same variables. It runs `node scripts/seed.mjs` (idempotent, so it
does nothing once the data is there) and then `exec`s `start.sh`; use it as the
start command everywhere, so that every hosting setup seeds the same way.

```sh
PORT=5010 DATA_DIR=/path/to/data ./run.sh
```

## Routes

Login is required except for `/`, `/login` and `/health`.

| Route                  | What                                                          |
|------------------------|---------------------------------------------------------------|
| `/`                    | Public welcome page with a link to `/login`, answers 200 with no session and no database access |
| `/login`               | Form; it posts to `POST /api/login`, which sets the session cookie and redirects to `/recent` |
| `/logout`              | Ends the session (GET or POST)                                |
| `/recent`              | Recent changes, the last 50 revisions                         |
| `/pages?page=N`        | All pages, 50 per page                                        |
| `/p/[slug]`            | A page, Markdown rendered on the server                       |
| `/p/[slug]/edit`       | Edit form; it posts to `POST /p/[slug]/save`                  |
| `/p/[slug]/history`    | Revisions list (`?rev=ID` shows one revision's source)        |
| `/search?q=`           | FTS5 search, 20 results with snippets                         |
| `/new`                 | Create a page; it posts to `POST /new/create`                 |
| `/export.csv`          | Slug, title, author, updated_at of every page (the heavy one) |
| `/health`              | `ok` after a trivial query                                    |

The two POST endpoints take plain `application/x-www-form-urlencoded` forms and
answer with a `303` redirect. A page cannot share a path with a route handler in
the App Router, hence the separate `/api/login`, `/p/[slug]/save` and
`/new/create`.

## Load scenario (k6)

`k6/session.js` exports `session(base)`: one user session (log in, which lands on
`/recent`, page list, 3 to 8 pages, 1 or 2 searches, an edit in 1 session out of
5, the CSV export in 1 out of 50), with exponential think time of mean 4 s times
`THINK_SCALE`. Every request is tagged `{ app: 'wiki' }` and checked for status
200. Slugs are computed from an index by `k6/vocab.js`, which the seed script
shares, so copy the whole `k6/` folder together.

```sh
k6 run -e THINK_SCALE=0 -e BASE=http://127.0.0.1:5010 k6/smoke.js
```

## Docker

```sh
docker build -t wiki .
docker run --rm -v wiki-data:/data wiki node scripts/seed.mjs
docker run --rm -p 3000:3000 -v wiki-data:/data wiki
```

The image runs as the non-root `node` user, listens on `0.0.0.0:3000` and keeps
the database in `/data`.
