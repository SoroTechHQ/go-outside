import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase";
import { enforceRateLimit, enforceSameOrigin, getActorKey, jsonError, jsonNoStore } from "../../../../lib/api-security";
import { getBucketVisibility, getStorageObjectUrl } from "../../../../lib/storage-media";

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

  const ext = file.name.split(".").pop() ?? "webp";
  const path = `${clerk.id}/${Date.now()}.${ext}`;
  const bucket = "covers";

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || "image/webp",
      upsert: true,
    });

  if (error) {
    console.error("[POST /api/upload/cover]", error);
    return jsonError(500, "Upload failed");
  }

  const url = await getStorageObjectUrl(bucket, path);
  return jsonNoStore({ url, asset: { bucket, path, visibility: getBucketVisibility(bucket) } });
}
