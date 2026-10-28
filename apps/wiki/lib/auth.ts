import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { get, now, run } from './db';
import { getDummyHash, verifyPassword } from './password.mjs';

export const SESSION_COOKIE = 'wiki_session';
const SESSION_SECONDS = 7 * 24 * 3600;

export type User = { id: number; username: string };

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

/** Returns the user when the credentials are right, null otherwise. */
export async function authenticate(username: string, password: string): Promise<User | null> {
  const row = get<{ id: number; username: string; password_hash: string }>(
    'SELECT id, username, password_hash FROM users WHERE username = ?',
    username,
  );
  const ok = await verifyPassword(password, row ? row.password_hash : getDummyHash());
  return row && ok ? { id: row.id, username: row.username } : null;
}

/** Stores a new session and returns the token to put in the cookie. */
export function createSession(userId: number): string {
  const token = randomBytes(32).toString('hex');
  const created = now();
  run('DELETE FROM sessions WHERE expires_at < ?', created);
  run(
    'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
    hashToken(token),
    userId,
    created,
    created + SESSION_SECONDS,
  );
  return token;
}

export function destroySession(token: string): void {
  run('DELETE FROM sessions WHERE token_hash = ?', hashToken(token));
}

export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}

export function clearedSessionCookie(secure: boolean): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
}

export const isSecure = (request: Request) => request.headers.get('x-forwarded-proto') === 'https';

/** The signed-in user of the current request, or null. */
export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return (
    get<User>(
      `SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
      hashToken(token),
      now(),
    ) ?? null
  );
}

/** For pages: the signed-in user, or a redirect to the login form. */
export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect('/login');
  return user;
}

/** For POST handlers: refuses a form submitted from another origin. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export const redirectTo = (location: string, headers: Record<string, string> = {}) =>
  new Response(null, { status: 303, headers: { Location: location, ...headers } });
