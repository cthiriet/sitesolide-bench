import { currentUser, redirectTo, sameOrigin } from '../../../lib/auth';
import { MAX_BODY, MAX_TITLE, createPage } from '../../../lib/wiki';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });
  const user = await currentUser();
  if (!user) return redirectTo('/login');
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY * 4) {
    return new Response('Payload too large', { status: 413 });
  }

  const form = await request.formData();
  const title = String(form.get('title') ?? '').trim();
  const body = String(form.get('body') ?? '').replaceAll('\r\n', '\n');
  if (!title || title.length > MAX_TITLE || !body.trim() || body.length > MAX_BODY) {
    return new Response('A title and a body are required, within the size limits', { status: 400 });
  }

  return redirectTo(`/p/${createPage(title, body, user.id)}`);
}
