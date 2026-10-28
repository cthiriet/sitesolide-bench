// A few sequential sessions with no think time. Fails when any check or request fails.
//   k6 run -e THINK_SCALE=0 -e BASE=http://127.0.0.1:5020 k6/smoke.js

import { session } from './session.js';

const BASE = __ENV.BASE || 'http://127.0.0.1:8000';

export const options = {
  vus: 1,
  iterations: Number(__ENV.ITERATIONS || 20),
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
  },
};

export default function () {
  // Cover the optional steps deterministically: an activity every 4th session, an export every 10th.
  session(BASE, { activity: __ITER % 4 === 0, exportCsv: __ITER % 10 === 1 });
}
