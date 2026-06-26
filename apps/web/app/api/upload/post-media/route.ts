import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceRateLimit, enforceSameOrigin, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";
import { getBucketVisibility, getStorageObjectUrl } from "../../../../lib/storage-media";

const BUCKET = "post-media";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — matches Instagram/Facebook photo limit
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extFor(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/gif") return "gif";
  return "webp";
}

async function ensureBucket() {
  const { data } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: [...ALLOWED_TYPES],
    fileSizeLimit: MAX_BYTES,
  });
  if (error && !error.message.toLowerCase().includes("already exists")) throw error;
}

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "upload-post-media",
    key: getActorKey(req, clerk.id),
    limit: 20,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return jsonError(400, "No file provided");
  if (!ALLOWED_TYPES.has(file.type)) return jsonError(400, "Only JPEG, PNG, WebP, and GIF images are allowed");
  if (file.size > MAX_BYTES) return jsonError(413, "Image must be under 8 MB");

  const path = `${clerk.id}/${crypto.randomUUID()}.${extFor(file.type)}`;

  try {
    await ensureBucket();
  } catch (err) {
    console.error("[POST /api/upload/post-media] bucket setup failed", err);
    return jsonError(500, "Post media storage is not configured");
  }

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("[POST /api/upload/post-media]", error);
    return jsonError(500, "Upload failed");
  }

  const url = await getStorageObjectUrl(BUCKET, path);
  return jsonNoStore({ url, asset: { bucket: BUCKET, path, visibility: getBucketVisibility(BUCKET) } });
}
