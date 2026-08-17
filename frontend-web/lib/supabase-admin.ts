import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Server configuration error: missing Supabase credentials');
  }

  return createClient(url, key);
}

export function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    message.includes('does not exist') ||
    message.includes('schema cache')
  );
}
