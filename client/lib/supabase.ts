// ────────────────────────────────────────
//  LinguaBook Pro — Supabase Client (lazy init)
// ────────────────────────────────────────
import { createBrowserClient } from '@supabase/ssr';

// Only call this in browser context (client components)
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

  // Return a mock-safe client if env vars missing (build time)
  if (!url || !key || !url.startsWith('http')) {
    // During build/SSG, return a placeholder that won't crash
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient(url, key);
}

// Singleton for client components
let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}
