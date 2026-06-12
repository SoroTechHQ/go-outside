const NAVII_BASE_URL = "https://api.navii.dev/avatar";
const DEFAULT_SEED = "gooutside-user";

function normalizeSeed(seed: string | null | undefined) {
  const value = seed?.trim();
  return value && value.length > 0 ? value : DEFAULT_SEED;
}

export function naviiAvatarUrl(seed: string | null | undefined, size = 96) {
  const normalizedSize = Number.isFinite(size) && size > 0 ? Math.round(size) : 96;
  return `${NAVII_BASE_URL}/${encodeURIComponent(normalizeSeed(seed))}?size=${normalizedSize}`;
}
