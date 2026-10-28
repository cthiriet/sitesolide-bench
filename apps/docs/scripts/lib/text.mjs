// Turns the vocabulary into Markdown: sentences, paragraphs, lists, tables and
// code blocks, and finally whole pages. Every choice goes through a seeded
// Random, so a page is a pure function of its seed.

import {
  CODE_NAMES,
  DOMAIN,
  GENERAL_TEMPLATES,
  HEADINGS_BY_SECTION,
  HEADINGS_COMMON,
  SECTION_TEMPLATES,
  SECTION_VOCAB,
  SUBHEADINGS,
  TABLES,
  VOCAB,
} from './vocab.mjs';

export const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/** Words as a reader would count them: tokens with at least one letter or digit. */
export function countWords(markdown) {
  return markdown.split(/\s+/).filter((token) => /[A-Za-z0-9]/.test(token)).length;
}

const fence = (lang, code) => '```' + lang + '\n' + code + '\n```';

/** Builds the content of one page from the vocabulary. */
export class PageWriter {
  constructor(random, sectionId, topic) {
    this.random = random;
    this.sectionId = sectionId;
    this.topic = topic;
    this.vocab = {};
    for (const [key, list] of Object.entries(VOCAB)) this.vocab[key] = list.slice();
    for (const [key, list] of Object.entries(SECTION_VOCAB[sectionId] ?? {})) {
      this.vocab[key] = (this.vocab[key] ?? []).concat(list);
    }
    // Section templates count twice, so a page reads like its own section.
    this.templates = GENERAL_TEMPLATES.concat(SECTION_TEMPLATES[sectionId] ?? [], SECTION_TEMPLATES[sectionId] ?? []);
  }

  /** Replaces every {slot} of a template; a slot never repeats within one expansion. */
  expand(template) {
    const taken = new Map();
    const fill = (text, depth) =>
      text.replace(/\{([A-Za-z_]+)\}/g, (_, name) => {
        const capital = /^[A-Z]/.test(name);
        const key = capital ? name.charAt(0).toLowerCase() + name.slice(1) : name;
        let value;
        if (key === 'topic') value = this.topic;
        else if (key === 'n') value = String(this.random.int(2, 12));
        else if (key === 'pct') value = String(this.random.int(5, 60));
        else if (key === 'big') value = String(this.random.int(5, 90) * 10);
        else {
          const list = this.vocab[key];
          if (!list) throw new Error(`Unknown slot {${name}} in "${template}"`);
          const used = taken.get(key) ?? new Set();
          taken.set(key, used);
          let choices = list.filter((entry) => !used.has(entry));
          if (choices.length === 0) choices = list;
          value = this.random.pick(choices);
          used.add(value);
          if (depth < 6) value = fill(value, depth + 1);
        }
        return capital ? capitalize(value) : value;
      });
    return fill(template, 0).replace(/\s+([.,;:])/g, '$1').replace(/ {2,}/g, ' ');
  }

  sentence() {
    return this.expand(this.random.pick(this.templates));
  }

  /** A paragraph of distinct sentences, optionally started by a given one. */
  paragraph(first, min = 3, max = 6) {
    const count = this.random.int(min, max);
    const chosen = new Set();
    const sentences = first ? [first] : [];
    while (sentences.length < count) {
      const template = this.random.pick(this.templates);
      if (chosen.has(template)) continue;
      chosen.add(template);
      sentences.push(this.expand(template));
    }
    return sentences.join(' ');
  }

  intro() {
    return this.paragraph(
      this.expand(
        this.random.pick([
          'This page explains how {topic} works at {company}, who owns each part of it, and what to do when something does not look right.',
          '{Topic} is one of the areas where small habits make a large difference, and this page collects the ones that matter most.',
          'Use this page as the starting point for anything related to {topic}; it links to the deeper material where there is some.',
          '{Company} teams ask about {topic} more often than almost anything else, so the short answers are collected here.',
          'If you are new to {topic}, read this page from the top; if you are looking for something specific, use the contents on the side.',
        ]),
      ),
      3,
      5,
    );
  }

  description() {
    return this.expand(
      this.random.pick([
        'How {topic} works at {company}, who owns it and where to go for help.',
        'What to know about {topic}: the rules, the reasons for them and the people to ask.',
        'A practical reference for {topic}, kept short and kept current.',
        'The current approach to {topic} at {company}, with examples and common questions.',
      ]),
    );
  }

  linkSentence(target) {
    return this.random.pick([
      `For related background, see [${target.title}](${target.path}).`,
      `The page on [${target.title}](${target.path}) covers the neighbouring topic in more detail.`,
      `If you need more detail, read [${target.title}](${target.path}) as well.`,
      `[${target.title}](${target.path}) describes the related process and who to contact.`,
      `Teams working on this usually keep [${target.title}](${target.path}) open in another tab.`,
    ]);
  }

  bulletList() {
    const intro = this.expand('{listIntro}');
    const items = this.distinct('{listItem}', this.random.int(3, 6)).map((item) => `- ${item}`);
    return `${intro}\n\n${items.join('\n')}`;
  }

  numberedSteps() {
    const intro = this.expand('{stepsIntro}');
    const steps = this.distinct('{Action}', this.random.int(3, 7)).map((step, i) => `${i + 1}. ${step}.`);
    return `${intro}\n\n${steps.join('\n')}`;
  }

  /** Expands a template until `count` different results exist. */
  distinct(template, count) {
    const seen = new Set();
    let guard = 0;
    while (seen.size < count && guard++ < 60) seen.add(this.expand(template));
    return [...seen];
  }

  note() {
    const heavy = this.random.chance(0.3);
    const label = this.expand(heavy ? '{warningKind}' : '{noteKind}');
    return `> **${label}:** ${this.sentence()}`;
  }

  table() {
    const definition =
      TABLES[this.sectionId] && this.random.chance(0.8) ? TABLES[this.sectionId] : TABLES.common;
    const rows = this.random.int(3, 6);
    const firstColumn = this.random.sample(definition.cells[definition.header[0]], rows);
    const lines = [
      `| ${definition.header.join(' | ')} |`,
      `| ${definition.header.map(() => '---').join(' | ')} |`,
    ];
    for (let i = 0; i < firstColumn.length; i++) {
      const cells = definition.header.map((column, index) =>
        index === 0 ? firstColumn[i] : this.random.pick(definition.cells[column]),
      );
      lines.push(`| ${cells.join(' | ')} |`);
    }
    return `${this.expand('{tableIntro}')}\n\n${lines.join('\n')}`;
  }

  // -- code ------------------------------------------------------------------

  names() {
    const r = this.random;
    return {
      svc: r.pick(CODE_NAMES.service),
      ns: r.pick(CODE_NAMES.namespace),
      table: r.pick(CODE_NAMES.table),
      env: r.pick(CODE_NAMES.env),
      minutes: r.pick([5, 10, 15, 30, 60]),
    };
  }

  bash() {
    const { svc, ns, table, env, minutes } = this.names();
    const pools = {
      runbooks: [
        ['# Look at the current state', `kubectl -n ${ns} get pods -l app=${svc}`],
        ['# Read the most recent logs', `kubectl -n ${ns} logs deploy/${svc} --since=${minutes}m | tail -n 100`],
        ['# Check the health endpoint', `curl -fsS https://${svc}.internal.${DOMAIN}/health`],
        ['# Restart the pods one by one', `kubectl -n ${ns} rollout restart deploy/${svc}`],
        ['# Wait for the rollout to finish', `kubectl -n ${ns} rollout status deploy/${svc} --timeout=300s`],
        ['# Count the rows still waiting', `psql -h db-${env}.internal.${DOMAIN} -c "SELECT count(*) FROM ${table} WHERE status = 'pending';"`],
        ['# Check free disk space', `df -h /var/lib/${svc}`],
        ['# Show recent errors from the unit', `journalctl -u ${svc} --since "${minutes} min ago" -p err | tail -n 50`],
        ['# Roll back to the previous release', `kubectl -n ${ns} rollout undo deploy/${svc}`],
      ],
      engineering: [
        ['# Install dependencies from the lockfile', 'npm ci'],
        ['# Run the unit tests', 'npm test -- --coverage'],
        ['# Start the service locally', `make run SERVICE=${svc}`],
        ['# Build the container image', `docker build -t registry.${DOMAIN}/${svc}:dev .`],
        ['# Apply the pending migrations', `./bin/migrate up --env ${env}`],
        ['# Create a branch for the change', `git switch -c fix/${svc}-timeout`],
        ['# Run the linter on changed files', 'npm run lint -- --changed'],
        ['# Follow the local logs', `tail -f var/log/${svc}.log`],
      ],
      security: [
        ['# List the members of a group', `./bin/access list --group ${svc}-admins`],
        ['# Check when the certificate expires', `openssl s_client -connect ${svc}.${DOMAIN}:443 -servername ${svc}.${DOMAIN} </dev/null 2>/dev/null | openssl x509 -noout -enddate`],
        ['# Rotate the service credential', `./bin/rotate-secret --service ${svc} --env ${env}`],
        ['# Verify disk encryption on this machine', 'fdesetup status'],
        ['# Export the access log for the audit', `./bin/audit-export --since ${minutes}d --format csv > access-log.csv`],
        ['# Check for known vulnerable packages', 'npm audit --omit=dev'],
        ['# Verify a signed release', `gpg --verify ${svc}-1.4.2.tar.gz.sig ${svc}-1.4.2.tar.gz`],
      ],
    };
    const pool = pools[this.sectionId] ?? pools.engineering;
    const picks = this.random.sample([...pool.keys()], this.random.int(3, 5)).sort((a, b) => a - b);
    return fence('bash', picks.map((i) => pool[i].join('\n')).join('\n\n'));
  }

  yaml() {
    const r = this.random;
    const { svc, env } = this.names();
    if (r.chance(0.5)) {
      const memory = r.pick([128, 256, 512, 1024]);
      return fence(
        'yaml',
        [
          `service: ${svc}`,
          `environment: ${env}`,
          `replicas: ${r.int(2, 6)}`,
          'resources:',
          '  requests:',
          `    cpu: ${r.pick(['100m', '250m', '500m'])}`,
          `    memory: ${memory}Mi`,
          '  limits:',
          `    memory: ${memory * 2}Mi`,
          'healthcheck:',
          '  path: /health',
          `  interval: ${r.pick([5, 10, 30])}s`,
          `  timeout: ${r.pick([1, 2, 5])}s`,
          'alerts:',
          `  - name: ${r.pick(TABLES.runbooks.cells.Alert)}`,
          `    threshold: ${r.int(1, 10)}`,
          `    for: ${r.int(2, 15)}m`,
        ].join('\n'),
      );
    }
    const topicId = this.topic.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    return fence(
      'yaml',
      [
        `policy: ${topicId}`,
        `owner: ${r.pick(['platform', 'security', 'people-operations', 'finance'])}`,
        `review: ${r.pick(['monthly', 'quarterly', 'yearly'])}`,
        'rules:',
        `  - id: R-${r.int(100, 199)}`,
        `    description: ${this.sentence().replace(/[:#`]/g, '')}`,
        `    severity: ${r.pick(['low', 'medium', 'high'])}`,
        `  - id: R-${r.int(200, 299)}`,
        `    description: ${this.sentence().replace(/[:#`]/g, '')}`,
        `    severity: ${r.pick(['low', 'medium', 'high'])}`,
      ].join('\n'),
    );
  }

  json() {
    const r = this.random;
    const { svc } = this.names();
    const owner = r.pick(['maya.okafor', 'jonas.lindqvist', 'priya.raman', 'tomas.herrera']);
    const item = {
      id: `${svc.slice(0, 3)}_${r.int(1000, 9999)}`,
      status: r.pick(CODE_NAMES.status),
      owner,
      plan: r.pick(['starter', 'team', 'business', 'enterprise']),
      created_at: `2026-0${r.int(1, 9)}-${String(r.int(10, 28))}T09:${String(r.int(10, 59))}:00Z`,
      limits: { seats: r.int(5, 200), storage_gb: r.pick([10, 50, 100, 500]) },
    };
    return fence('json', JSON.stringify(item, null, 2));
  }

  sql() {
    const r = this.random;
    const { table, minutes } = this.names();
    const variants = [
      `SELECT status, count(*) AS total\nFROM ${table}\nWHERE created_at > now() - interval '${r.int(1, 30)} days'\nGROUP BY status\nORDER BY total DESC;`,
      `SELECT id, owner, updated_at\nFROM ${table}\nWHERE status = '${r.pick(CODE_NAMES.status)}'\n  AND updated_at < now() - interval '${minutes} minutes'\nORDER BY updated_at\nLIMIT ${r.pick([20, 50, 100])};`,
      `UPDATE ${table}\nSET status = '${r.pick(CODE_NAMES.status)}'\nWHERE id IN (\n  SELECT id FROM ${table} WHERE region = '${r.pick(['eu', 'us', 'apac'])}' LIMIT ${r.pick([100, 500])}\n);`,
    ];
    return fence('sql', r.pick(variants));
  }

  ts() {
    const r = this.random;
    if (r.chance(0.5)) {
      const name = r.pick(['withRetry', 'retryTask', 'callWithBackoff']);
      return fence(
        'ts',
        [
          `export async function ${name}<T>(task: () => Promise<T>, attempts = ${r.int(3, 5)}): Promise<T> {`,
          '  let lastError: unknown;',
          '  for (let attempt = 1; attempt <= attempts; attempt++) {',
          '    try {',
          '      return await task();',
          '    } catch (error) {',
          '      lastError = error;',
          `      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * ${r.pick([50, 100, 200])}));`,
          '    }',
          '  }',
          '  throw lastError;',
          '}',
        ].join('\n'),
      );
    }
    const flag = r.pick(['new-checkout', 'fast-search', 'bulk-actions', 'dark-mode']);
    return fence(
      'ts',
      [
        "import { flags } from './flags';",
        '',
        'export function isEnabled(userId: string): boolean {',
        `  const rollout = flags.get('${flag}');`,
        '  if (!rollout) return false;',
        `  const bucket = hash(userId) % ${r.pick([10, 100])};`,
        '  return bucket < rollout.percentage;',
        '}',
      ].join('\n'),
    );
  }

  textTemplate() {
    const r = this.random;
    return fence(
      'text',
      [
        `Subject: Request for ${this.topic}`,
        'Requester: <your name>',
        'Team: <your team>',
        `Approver: <${r.pick(['your manager', 'the budget holder', 'the team lead'])}>`,
        'Needed by: <date>',
        'Reason: <one or two sentences>',
        `Attachments: <${r.pick(['quote', 'receipt', 'screenshot', 'link to the discussion'])}>`,
      ].join('\n'),
    );
  }

  code() {
    const plans = {
      handbook: [[1, 'textTemplate']],
      people: [[1, 'textTemplate']],
      product: [[3, 'json'], [1, 'yaml']],
      engineering: [[3, 'bash'], [2, 'yaml'], [2, 'ts'], [1, 'sql'], [1, 'json']],
      runbooks: [[5, 'bash'], [1, 'sql'], [1, 'yaml']],
      security: [[2, 'bash'], [2, 'yaml'], [1, 'json']],
    };
    const kind = this.random.weighted(plans[this.sectionId]);
    return `${this.expand('{codeIntro}')}\n\n${this[kind]()}`;
  }

  /** Probability that an extra block is a code block, per section. */
  codeWeight() {
    return { handbook: 0.8, people: 0.5, product: 1.5, engineering: 4, runbooks: 5, security: 2 }[this.sectionId] ?? 1;
  }

  extraBlock() {
    const kind = this.random.weighted([
      [3, 'none'],
      [2.4, 'list'],
      [1.4, 'steps'],
      [1.2, 'table'],
      [this.codeWeight(), 'code'],
      [1.4, 'note'],
    ]);
    switch (kind) {
      case 'list': return { type: 'list', md: this.bulletList() };
      case 'steps': return { type: 'list', md: this.numberedSteps() };
      case 'table': return { type: 'table', md: this.table() };
      case 'code': return { type: 'code', md: this.code() };
      case 'note': return { type: 'note', md: this.note() };
      default: return null;
    }
  }
}

/**
 * Builds the Markdown body of a page.
 *
 * page: { section, topic, wordTarget, related: [{ title, path }], images: [{ src, alt }] }
 */
export function buildBody(random, page) {
  const writer = new PageWriter(random, page.section, page.topic);
  const blocks = [];
  let words = 0;
  const add = (type, md) => {
    blocks.push({ type, md });
    words += countWords(md);
  };

  let linksLeft = Math.min(4, page.related.length);
  const paragraph = (first) => {
    let text = writer.paragraph(first);
    if (linksLeft > 0 && random.chance(0.22)) {
      const target = page.related[page.related.length - linksLeft];
      text += ' ' + writer.linkSentence(target);
      linksLeft--;
    }
    return text;
  };

  add('p', writer.intro());

  const h2Pool = random.shuffle(HEADINGS_COMMON.concat(HEADINGS_BY_SECTION[page.section] ?? [], HEADINGS_BY_SECTION[page.section] ?? []));
  const h2Titles = [...new Set(h2Pool)];
  const h3Titles = random.shuffle(SUBHEADINGS);

  while (words < page.wordTarget && h2Titles.length > 0) {
    add('h2', `## ${h2Titles.shift()}`);
    add('p', paragraph());
    if (words >= page.wordTarget) break;
    const extra = writer.extraBlock();
    if (extra) add(extra.type, extra.md);
    if (random.chance(0.45)) add('p', paragraph());

    if (random.chance(0.4) && h3Titles.length >= 2) {
      const subsections = random.int(1, Math.min(3, h3Titles.length));
      for (let i = 0; i < subsections && words < page.wordTarget; i++) {
        add('h3', `### ${h3Titles.shift()}`);
        add('p', paragraph());
        const more = random.chance(0.5) ? writer.extraBlock() : null;
        if (more) add(more.type, more.md);
      }
    }
  }

  add('h2', '## Related pages');
  add('list', page.related.map((target) => `- [${target.title}](${target.path})`).join('\n'));

  // Place the pictures after paragraphs, spread over the page and never in the
  // last quarter, so the page does not end on an image.
  const candidates = [];
  blocks.forEach((block, index) => {
    if (block.type === 'p' && index < blocks.length * 0.75) candidates.push(index);
  });
  const wanted = Math.min(page.images.length, candidates.length);
  const chosen = random.sample(candidates, wanted).sort((a, b) => b - a);
  chosen.forEach((index, i) => {
    const image = page.images[i];
    blocks.splice(index + 1, 0, {
      type: 'img',
      md: `![${image.alt}](${image.src})\n\n*Figure: ${image.alt}.*`,
    });
  });

  const body = blocks.map((block) => block.md).join('\n\n') + '\n';
  return { body, words: countWords(body) };
}

export function imageAlt(random, topic, sectionId) {
  const writer = new PageWriter(random, sectionId, topic);
  return writer.expand(
    random.pick([
      'Diagram of the {topic} workflow',
      'Screenshot of {tool} showing {topic}',
      'Chart of weekly {topic} activity',
      'Illustration of the {topic} lifecycle',
      'Overview of how {topic} fits together',
      'Example of a {adj} {artifact} for {topic}',
    ]),
  );
}

