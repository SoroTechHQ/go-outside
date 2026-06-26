import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceRateLimit, enforceSameOrigin, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";
import { getBucketVisibility, getStorageObjectUrl } from "../../../../lib/storage-media";

const BUCKET = "covers";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB — generous for high-res event hero images
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFor(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
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
    bucket: "upload-cover",
    key: getActorKey(req, clerk.id),
    limit: 15,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return jsonError(400, "No file provided");
  if (!ALLOWED_TYPES.has(file.type)) return jsonError(400, "Only JPEG, PNG, and WebP images are allowed");
  if (file.size > MAX_BYTES) return jsonError(413, "Image must be under 10 MB");

  const path = `${clerk.id}/${crypto.randomUUID()}.${extFor(file.type)}`;

  try {
    await ensureBucket();
  } catch (err) {
    console.error("[POST /api/upload/cover] bucket setup failed", err);
    return jsonError(500, "Cover storage is not configured");
  }

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error("[POST /api/upload/cover]", error);
    return jsonError(500, "Upload failed");
  }

  const url = await getStorageObjectUrl(BUCKET, path);
  return jsonNoStore({ url, asset: { bucket: BUCKET, path, visibility: getBucketVisibility(BUCKET) } });
}
