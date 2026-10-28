import Shell from '../../components/Shell';
import { requireUser } from '../../lib/auth';
import { formatTime } from '../../lib/format';
import { PAGE_SIZE, listPages } from '../../lib/wiki';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'All pages' };

export default async function AllPages({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser();
  const { page } = await searchParams;
  const { rows, total, page: current, lastPage } = listPages(Number.parseInt(page ?? '1', 10) || 1);
  return (
    <Shell user={user}>
      <h1>All pages</h1>
      <p className="meta">
        {total} pages, {PAGE_SIZE} per page, page {current} of {lastPage}
      </p>
      <table>
        <thead>
          <tr><th>Title</th><th>Last editor</th><th>Updated (UTC)</th></tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.slug}>
              <td><a href={`/p/${row.slug}`}>{row.title}</a></td>
              <td>{row.username}</td>
              <td>{formatTime(row.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pager">
        {current > 1 ? <a href={`/pages?page=${current - 1}`}>Previous</a> : null}
        {current < lastPage ? <a href={`/pages?page=${current + 1}`}>Next</a> : null}
      </div>
    </Shell>
  );
}
