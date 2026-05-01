import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip Next.js internals, static files, the legacy bundle, and the
  // public landing/styleguide pages so unauth visitors can browse.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|legacy|api|.*\\..*).*)',
  ],
};
