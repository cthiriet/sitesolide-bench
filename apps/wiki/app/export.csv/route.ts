import { currentUser, redirectTo } from '../../lib/auth';
import { csvField } from '../../lib/format';
import { exportRows } from '../../lib/wiki';

export const dynamic = 'force-dynamic';

// The heavy action: every page, built in memory and sent at once.
export async function GET() {
  if (!(await currentUser())) return redirectTo('/login');
  const lines = ['slug,title,author,updated_at'];
  for (const row of exportRows()) {
    const updated = new Date(row.updated_at * 1000).toISOString();
    lines.push([row.slug, row.title, row.username, updated].map(csvField).join(','));
  }
  return new Response(lines.join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="wiki-pages.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
