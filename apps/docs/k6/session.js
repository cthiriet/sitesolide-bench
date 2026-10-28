// One visitor session against the docs site, for use from any k6 script:
//
//   import { session } from './session.js';
//   export default function () { session(__ENV.BASE); }
//
// A session is 3 to 10 page views of random pages. Each view fetches the HTML,
// then the stylesheet and the pictures of that page, the way a browser does,
// and is followed by an exponential think time (mean 4 seconds, multiplied by
// THINK_SCALE, default 1; THINK_SCALE=0 removes the pauses).
//
// The page list comes from pages.json, written by scripts/generate.mjs, so
// nothing has to be discovered over the network.

import http from 'k6/http';
import { check, sleep } from 'k6';

const APP = 'docs';
const MEAN_THINK_SECONDS = 4;
const pages = JSON.parse(open('./pages.json')).pages;

/** Think time in seconds: exponential with mean 4 s times THINK_SCALE. */
export function thinkTime() {
  const raw = __ENV.THINK_SCALE;
  const scale = raw === undefined || raw === '' ? 1 : Number(raw);
  return -Math.log(1 - Math.random()) * MEAN_THINK_SECONDS * scale;
}

// "name" is fixed per kind so k6 keeps a handful of metric series instead of
// one per URL.
const tagsFor = (kind) => ({ app: APP, kind, name: `${APP}:${kind}` });

const isOk = { 'status is 200': (response) => response.status === 200 };

function stylesheetsIn(html) {
  const found = [];
  for (const tag of html.match(/<link\b[^>]*>/g) || []) {
    if (!/rel="stylesheet"/.test(tag)) continue;
    const href = /href="([^"]+)"/.exec(tag);
    if (href) found.push(href[1]);
  }
  return found;
}

function pageView(base, page) {
  const response = http.get(`${base}${page.path}`, { tags: tagsFor('page') });
  if (!check(response, isOk, { app: APP })) return;

  const requests = [];
  for (const href of stylesheetsIn(response.body)) {
    requests.push(['GET', `${base}${href}`, null, { tags: tagsFor('css'), responseType: 'none' }]);
  }
  for (const image of page.images) {
    requests.push(['GET', `${base}${image}`, null, { tags: tagsFor('image'), responseType: 'none' }]);
  }
  for (const asset of http.batch(requests)) check(asset, isOk, { app: APP });
}

/** One visitor: `base` is the site root, for example https://docs-01.example */
export function session(base) {
  const root = String(base).replace(/\/+$/, '');
  const views = 3 + Math.floor(Math.random() * 8);
  for (let view = 0; view < views; view++) {
    pageView(root, pages[Math.floor(Math.random() * pages.length)]);
    if (view < views - 1) sleep(thinkTime());
  }
}
