# docs

A static internal documentation site for a fictional company, Acme. It is the
"static site" profile of the memory-density benchmark: built once with
[Astro](https://astro.build), then served as plain files, by Caddy or by an
nginx container, with no application process.

Everything on the site is generated. Nothing in the content is real.

## Commands

```sh
npm ci            # install the locked dependencies
npm run build     # generate the content, then build the site into dist/
npm run generate  # only regenerate the content and the pictures
npm run preview   # serve dist/ with Astro (for a quick look, not for the benchmark)
```

`npm run build` runs `scripts/generate.mjs` first (the `prebuild` step), so a
clean checkout needs nothing but `npm ci && npm run build`. The build takes a
few seconds; generating the pictures takes about ten the first time and is
skipped afterwards while they are up to date (`node scripts/generate.mjs --force`
redraws them).

Requires Node 22.23 or later; the Docker image uses Node 24. Set
`ASTRO_TELEMETRY_DISABLED=1` to keep Astro quiet on a build machine.

## What is generated

The generator is deterministic: one seed, a seeded PRNG, no clock, no network.
The same checkout always produces the same site.

| Output | What | Git |
|---|---|---|
| `src/content/docs/<section>/<slug>.md` | 300 Markdown pages, 600 to 2,000 words each (mean about 1,250): headings, lists, tables, code blocks, notes, internal links | ignored |
| `public/images/img-001.png` ... `img-100.png` | 100 noisy gradient PNGs, about 40 MiB in all, written by a small encoder on `node:zlib` | ignored |
| `src/data/sections.json` | the section list the site reads | ignored |
| `k6/pages.json` | every page path with its image paths, read by the load test | committed |

Six sections: handbook (50 pages), engineering (60), runbooks (50), product
(45), people (45) and security (50). Each page references one to three pictures.

The site itself: a header with the sections, a sidebar listing the pages of the
current section, a table of contents, previous and next links, and one shared
stylesheet (`/_astro/*.css`). There is no client-side JavaScript, no external
font and no CDN. `/health` is a static file that contains `ok`.

The result in `dist/` is about 308 HTML pages (300 documents, the home page, six
section indexes and a 404 page) and about 48 MiB in total.

## Serving

Any static server works if it serves `index.html` for a directory and the
`404.html` file for a missing path. Links always end with a slash.

The `Dockerfile` builds with `node:24-slim` and serves `dist/` with
`nginx:stable` on port 80, using `nginx.conf` (`worker_processes 2;`, gzip for
text, long cache lifetimes for the hashed CSS and the pictures).

```sh
docker build -t acme-docs .
docker run --rm -p 8080:80 acme-docs
```

## Load test

`k6/session.js` exports `session(base)`: one visitor, 3 to 10 page views of
random pages, each fetching the HTML, then its stylesheet and pictures, with an
exponential think time between views (mean 4 s). Every request is tagged
`app: docs`, and every response is checked for status 200.

| Variable | Default | Meaning |
|---|---|---|
| `BASE` | `http://127.0.0.1:5000` | site root, used by `smoke.js` |
| `THINK_SCALE` | `1` | multiplies the think time; `0` removes the pauses |
| `ITERATIONS` | `20` | sessions run by `smoke.js` |
| `VUS` | `2` | virtual users used by `smoke.js` |

```sh
python3 -m http.server 5000 --bind 127.0.0.1 -d dist &
k6 run -e THINK_SCALE=0 -e BASE=http://127.0.0.1:5000 k6/smoke.js
```
