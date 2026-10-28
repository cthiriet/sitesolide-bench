import { cache } from 'react';
import { all, get, now, run, transaction } from './db';

export const PAGE_SIZE = 50;
export const SEARCH_LIMIT = 20;
export const MAX_TITLE = 200;
export const MAX_BODY = 100_000;

export type PageRow = {
  id: number;
  slug: string;
  title: string;
  body: string;
  author_id: number;
  username: string;
  updated_at: number;
};

export function recentChanges() {
  return all<{ id: number; created_at: number; slug: string; title: string; username: string }>(
    `SELECT r.id, r.created_at, p.slug, p.title, u.username
       FROM revisions r
       JOIN pages p ON p.id = r.page_id
       JOIN users u ON u.id = r.author_id
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT 50`,
  );
}

export function listPages(page: number) {
  const total = get<{ n: number }>('SELECT COUNT(*) AS n FROM pages')?.n ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(1, page), lastPage);
  const rows = all<{ slug: string; title: string; username: string; updated_at: number }>(
    `SELECT p.slug, p.title, u.username, p.updated_at
       FROM (SELECT id FROM pages ORDER BY title, id LIMIT ? OFFSET ?) AS ids
       JOIN pages p ON p.id = ids.id
       JOIN users u ON u.id = p.author_id
      ORDER BY p.title, p.id`,
    PAGE_SIZE,
    (current - 1) * PAGE_SIZE,
  );
  return { rows, total, page: current, lastPage };
}

// Memoized per request, so generateMetadata and the page share one query.
export const getPage = cache((slug: string): PageRow | undefined => {
  return get<PageRow>(
    `SELECT p.id, p.slug, p.title, p.body, p.author_id, u.username, p.updated_at
       FROM pages p JOIN users u ON u.id = p.author_id
      WHERE p.slug = ?`,
    slug,
  );
});

export function getRevisions(pageId: number) {
  return all<{ id: number; created_at: number; username: string; size: number }>(
    `SELECT r.id, r.created_at, u.username, length(CAST(r.body AS BLOB)) AS size
       FROM revisions r JOIN users u ON u.id = r.author_id
      WHERE r.page_id = ?
      ORDER BY r.created_at DESC, r.id DESC`,
    pageId,
  );
}

export function getRevisionBody(pageId: number, revisionId: number) {
  return get<{ body: string }>('SELECT body FROM revisions WHERE id = ? AND page_id = ?', revisionId, pageId)?.body;
}

/** Turns free text into a safe FTS5 query: quoted words, all required. */
function toMatchQuery(text: string): string | null {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.slice(0, 8);
  return words && words.length > 0 ? words.map((word) => `"${word}"`).join(' ') : null;
}

// Snippet markers: control characters that cannot occur in escaped text.
export const MARK_OPEN = '\u0002';
export const MARK_CLOSE = '\u0003';

export function searchPages(text: string) {
  const match = toMatchQuery(text);
  if (!match) return [];
  return all<{ slug: string; title: string; snippet: string }>(
    `SELECT p.slug, p.title,
            snippet(pages_fts, 1, char(2), char(3), '...', 24) AS snippet
       FROM pages_fts
       JOIN pages p ON p.id = pages_fts.rowid
      WHERE pages_fts MATCH ?
      ORDER BY bm25(pages_fts, 5.0, 1.0)
      LIMIT ?`,
    match,
    SEARCH_LIMIT,
  );
}

/** Saves a new revision and updates the page. Returns false when nothing changed. */
export function savePage(pageId: number, title: string, body: string, authorId: number): boolean {
  return transaction(() => {
    const current = get<{ title: string; body: string }>('SELECT title, body FROM pages WHERE id = ?', pageId);
    if (!current || (current.title === title && current.body === body)) return false;
    const at = now();
    run('UPDATE pages SET title = ?, body = ?, author_id = ?, updated_at = ? WHERE id = ?', title, body, authorId, at, pageId);
    run('INSERT INTO revisions (page_id, body, author_id, created_at) VALUES (?, ?, ?, ?)', pageId, body, authorId, at);
    return true;
  });
}

function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
  return slug || 'untitled';
}

/** Creates a page and its first revision. Returns the new slug. */
export function createPage(title: string, body: string, authorId: number): string {
  return transaction(() => {
    const base = slugify(title);
    let slug = base;
    for (let n = 2; get('SELECT 1 FROM pages WHERE slug = ?', slug); n++) slug = `${base}-${n}`;
    const at = now();
    const { lastInsertRowid } = run(
      'INSERT INTO pages (slug, title, body, author_id, updated_at) VALUES (?, ?, ?, ?, ?)',
      slug,
      title,
      body,
      authorId,
      at,
    );
    run('INSERT INTO revisions (page_id, body, author_id, created_at) VALUES (?, ?, ?, ?)', lastInsertRowid, body, authorId, at);
    return slug;
  });
}

export function exportRows() {
  return all<{ slug: string; title: string; username: string; updated_at: number }>(
    `SELECT p.slug, p.title, u.username, p.updated_at
       FROM pages p JOIN users u ON u.id = p.author_id
      ORDER BY p.id`,
  );
}
