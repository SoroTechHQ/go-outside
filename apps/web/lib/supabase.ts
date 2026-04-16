import { createClient } from "@supabase/supabase-js";

const supabaseUrl        = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Server-side admin client — service role key bypasses all RLS.
 * Safe in: Server Components, API Routes, Server Actions.
 * NEVER import in client components or expose to the browser.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});
