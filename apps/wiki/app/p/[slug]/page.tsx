import { notFound } from 'next/navigation';
import Shell from '../../../components/Shell';
import { requireUser } from '../../../lib/auth';
import { formatTime } from '../../../lib/format';
import { renderMarkdown } from '../../../lib/markdown';
import { getPage } from '../../../lib/wiki';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: getPage(slug)?.title ?? 'Not found' };
}

export default async function WikiPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();
  const html = renderMarkdown(page.body);
  return (
    <Shell user={user}>
      <div className="actions">
        <a href={`/p/${page.slug}/edit`}>Edit</a>
        <a href={`/p/${page.slug}/history`}>History</a>
      </div>
      <article className="content" dangerouslySetInnerHTML={{ __html: html }} />
      <p className="meta">
        Last edited by {page.username} on {formatTime(page.updated_at)} UTC
      </p>
    </Shell>
  );
}
