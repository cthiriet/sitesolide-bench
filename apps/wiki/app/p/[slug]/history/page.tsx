import { notFound } from 'next/navigation';
import Shell from '../../../../components/Shell';
import { requireUser } from '../../../../lib/auth';
import { formatBytes, formatTime } from '../../../../lib/format';
import { getPage, getRevisionBody, getRevisions } from '../../../../lib/wiki';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `History of ${getPage(slug)?.title ?? ''}` };
}

export default async function History({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ rev?: string }>;
}) {
  const user = await requireUser();
  const { slug } = await params;
  const { rev } = await searchParams;
  const page = getPage(slug);
  if (!page) notFound();
  const revisions = getRevisions(page.id);
  const shown = rev ? getRevisionBody(page.id, Number.parseInt(rev, 10) || 0) : undefined;
  return (
    <Shell user={user}>
      <h1>History: {page.title}</h1>
      <p className="meta"><a href={`/p/${page.slug}`}>Back to the page</a></p>
      <table>
        <thead>
          <tr><th>Revision</th><th>Author</th><th>When (UTC)</th><th>Size</th></tr>
        </thead>
        <tbody>
          {revisions.map((revision) => (
            <tr key={revision.id}>
              <td><a href={`/p/${page.slug}/history?rev=${revision.id}`}>#{revision.id}</a></td>
              <td>{revision.username}</td>
              <td>{formatTime(revision.created_at)}</td>
              <td>{formatBytes(revision.size)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {shown !== undefined ? (
        <>
          <h2>Revision #{rev}</h2>
          <pre className="content">{shown}</pre>
        </>
      ) : null}
    </Shell>
  );
}
