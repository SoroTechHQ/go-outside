import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getSupabaseBrowser() {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required.");
  }

  if (!supabasePublishableKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required.");
  }

  client = createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: true },
  });

  return client;
}

/**
 * Browser-side Supabase client — uses the anon key.
 * Safe to import in Client Components.
 * Used for Realtime subscriptions only; data reads go through server routes.
 */
export const supabaseBrowser = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const value = Reflect.get(getSupabaseBrowser(), prop);
    return typeof value === "function" ? value.bind(getSupabaseBrowser()) : value;
  },
});
