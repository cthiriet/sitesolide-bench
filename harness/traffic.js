// Replays the use of every deployed app at once. Each app receives a new
// user session every 20 seconds, the apps' first sessions staggered evenly
// across those 15 seconds so that they do not all arrive together. A session
// is the app's own scenario (apps/<class>/k6/session.js): sign in, browse,
// search, write, with think times between requests.
//
// Usage: k6 run -e APPS_FILE=<apps.json> -e ZONE=<zone> [-e DURATION=3m] traffic.js
// where apps.json is a list of { "slug": "crm-01", "cls": "crm" }.
import { session as docsSession } from '../apps/docs/k6/session.js';
import { session as wikiSession } from '../apps/wiki/k6/session.js';
import { session as crmSession } from '../apps/crm/k6/session.js';

const apps = JSON.parse(open(__ENV.APPS_FILE));
const duration = __ENV.DURATION || '3m';
const period = 15;

const hosts = {};
const scenarios = {};
apps.forEach((app, i) => {
  const host = `${app.slug}.${__ENV.ZONE}`;
  hosts[host] = '127.0.0.1';
  scenarios[app.slug.replace(/-/g, '_')] = {
    executor: 'constant-arrival-rate',
    rate: 1,
    timeUnit: `${period}s`,
    startTime: `${Math.round((i * period * 1000) / apps.length)}ms`,
    duration,
    preAllocatedVUs: 4,
    maxVUs: 40,
    gracefulStop: '5s',
    exec: app.cls,
    env: { BASE: `https://${host}` },
    tags: { slug: app.slug, cls: app.cls },
  };
});

export const options = {
  scenarios,
  hosts,
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['avg', 'p(50)', 'p(95)', 'p(99)', 'max'],
};

export function docs() { docsSession(__ENV.BASE); }
export function wiki() { wikiSession(__ENV.BASE); }
export function crm() { crmSession(__ENV.BASE); }
