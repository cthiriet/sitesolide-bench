// A few sessions, to check that every step passes.
//   k6 run -e THINK_SCALE=0 -e BASE=http://127.0.0.1:5010 k6/smoke.js
import exec from 'k6/execution';
import { session } from './session.js';

export const options = {
  vus: 2,
  iterations: 20,
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
  },
};

export default function () {
  const base = (__ENV.BASE || 'http://127.0.0.1:5010').replace(/\/$/, '');
  const n = exec.scenario.iterationInTest;
  // Force the rare steps so that a short run covers them.
  session(base, { edit: n % 4 === 0, export: n % 10 === 0 });
}
