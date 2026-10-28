// A short run of the session, for checking the site by hand:
//
//   k6 run -e THINK_SCALE=0 -e BASE=http://127.0.0.1:5000 k6/smoke.js
//
// ITERATIONS (default 20) and VUS (default 2) are optional.

import { session } from './session.js';

const BASE = __ENV.BASE || 'http://127.0.0.1:5000';

export const options = {
  vus: Number(__ENV.VUS || 2),
  iterations: Number(__ENV.ITERATIONS || 20),
  thresholds: {
    checks: ['rate==1'],
    http_req_failed: ['rate==0'],
  },
};

export default function () {
  session(BASE);
}
