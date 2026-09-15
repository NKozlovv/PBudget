import { cache } from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { getSupabaseEnv } from '@/lib/env';

export async function createClient() {
  const { url, key } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll() is called from Server Components in some flows, where
          // cookies are read-only. Middleware refreshes the session cookie
          // on the response, so this catch is safe.
        }
      },
    },
  });
}

/**
 * The `(app)` layout and every page below it each independently need the
 * signed-in user — the layout to gate access, most pages again for a name
 * or id. Before this, that meant a fresh `auth.getUser()` network round
 * trip per call site, every single navigation (layout + page + whatever
 * `getOrCreateUserBudget()` needed it for internally — several redundant
 * round trips for the exact same answer). `cache()` is React's per-request
 * memoization for Server Components: within one render pass, every call
 * here after the first returns the same cached promise instead of hitting
 * Supabase again. Must NOT be used inside a server action or route handler
 * that mutates auth state (sign-in/out) — those already run as their own
 * request, so there's nothing to dedupe against.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
