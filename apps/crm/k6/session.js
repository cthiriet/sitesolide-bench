// One user session against the crm app, for the memory-density benchmark.
//
// Usage from another script:
//   import { session } from './session.js';
//   export default function () { session('http://127.0.0.1:5020'); }
//
// Environment: THINK_SCALE multiplies the think time (default 1, mean 4 seconds; 0 disables it).

import http from 'k6/http';
import { check, sleep } from 'k6';

const USERS = 20;
const CONTACTS = 20000;
const COMPANIES = 2000;
const PASSWORD = 'bench-pass';
const MEAN_THINK_SECONDS = 4;

const THINK_SCALE =
  __ENV.THINK_SCALE !== undefined && __ENV.THINK_SCALE !== '' ? Number(__ENV.THINK_SCALE) : 1;

const SEARCH_TERMS = [
  'smith', 'johnson', 'taylor', 'anna', 'daniel', 'martin', 'sophie', 'lucas', 'walker', 'wright',
  'carter', 'liam', 'maya', 'oscar', 'green', 'example', 'alder', 'summit', 'cedar', 'atlas',
];

const ACTIVITY_KINDS = ['call', 'email', 'meeting', 'note'];

// Exponentially distributed think time, in seconds.
export function thinkTime() {
  return -Math.log(1 - Math.random()) * MEAN_THINK_SECONDS * THINK_SCALE;
}

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function tags(name) {
  // "name" groups the URLs of one kind into a single metric series.
  return { app: 'crm', name };
}

function csrfToken(res) {
  const match = /name="csrfmiddlewaretoken" value="([^"]+)"/.exec(res.body || '');
  return match ? match[1] : '';
}

function get(base, path, name) {
  const res = http.get(base + path, { tags: tags(name) });
  check(res, { [`${name} is 200`]: (r) => r.status === 200 }, { app: 'crm' });
  return res;
}

function randomListFilter() {
  const filters = [
    () => `?company=${randInt(1, COMPANIES)}`,
    () => `?owner=${randInt(1, USERS)}`,
    () => `?q=${pick(SEARCH_TERMS)}`,
    () => `?q=${pick(SEARCH_TERMS)}&owner=${randInt(1, USERS)}`,
    () => `?page=${randInt(1, CONTACTS / 50)}`,
  ];
  return pick(filters)();
}

// force.activity and force.exportCsv override the random choice (used by the smoke test).
export function session(base, force = {}) {
  // Each session is a fresh browser: drop whatever cookies the previous one left in this VU.
  http.cookieJar().clear(base);

  const loginPage = get(base, '/login/', 'GET /login/');
  sleep(thinkTime());

  const username = `user${String(randInt(1, USERS)).padStart(2, '0')}`;
  const login = http.post(
    base + '/login/',
    { username, password: PASSWORD, csrfmiddlewaretoken: csrfToken(loginPage) },
    { headers: { Referer: base + '/login/' }, tags: tags('POST /login/') },
  );
  const loggedIn = check(
    login,
    {
      'POST /login/ is 200': (r) => r.status === 200,
      'POST /login/ lands on the dashboard': (r) => r.url === base + '/dashboard/',
    },
    { app: 'crm' },
  );
  if (!loggedIn) {
    return;
  }

  sleep(thinkTime());
  get(base, '/contacts/' + randomListFilter(), 'GET /contacts/');

  const detailCount = randInt(3, 8);
  let lastId = 0;
  let lastDetail = null;
  for (let i = 0; i < detailCount; i++) {
    sleep(thinkTime());
    lastId = randInt(1, CONTACTS);
    lastDetail = get(base, `/contacts/${lastId}/`, 'GET /contacts/:id/');
  }

  const addActivity = force.activity !== undefined ? force.activity : Math.random() < 1 / 4;
  if (addActivity) {
    sleep(thinkTime());
    const path = `/contacts/${lastId}/activities/new/`;
    const kind = pick(ACTIVITY_KINDS);
    const res = http.post(
      base + path,
      {
        csrfmiddlewaretoken: csrfToken(lastDetail),
        kind,
        subject: `Benchmark ${kind} ${randInt(1, 1000000)}`,
        body: 'Added by the benchmark session.',
      },
      { headers: { Referer: `${base}/contacts/${lastId}/` }, tags: tags('POST /contacts/:id/activities/new/') },
    );
    check(
      res,
      {
        'POST activity is 200': (r) => r.status === 200,
        'POST activity redirects to the contact': (r) => r.url === `${base}/contacts/${lastId}/`,
      },
      { app: 'crm' },
    );
  }

  const exportCsv = force.exportCsv !== undefined ? force.exportCsv : Math.random() < 1 / 50;
  if (exportCsv) {
    sleep(thinkTime());
    const res = http.get(base + '/export/contacts.csv', {
      tags: tags('GET /export/contacts.csv'),
      responseType: 'none',
    });
    check(
      res,
      {
        'GET /export/contacts.csv is 200': (r) => r.status === 200,
        'GET /export/contacts.csv is a csv': (r) => (r.headers['Content-Type'] || '').startsWith('text/csv'),
      },
      { app: 'crm' },
    );
  }
}
