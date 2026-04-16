import { createClient } from "@supabase/supabase-js";

const supabaseUrl             = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey  = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

/**
 * Browser-side Supabase client — uses the anon key.
 * Safe to import in Client Components.
 * Used for Realtime subscriptions only; data reads go through server routes.
 */
export const supabaseBrowser = createClient(supabaseUrl, supabasePublishableKey, {
  auth: { persistSession: true },
});
