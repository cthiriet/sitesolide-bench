import { authenticate, createSession, isSecure, redirectTo, sameOrigin, sessionCookie } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });
  const form = await request.formData();
  const username = String(form.get('username') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const user = username && password ? await authenticate(username, password) : null;
  if (!user) return redirectTo('/login?error=1');
  const token = createSession(user.id);
  return redirectTo('/recent', { 'Set-Cookie': sessionCookie(token, isSecure(request)) });
}
