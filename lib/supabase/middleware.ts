import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseEnv, isSupabaseConfigured } from '@/lib/env';

const PROTECTED_PREFIXES = ['/dashboard', '/transactions', '/accounts', '/categories', '/forecast'];
const AUTH_PATHS = ['/login', '/signup', '/reset'];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.includes(pathname);
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  // If env isn't wired yet, let the request through. Public pages will
  // render; protected pages will throw a clear error when they try to
  // construct a Supabase client.
  if (!isSupabaseConfigured()) return response;

  const { url, key } = getSupabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refreshes the session cookie if it's near expiry.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtected(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/login';
    redirect.searchParams.set('next', pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && isAuthPath(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = '/dashboard';
    redirect.search = '';
    return NextResponse.redirect(redirect);
  }

  return response;
}
