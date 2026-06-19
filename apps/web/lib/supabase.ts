import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getSupabaseAdmin() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
  }

  client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  return client;
}

/**
 * Server-side admin client — service role key bypasses all RLS.
 * Safe in: Server Components, API Routes, Server Actions.
 * NEVER import in client components or expose to the browser.
 */
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = Reflect.get(getSupabaseAdmin(), prop);
    return typeof value === "function" ? value.bind(getSupabaseAdmin()) : value;
  },
});
