import { createClient } from '@supabase/supabase-js';

// ── Public (anon) client — used in Next.js API routes ───────
// These env vars are safe to expose; RLS handles security.
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
