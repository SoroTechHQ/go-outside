const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

type TransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "webp" | "avif" | "origin";
};

export function getImageUrl(url: string | null | undefined, opts: TransformOptions = {}): string | null {
  if (!url) return null;
  if (!SUPABASE_URL || !url.startsWith(SUPABASE_URL)) return url;

  const params = new URLSearchParams();
  if (opts.width)   params.set("width",   String(opts.width));
  if (opts.height)  params.set("height",  String(opts.height));
  if (opts.quality) params.set("quality", String(opts.quality));
  params.set("format", opts.format ?? "webp");

  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${params.toString()}`;
}

/**
 * Build a public Supabase Storage URL from a bucket name and path.
 * Use this when the DB stores only a relative path instead of the full URL.
 */
export function storageUrl(bucket: string, path: string | null | undefined): string | null {
  if (!path || !SUPABASE_URL) return null;
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export const avatarUrl  = (url: string | null | undefined) => getImageUrl(url, { width: 400,  format: "webp" });
export const bannerUrl  = (url: string | null | undefined) => getImageUrl(url, { width: 1200, format: "webp" });
export const thumbnailUrl = (url: string | null | undefined) => getImageUrl(url, { width: 400, format: "webp" });
export const coverUrl   = (url: string | null | undefined) => getImageUrl(url, { width: 1600, format: "webp" });
export const logoUrl    = (url: string | null | undefined) => getImageUrl(url, { width: 400,  format: "webp" });
export const snippetUrl = (url: string | null | undefined) => getImageUrl(url, { width: 1080, format: "webp" });
