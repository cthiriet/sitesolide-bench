import Shell from '../../components/Shell';
import { requireUser } from '../../lib/auth';
import { MARK_CLOSE, MARK_OPEN, SEARCH_LIMIT, searchPages } from '../../lib/wiki';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Search' };

// The snippet is plain text with marker characters around the matches.
// Rendering it as React nodes keeps it escaped.
function Snippet({ text }: { text: string }) {
  const parts = text.split(MARK_OPEN).flatMap((chunk, index) => {
    if (index === 0) return [<span key={0}>{chunk}</span>];
    const [hit, ...rest] = chunk.split(MARK_CLOSE);
    return [<mark key={`m${index}`}>{hit}</mark>, <span key={`t${index}`}>{rest.join(MARK_CLOSE)}</span>];
  });
  return <p>{parts}</p>;
}

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const q = ((await searchParams).q ?? '').slice(0, 200);
  const results = q.trim() ? searchPages(q) : [];
  return (
    <Shell user={user} query={q}>
      <h1>Search</h1>
      {q.trim() ? (
        <p className="meta">
          {results.length === 0 ? 'No page matches' : `Best ${results.length} matches (at most ${SEARCH_LIMIT})`} for &ldquo;{q}&rdquo;
        </p>
      ) : (
        <p className="meta">Type a word in the box above.</p>
      )}
      <ol className="results">
        {results.map((result) => (
          <li key={result.slug}>
            <a href={`/p/${result.slug}`}>{result.title}</a>
            <Snippet text={result.snippet} />
          </li>
        ))}
      </ol>
    </Shell>
  );
}
