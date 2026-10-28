import Shell from '../../components/Shell';
import { requireUser } from '../../lib/auth';
import { formatTime } from '../../lib/format';
import { recentChanges } from '../../lib/wiki';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recent changes' };

export default async function RecentChanges() {
  const user = await requireUser();
  const changes = recentChanges();
  return (
    <Shell user={user}>
      <h1>Recent changes</h1>
      <table>
        <thead>
          <tr><th>Page</th><th>Author</th><th>When (UTC)</th></tr>
        </thead>
        <tbody>
          {changes.map((change) => (
            <tr key={change.id}>
              <td><a href={`/p/${change.slug}`}>{change.title}</a></td>
              <td>{change.username}</td>
              <td>{formatTime(change.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
