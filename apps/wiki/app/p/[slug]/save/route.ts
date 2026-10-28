import { currentUser, redirectTo, sameOrigin } from '../../../../lib/auth';
import { MAX_BODY, MAX_TITLE, getPage, savePage } from '../../../../lib/wiki';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });
  const user = await currentUser();
  if (!user) return redirectTo('/login');
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY * 4) {
    return new Response('Payload too large', { status: 413 });
  }

  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return new Response('Not found', { status: 404 });

  const form = await request.formData();
  const title = String(form.get('title') ?? '').trim();
  const body = String(form.get('body') ?? '').replaceAll('\r\n', '\n');
  if (!title || title.length > MAX_TITLE || !body.trim() || body.length > MAX_BODY) {
    return new Response('A title and a body are required, within the size limits', { status: 400 });
  }

  savePage(page.id, title, body, user.id);
  return redirectTo(`/p/${page.slug}`);
}
