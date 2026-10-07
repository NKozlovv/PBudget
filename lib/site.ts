import 'server-only';
import { headers } from 'next/headers';

/**
 * Public origin used in invite links. `NEXT_PUBLIC_SITE_URL` wins (so a
 * preview deploy can still link to production if you want that); otherwise
 * it's derived from the incoming request.
 */
export async function getSiteUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '');
  if (fromEnv) return fromEnv;
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}
