import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
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
