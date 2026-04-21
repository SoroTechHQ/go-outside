import "server-only";

import { supabaseAdmin } from "./supabase";

type MediaVisibility = "public" | "private";

const DEFAULT_SIGNED_URL_TTL_SECONDS = 60 * 30;

function getPrivateBuckets() {
  const raw = process.env.SUPABASE_PRIVATE_MEDIA_BUCKETS ?? "";
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export function getBucketVisibility(bucket: string): MediaVisibility {
  return getPrivateBuckets().has(bucket) ? "private" : "public";
}

export async function getStorageObjectUrl(bucket: string, path: string) {
  if (getBucketVisibility(bucket) === "private") {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, DEFAULT_SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      throw new Error("Could not sign media URL");
    }

    return data.signedUrl;
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
