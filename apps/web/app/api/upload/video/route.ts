import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceRateLimit, enforceSameOrigin, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";
import { getStorageObjectUrl } from "../../../../lib/storage-media";

const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/mov"]);
const MAX_VIDEO_MB = 100;

export async function POST(req: NextRequest) {
  const clerk = await currentUser();
  if (!clerk) return jsonError(401, "Unauthorized");

  const csrfResponse = enforceSameOrigin(req);
  if (csrfResponse) return csrfResponse;

  const rateLimitResponse = enforceRateLimit({
    bucket: "upload-video",
    key: getActorKey(req, clerk.id),
    limit: 5,
    windowMs: 60_000,
  });
  if (rateLimitResponse) return rateLimitResponse;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return jsonError(400, "No file provided");

  const isVideo = VIDEO_TYPES.has(file.type) || /\.(mp4|mov|webm|qt)$/i.test(file.name);
  if (!isVideo) return jsonError(400, "File must be a video (mp4, mov, webm)");

  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    return jsonError(400, `Video must be under ${MAX_VIDEO_MB}MB`);
  }

  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "mp4";
  const path = `${clerk.id}/videos/${Date.now()}.${ext}`;
  const bucket = "post-media";

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "video/mp4",
      upsert: false,
    });

  if (error) {
    console.error("[POST /api/upload/video]", error);
    return jsonError(500, "Upload failed");
  }

  const url = await getStorageObjectUrl(bucket, path);
  return jsonNoStore({ url, type: "video" });
}
