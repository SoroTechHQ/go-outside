import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceRateLimit, enforceSameOrigin, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";
import { getBucketVisibility, getStorageObjectUrl } from "../../../../lib/storage-media";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionForType(type: string) {
  switch (type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
    default:
      return "webp";
  }
}

async function ensureAvatarBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(AVATAR_BUCKET);
  if (data) return;

  const { error } = await supabaseAdmin.storage.createBucket(AVATAR_BUCKET, {
    public: true,
    allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
    fileSizeLimit: MAX_AVATAR_BYTES,
  });

  if (error && !error.message.toLowerCase().includes("already exists")) {
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "upload-avatar",
    key: getActorKey(req, clerk.id),
    limit: 15,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return jsonError(400, "No file provided");
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return jsonError(400, "Unsupported image type");
  if (file.size > MAX_AVATAR_BYTES) return jsonError(413, "Image is too large");

  const bucket = AVATAR_BUCKET;
  const ext = extensionForType(file.type);
  const path = `${clerk.id}/${crypto.randomUUID()}.${ext}`;

  try {
    await ensureAvatarBucket();
  } catch (error) {
    console.error("[POST /api/upload/avatar] bucket setup failed", error);
    return jsonError(500, "Avatar storage is not configured");
  }

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "image/webp",
      upsert: true,
    });

  if (error) {
    console.error("[POST /api/upload/avatar]", error);
    return jsonError(500, "Upload failed");
  }

  const url = await getStorageObjectUrl(bucket, path);
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("clerk_id", clerk.id)
    .maybeSingle();

  const { error: updateError } = await supabaseAdmin
    .from("users")
    .upsert(
      {
        clerk_id: clerk.id,
        email: clerk.emailAddresses[0]?.emailAddress ?? "",
        first_name: clerk.firstName ?? "User",
        last_name: clerk.lastName ?? "",
        role: (existing?.role as "admin" | "organizer" | "attendee" | undefined) ?? "attendee",
        avatar_url: url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "clerk_id" },
    );

  if (updateError) {
    console.error("[POST /api/upload/avatar] profile update failed", updateError);
    return jsonError(500, "Upload saved, but profile update failed");
  }

  return jsonNoStore({ url, asset: { bucket, path, visibility: getBucketVisibility(bucket) } });
}
