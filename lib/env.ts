/**
 * Typed Supabase env access — lazy, so public pages render without
 * Supabase configured. Only callers that actually need Supabase invoke
 * getSupabaseEnv() and surface a clear error if a key is missing.
 */

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase env not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel project settings ' +
        '(Preview + Production) and in .env.local for local dev.',
    );
  }
  return { url, key } as const;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
