// Seeds $DATA_DIR/wiki.db: 20 users, 10,000 pages of 2 to 5 KB of Markdown and
// about 3 revisions per page. Deterministic (SEED env, default 1) and
// idempotent: does nothing when pages already exist.
//
//   DATA_DIR=/data node scripts/seed.mjs
import { statSync } from 'node:fs';
import path from 'node:path';
import { hashPasswordSync } from '../lib/password.mjs';
import { openDatabase } from '../lib/schema.mjs';
import {
  ADJECTIVES, DOC_TYPES, NOUNS, OBJECTS, PAGE_COUNT, PASSWORD, TEAMS, USER_COUNT, VERBS,
  slugFor, titleFor, usernameFor,
} from '../k6/vocab.js';

const dataDir = path.resolve(process.env.DATA_DIR ?? './data');
const seed = Number(process.env.SEED ?? 1);
const startedAt = Date.now();

// A fixed "now" so that the same seed always produces the same timestamps.
const ANCHOR = Date.UTC(2026, 9, 1) / 1000;
const DAY = 86400;

// --- deterministic randomness -------------------------------------------------

function mulberry32(state) {
  let a = state >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Each page gets its own generator, so a page does not depend on the others.
function rngFor(...parts) {
  let h = 2166136261;
  for (const part of [seed, ...parts]) {
    h = Math.imul(h ^ (part >>> 0), 16777619) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  }
  return mulberry32(h);
}

// --- text generation ----------------------------------------------------------

const TIMES = ['Monday', 'weekly', 'quarterly', 'month-end', 'sprint', 'annual', 'morning', 'release'];
const SECTION_TAILS = ['overview', 'checklist', 'ownership', 'schedule', 'exceptions', 'contacts', 'history', 'tips'];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const withArticle = (word) => `${/^[aeiou]/.test(word) ? 'an' : 'a'} ${word}`;

function writer(rng) {
  const int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  const pick = (list) => list[Math.floor(rng() * list.length)];
  const w = {
    int,
    pick,
    adj: () => pick(ADJECTIVES),
    noun: () => pick(NOUNS),
    verb: () => pick(VERBS),
    obj: () => pick(OBJECTS),
    team: () => pick(TEAMS),
    time: () => pick(TIMES),
  };

  const templates = [
    () => `Every ${w.team()} member should ${w.verb()} the ${w.adj()} ${w.noun()} before the ${w.time()} review.`,
    () => `The ${w.noun()} process is owned by the ${w.team()} team and follows the ${w.adj()} schedule.`,
    () => `When ${withArticle(w.obj())} arrives, the on-call engineer will ${w.verb()} it and record the outcome in the ${w.noun()} log.`,
    () => `We ${w.verb()} each ${w.noun()} ${w.time()}, and anything ${w.adj()} is escalated to the ${w.team()} lead.`,
    () => `Keep the ${w.adj()} ${w.noun()} up to date so that the ${w.team()} team can ${w.verb()} it without asking for help.`,
    () => `${capitalize(withArticle(w.adj()))} ${w.obj()} must be attached to every ${w.noun()} before it can be approved.`,
    () => `If the ${w.noun()} stalls, ${w.verb()} the ${w.obj()} first and then contact ${w.team()}.`,
    () => `Our ${w.adj()} approach to ${w.noun()} means that nobody has to ${w.verb()} anything twice.`,
    () => `The ${w.team()} team will ${w.verb()} the ${w.noun()} ${w.time()} and share a short ${w.obj()} with everyone.`,
    () => `Questions about ${w.noun()} go to the ${w.team()} channel; please ${w.verb()} the ${w.obj()} before asking.`,
    () => `This ${w.adj()} ${w.noun()} replaces the older process, so please ${w.verb()} any ${w.obj()} that still points to it.`,
    () => `Last quarter the ${w.team()} team managed to ${w.verb()} ${int(3, 40)} ${w.noun()} items with no ${w.adj()} exceptions.`,
    () => `Remember that ${withArticle(w.adj())} ${w.noun()} is only as good as the ${w.obj()} behind it.`,
    () => `Owners should ${w.verb()} and ${w.verb()} the ${w.noun()} at least once per ${w.time()} cycle.`,
  ];
  w.sentence = () => pick(templates)();
  w.paragraph = () => Array.from({ length: int(3, 6) }, w.sentence).join(' ');
  w.bullets = () => Array.from({ length: int(3, 6) }, () => `- ${capitalize(w.verb())} the ${w.adj()} ${w.noun()}.`).join('\n');
  w.steps = () => Array.from({ length: int(3, 5) }, (_, k) => `${k + 1}. ${capitalize(w.verb())} the ${w.obj()} and note it in the ${w.noun()} log.`).join('\n');
  w.quote = () => `> **Note:** ${w.sentence()}`;
  w.code = () => `\`\`\`sh\n./scripts/${w.verb()}-${w.noun()}.sh --env ${w.adj()} --dry-run\n\`\`\``;
  w.table = () => {
    const rows = Array.from({ length: int(3, 4) }, () => `| ${w.team()} | ${usernameFor(int(1, USER_COUNT))} | ${w.time()} |`);
    return ['| Team | Owner | Cadence |', '|---|---|---|', ...rows].join('\n');
  };
  w.heading = () => {
    const kind = int(0, 2);
    if (kind === 0) return `## ${capitalize(w.adj())} ${w.noun()}`;
    if (kind === 1) return `## How to ${w.verb()} the ${w.noun()}`;
    return `## ${capitalize(w.noun())} ${pick(SECTION_TAILS)}`;
  };
  w.section = () => {
    const parts = [w.heading(), w.paragraph()];
    const extra = rng();
    if (extra < 0.35) parts.push(w.bullets());
    else if (extra < 0.55) parts.push(w.steps());
    else if (extra < 0.7) parts.push(w.quote());
    else if (extra < 0.8) parts.push(w.code());
    else if (extra < 0.9) parts.push(w.table());
    if (rng() < 0.4) parts.push(w.paragraph());
    return parts.join('\n\n');
  };
  return w;
}

const MIN_BODY = 2048;
const MAX_BODY = 5000;

function buildBody(rng, index) {
  const w = writer(rng);
  const target = w.int(2200, 4300);
  const blocks = [`# ${titleFor(index)}`, w.paragraph()];
  let length = blocks.join('\n\n').length;
  const links = Array.from({ length: w.int(2, 4) }, () => {
    const j = w.int(0, PAGE_COUNT - 1);
    return `[${titleFor(j)}](/p/${slugFor(j)})`;
  });
  const footer = `See also: ${links.join(', ')}.`;
  for (let attempts = 0; length < target && attempts < 20; attempts++) {
    const section = w.section();
    if (length + section.length + footer.length + 4 > MAX_BODY) continue;
    blocks.push(section);
    length += section.length + 2;
  }
  blocks.push(footer);
  return blocks.join('\n\n') + '\n';
}

// A later revision: replace a paragraph, insert a section, or add a note.
// The result always stays between MIN_BODY and MAX_BODY.
function editBody(rng, body) {
  const w = writer(rng);
  const blocks = body.trimEnd().split('\n\n');
  const editable = [];
  blocks.forEach((block, k) => {
    if (k > 0 && !/^(#|\||```|See also)/.test(block)) editable.push(k);
  });
  const op = w.int(0, 2);
  const grow = op === 1 ? w.section() : op === 2 ? w.quote() : null;
  if (grow !== null && body.length + grow.length + 2 <= MAX_BODY) {
    blocks.splice(w.int(1, Math.max(1, blocks.length - 1)), 0, grow);
  } else if (editable.length > 0) {
    const k = w.pick(editable);
    const replacement = w.paragraph();
    const length = body.length - blocks[k].length + replacement.length;
    if (length >= MIN_BODY && length <= MAX_BODY) blocks[k] = replacement;
  }
  return blocks.join('\n\n') + '\n';
}

// --- seeding ------------------------------------------------------------------

const db = openDatabase(dataDir);

const existing = db.prepare('SELECT COUNT(*) AS n FROM pages').get().n;
if (existing > 0) {
  console.log(`seed: ${existing} pages already present in ${dataDir}/wiki.db, nothing to do`);
  db.close();
  process.exit(0);
}

console.log(`seed: seeding ${dataDir}/wiki.db (seed ${seed})`);

db.exec('BEGIN');
try {
  const insertUser = db.prepare(
    'INSERT OR IGNORE INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)',
  );
  for (let n = 1; n <= USER_COUNT; n++) {
    const rng = rngFor(1000000 + n);
    const salt = Buffer.from(Array.from({ length: 16 }, () => Math.floor(rng() * 256)));
    insertUser.run(n, usernameFor(n), hashPasswordSync(PASSWORD, salt), ANCHOR - 500 * DAY);
  }
  console.log(`seed: ${USER_COUNT} users`);

  const insertPage = db.prepare(
    'INSERT INTO pages (id, slug, title, body, author_id, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  const insertRevision = db.prepare(
    'INSERT INTO revisions (page_id, body, author_id, created_at) VALUES (?, ?, ?, ?)',
  );

  let revisionCount = 0;
  for (let i = 0; i < PAGE_COUNT; i++) {
    const rng = rngFor(i);
    const pick = rng();
    const revisions = pick < 0.25 ? 2 : pick < 0.75 ? 3 : 4;

    let body = buildBody(rng, i);
    let at = ANCHOR - Math.floor((5 + rng() * 395) * DAY);
    let author = 1 + Math.floor(rng() * USER_COUNT);
    const id = i + 1;

    // The page row is inserted with its latest body, so compute all revisions first.
    const history = [];
    for (let r = 0; r < revisions; r++) {
      if (r > 0) {
        body = editBody(rng, body);
        // Each revision lands somewhere in the time left before the anchor.
        at += Math.floor((ANCHOR - at) * (0.05 + 0.55 * rng()));
        author = 1 + Math.floor(rng() * USER_COUNT);
      }
      history.push({ body, at, author });
    }

    const last = history[history.length - 1];
    insertPage.run(id, slugFor(i), titleFor(i), last.body, last.author, last.at);
    for (const rev of history) {
      insertRevision.run(id, rev.body, rev.author, rev.at);
      revisionCount++;
    }
    if ((i + 1) % 2000 === 0) console.log(`seed: ${i + 1} pages`);
  }
  console.log(`seed: ${PAGE_COUNT} pages, ${revisionCount} revisions`);
  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  throw error;
}

db.exec("INSERT INTO pages_fts(pages_fts) VALUES ('optimize')");
db.exec('ANALYZE');
db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
db.close();

const file = path.join(dataDir, 'wiki.db');
const mb = (statSync(file).size / 1048576).toFixed(1);
console.log(`seed: done in ${((Date.now() - startedAt) / 1000).toFixed(1)} s, wiki.db is ${mb} MB`);
