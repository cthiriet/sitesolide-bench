#!/usr/bin/env node
// Deterministic generator for the Acme documentation site.
//
// Writes, from one seed:
//   src/content/docs/<section>/<slug>.md   about 300 Markdown pages
//   src/data/sections.json                 the section list the site reads
//   public/images/img-NNN.png              about 100 noisy PNGs, ~40 MiB
//   k6/pages.json                          page and image paths for the load test
//
// Run it with `npm run generate`; `npm run build` runs it first. Pass --force
// to redraw the images even when they are up to date.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Random, hashString } from './lib/prng.mjs';
import { makePicture } from './lib/png.mjs';
import { PageWriter, buildBody, capitalize, imageAlt } from './lib/text.mjs';
import { OWNERS, SECTIONS, TAGS, TEAM_NAMES } from './lib/vocab.mjs';

const SEED = 20260101;
const IMAGE_COUNT = 100;
const IMAGE_TOTAL_BYTES = 40 * 1024 * 1024;
const MIN_WORDS = 600;
const MAX_WORDS = 2000;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'src', 'content', 'docs');
const dataFile = join(root, 'src', 'data', 'sections.json');
const imagesDir = join(root, 'public', 'images');
const pagesFile = join(root, 'k6', 'pages.json');
const stampFile = join(root, '.images.stamp');
const force = process.argv.includes('--force');

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// -- 1. Plan the pages --------------------------------------------------------

function planSection(section) {
  const random = new Random(SEED ^ hashString(`plan:${section.id}`));
  const combos = [];
  for (const subject of section.subjects) for (const kind of section.kinds) combos.push({ subject, kind });
  const shuffled = random.shuffle(combos);

  for (const perSubject of [2, 3, 5]) {
    const used = new Map();
    const chosen = [];
    for (const combo of shuffled) {
      if (chosen.length === section.count) break;
      if ((used.get(combo.subject) ?? 0) >= perSubject) continue;
      used.set(combo.subject, (used.get(combo.subject) ?? 0) + 1);
      chosen.push(combo);
    }
    if (chosen.length === section.count) {
      return chosen
        .map(({ subject, kind }) => ({ section: section.id, subject, kind, title: `${capitalize(subject)} ${kind}` }))
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((page, index) => ({ ...page, slug: slugify(page.title), order: index + 1 }));
    }
  }
  throw new Error(`Section ${section.id}: not enough subjects and kinds for ${section.count} pages`);
}

const pages = SECTIONS.flatMap(planSection);
for (const page of pages) {
  page.id = `${page.section}/${page.slug}`;
  page.path = `/${page.id}/`;
}
if (new Set(pages.map((page) => page.id)).size !== pages.length) throw new Error('Duplicate page slugs');

// -- 2. Plan the images -------------------------------------------------------

const imageRandom = new Random(SEED ^ hashString('images'));
const rawTargets = Array.from({ length: IMAGE_COUNT }, () => 0.6 + imageRandom.float() * 0.8);
const rawSum = rawTargets.reduce((sum, value) => sum + value, 0);
const images = rawTargets.map((weight, index) => ({
  name: `img-${String(index + 1).padStart(3, '0')}.png`,
  seed: (SEED + index * 7919) >>> 0,
  aspect: imageRandom.pick([1.6, 1.333, 1.777, 2, 1.5]),
  noise: imageRandom.int(2, 6),
  targetBytes: Math.round((weight / rawSum) * IMAGE_TOTAL_BYTES),
}));

// Every page gets one to three pictures; a shuffled deck keeps all of them in use.
const deckRandom = new Random(SEED ^ hashString('deck'));
let deck = [];
function nextImages(count) {
  const picked = [];
  while (picked.length < count) {
    if (deck.length === 0) deck = deckRandom.shuffle(images);
    const image = deck.pop();
    if (!picked.includes(image)) picked.push(image);
  }
  return picked;
}

// -- 3. Write the Markdown ----------------------------------------------------

const firstDay = Date.UTC(2025, 5, 1);
const spanDays = Math.round((Date.UTC(2026, 9, 20) - firstDay) / 86400000);

rmSync(contentDir, { recursive: true, force: true });
mkdirSync(contentDir, { recursive: true });

const bySection = new Map(SECTIONS.map((section) => [section.id, pages.filter((page) => page.section === section.id)]));
const wordCounts = [];
const pageIndex = [];

for (const page of pages) {
  const random = new Random(SEED ^ hashString(`page:${page.id}`));
  const sectionPages = bySection.get(page.section);

  // Related pages: two or three siblings, then one or two from other sections.
  const siblings = random.sample(sectionPages.filter((other) => other !== page), random.int(2, 3));
  const others = random.sample(pages.filter((other) => other.section !== page.section), random.int(1, 2));
  const related = random.shuffle(siblings.concat(others)).map((other) => ({ title: other.title, path: other.path }));

  const pictures = nextImages(random.weighted([[4, 1], [4, 2], [2, 3]]));
  const picturePlans = pictures.map((image) => ({
    src: `/images/${image.name}`,
    alt: imageAlt(random, page.subject, page.section),
  }));

  const wordTarget = random.int(MIN_WORDS + 20, MAX_WORDS - 250);
  const { body, words } = buildBody(random, {
    section: page.section,
    topic: page.subject,
    wordTarget,
    related,
    images: picturePlans,
  });
  if (words < MIN_WORDS || words > MAX_WORDS) {
    throw new Error(`${page.id} has ${words} words, outside ${MIN_WORDS} to ${MAX_WORDS}`);
  }
  wordCounts.push(words);

  const writer = new PageWriter(random, page.section, page.subject);
  const updated = new Date(firstDay + random.int(0, spanDays) * 86400000).toISOString().slice(0, 10);
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(writer.description())}`,
    `section: ${JSON.stringify(page.section)}`,
    `order: ${page.order}`,
    `owner: ${JSON.stringify(random.pick(OWNERS))}`,
    `team: ${JSON.stringify(random.pick(TEAM_NAMES))}`,
    `updated: ${JSON.stringify(updated)}`,
    `tags: ${JSON.stringify(random.sample(TAGS[page.section], random.int(2, 4)))}`,
    '---',
    '',
  ].join('\n');

  const file = join(contentDir, page.section, `${page.slug}.md`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, frontmatter + body);
  pageIndex.push({ path: page.path, images: pictures.map((image) => `/images/${image.name}`) });
}

// -- 4. Data files for the site and for k6 ------------------------------------

mkdirSync(dirname(dataFile), { recursive: true });
writeFileSync(
  dataFile,
  JSON.stringify(
    SECTIONS.map((section) => ({
      id: section.id,
      title: section.title,
      blurb: section.blurb,
      count: bySection.get(section.id).length,
    })),
    null,
    2,
  ) + '\n',
);

mkdirSync(dirname(pagesFile), { recursive: true });
writeFileSync(pagesFile, JSON.stringify({ pages: pageIndex }, null, 1) + '\n');

// -- 5. The pictures ----------------------------------------------------------

const stamp = createHash('sha256')
  .update(readFileSync(join(root, 'scripts', 'lib', 'png.mjs')))
  .update(readFileSync(join(root, 'scripts', 'lib', 'prng.mjs')))
  .update(JSON.stringify(images))
  .digest('hex');

const upToDate =
  !force &&
  existsSync(stampFile) &&
  readFileSync(stampFile, 'utf8').trim() === stamp &&
  existsSync(imagesDir) &&
  readdirSync(imagesDir).filter((name) => name.endsWith('.png')).length === IMAGE_COUNT;

let imageBytes = 0;
if (upToDate) {
  console.log('images: up to date, kept');
} else {
  rmSync(imagesDir, { recursive: true, force: true });
  mkdirSync(imagesDir, { recursive: true });
  for (const image of images) {
    const { png } = makePicture(image.seed, image.aspect, image.targetBytes, image.noise);
    writeFileSync(join(imagesDir, image.name), png);
    imageBytes += png.length;
  }
  writeFileSync(stampFile, stamp + '\n');
  console.log(`images: wrote ${IMAGE_COUNT} PNG files, ${(imageBytes / 1024 / 1024).toFixed(1)} MiB`);
}

const total = wordCounts.reduce((sum, value) => sum + value, 0);
console.log(
  `pages: wrote ${pages.length} Markdown pages in ${SECTIONS.length} sections, ` +
    `words min ${Math.min(...wordCounts)} / mean ${Math.round(total / wordCounts.length)} / max ${Math.max(...wordCounts)}`,
);
