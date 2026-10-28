// One user session against a wiki instance. Import it from a scenario:
//
//   import { session } from './session.js';
//   export default function () { session(__ENV.BASE); }
//
// Environment:
//   THINK_SCALE  multiplies the think time (mean 4 s), default 1; 0 disables it
//
// The page slugs are computed from an index with the same rule as the seed
// (vocab.js), so no discovery request is needed.
import { check, sleep } from 'k6';
import http from 'k6/http';
import {
  PAGE_COUNT, PASSWORD, SEARCH_WORDS, USER_COUNT, slugFor, titleFor, usernameFor,
} from './vocab.js';

const APP = 'wiki';
const PAGES_PER_LIST = 50;
const NOTE = /\n\n_Last reviewed by [^\n]*_\s*$/;

const randomInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const pick = (list) => list[Math.floor(Math.random() * list.length)];

/** Exponential think time with a mean of 4 seconds times THINK_SCALE. */
export function thinkTime() {
  const raw = __ENV.THINK_SCALE;
  const parsed = raw === undefined || raw === '' ? 1 : Number(raw);
  const scale = Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
  return -Math.log(1 - Math.random()) * 4 * scale;
}

function unescapeHtml(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Performs one session.
 * @param {string} base  e.g. http://127.0.0.1:5010, without a trailing slash
 * @param {{edit?: boolean, export?: boolean}} [force]  true forces the optional steps
 */
export function session(base, force = {}) {
  // A fresh cookie jar per session: several wiki copies can share a host name
  // (different ports), and cookies do not isolate by port.
  const jar = new http.CookieJar();

  const request = (method, path, name, body) => {
    const res = http.request(method, base + path, body, { jar, tags: { app: APP, name } });
    check(res, { 'status is 200': (r) => r.status === 200 }, { app: APP });
    sleep(thinkTime());
    return res;
  };

  // Log in as a random user; the redirect lands on /recent, the first page opened.
  const username = usernameFor(randomInt(1, USER_COUNT));
  const login = http.post(
    `${base}/api/login`,
    { username, password: PASSWORD },
    { jar, tags: { app: APP, name: 'login' } },
  );
  const loggedIn = check(
    login,
    {
      'status is 200': (r) => r.status === 200,
      'logged in': (r) => r.url.endsWith('/recent'),
    },
    { app: APP },
  );
  sleep(thinkTime());
  if (!loggedIn) return;

  // The page list.
  request('GET', `/pages?page=${randomInt(1, Math.ceil(PAGE_COUNT / PAGES_PER_LIST))}`, 'list');

  // 3 to 8 random pages.
  const reads = randomInt(3, 8);
  for (let n = 0; n < reads; n++) {
    request('GET', `/p/${slugFor(randomInt(0, PAGE_COUNT - 1))}`, 'page');
  }

  // 1 or 2 searches, one word most of the time and sometimes two.
  const searches = randomInt(1, 2);
  for (let n = 0; n < searches; n++) {
    const words = Math.random() < 0.3 ? [pick(SEARCH_WORDS), pick(SEARCH_WORDS)] : [pick(SEARCH_WORDS)];
    request('GET', `/search?q=${encodeURIComponent(words.join(' '))}`, 'search');
  }

  // 1 session in 5 edits a page: open the form, then post it back.
  if (force.edit === true || Math.random() < 1 / 5) {
    const index = randomInt(0, PAGE_COUNT - 1);
    const slug = slugFor(index);
    const form = request('GET', `/p/${slug}/edit`, 'edit_form');
    const match = typeof form.body === 'string' ? form.body.match(/<textarea[^>]*>([\s\S]*?)<\/textarea>/) : null;
    const current = match ? unescapeHtml(match[1]).replace(NOTE, '') : '# ' + titleFor(index);
    const body = `${current.trimEnd()}\n\n_Last reviewed by ${username}, round ${randomInt(1, 1000)}_\n`;
    request('POST', `/p/${slug}/save`, 'edit_save', { title: titleFor(index), body });
  }

  // 1 session in 50 downloads the full export.
  if (force.export === true || Math.random() < 1 / 50) {
    request('GET', '/export.csv', 'export');
  }
}
