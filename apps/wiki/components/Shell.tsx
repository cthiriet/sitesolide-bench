import type { ReactNode } from 'react';
import type { User } from '../lib/auth';

// Plain anchors on purpose: no client-side prefetching, no client component.
export default function Shell({ user, query = '', children }: { user: User; query?: string; children: ReactNode }) {
  return (
    <>
      <header className="top">
        <a className="brand" href="/recent">Team Wiki</a>
        <nav>
          <a href="/recent">Recent changes</a>
          <a href="/pages">All pages</a>
          <a href="/new">New page</a>
          <a href="/export.csv">Export CSV</a>
        </nav>
        <form className="search" action="/search" method="get">
          <input type="search" name="q" defaultValue={query} placeholder="Search pages" aria-label="Search pages" />
          <button type="submit">Search</button>
        </form>
        <form className="user" action="/logout" method="post">
          <span>{user.username}</span>
          <button type="submit">Log out</button>
        </form>
      </header>
      <main>{children}</main>
    </>
  );
}
