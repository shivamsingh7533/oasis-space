import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xefiwydezpodjnhipxlw.supabase.co';
// Anon key MUST come from the environment — no committed secrets.
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

if (!supabaseKey) {
  console.error('[supabase] Missing VITE_SUPABASE_KEY in client/.env — image uploads will fail.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);