import { notFound } from 'next/navigation';
import Shell from '../../../../components/Shell';
import { requireUser } from '../../../../lib/auth';
import { MAX_BODY, MAX_TITLE, getPage } from '../../../../lib/wiki';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Edit ${getPage(slug)?.title ?? ''}` };
}

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser();
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();
  return (
    <Shell user={user}>
      <h1>Edit page</h1>
      <form className="stack" action={`/p/${page.slug}/save`} method="post">
        <label>
          Title
          <input type="text" name="title" defaultValue={page.title} maxLength={MAX_TITLE} required />
        </label>
        <label>
          Body (Markdown)
          <textarea name="body" rows={24} defaultValue={page.body} maxLength={MAX_BODY} required />
        </label>
        <button type="submit">Save new revision</button>
      </form>
      <p className="meta"><a href={`/p/${page.slug}`}>Cancel</a></p>
    </Shell>
  );
}
