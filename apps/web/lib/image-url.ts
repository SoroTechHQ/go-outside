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

export const avatarUrl  = (url: string | null | undefined) => getImageUrl(url, { width: 400,  format: "webp" });
export const bannerUrl  = (url: string | null | undefined) => getImageUrl(url, { width: 1200, format: "webp" });
export const logoUrl    = (url: string | null | undefined) => getImageUrl(url, { width: 400,  format: "webp" });
export const snippetUrl = (url: string | null | undefined) => getImageUrl(url, { width: 1080, format: "webp" });
