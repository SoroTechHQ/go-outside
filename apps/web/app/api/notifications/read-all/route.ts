import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceRateLimit, enforceSameOrigin, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";

export async function POST(request: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) {
    return jsonError(401, "Unauthorized");
  }

  const csrfResponse = enforceSameOrigin(request);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "notifications-read-all",
    key: getActorKey(request, clerk.id),
    limit: 12,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const { data: sbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  if (!sbUser) {
    return jsonNoStore({ ok: true });
  }

  await supabaseAdmin
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", sbUser.id)
    .eq("is_read", false);

  return jsonNoStore({ ok: true });
}
