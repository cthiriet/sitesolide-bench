import { redirect } from 'next/navigation';
import { currentUser } from '../../lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect('/recent');
  const { error } = await searchParams;
  return (
    <div className="login">
      <h1>Team Wiki</h1>
      <form className="stack" action="/api/login" method="post">
        {error ? <p className="error">Wrong username or password.</p> : null}
        <label>
          Username
          <input type="text" name="username" autoComplete="username" required autoFocus />
        </label>
        <label>
          Password
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </div>
  );
}
