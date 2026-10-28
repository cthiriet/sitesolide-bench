import Shell from '../../components/Shell';
import { requireUser } from '../../lib/auth';
import { MAX_BODY, MAX_TITLE } from '../../lib/wiki';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New page' };

export default async function NewPage() {
  const user = await requireUser();
  return (
    <Shell user={user}>
      <h1>New page</h1>
      <form className="stack" action="/new/create" method="post">
        <label>
          Title
          <input type="text" name="title" maxLength={MAX_TITLE} required />
        </label>
        <label>
          Body (Markdown)
          <textarea name="body" rows={20} maxLength={MAX_BODY} required />
        </label>
        <button type="submit">Create page</button>
      </form>
    </Shell>
  );
}
