import { get } from '../../lib/db';

export const dynamic = 'force-dynamic';

export function GET() {
  try {
    get('SELECT 1 AS ok');
  } catch {
    return new Response('database error', { status: 503 });
  }
  return new Response('ok', { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
