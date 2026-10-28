import { cookies } from 'next/headers';
import { SESSION_COOKIE, clearedSessionCookie, destroySession, isSecure, redirectTo, sameOrigin } from '../../lib/auth';

export const dynamic = 'force-dynamic';

async function logout(request: Request) {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) destroySession(token);
  return redirectTo('/login', { 'Set-Cookie': clearedSessionCookie(isSecure(request)) });
}

export const GET = logout;
export const POST = logout;
