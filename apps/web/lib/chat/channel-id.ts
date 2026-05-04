/**
 * Deterministic Stream DM channel ID from two Clerk user IDs.
 * Clerk IDs (~32 chars) joined naively exceed Stream's 64-char channel ID limit.
 * FNV-1a hash produces a fixed 8-hex-char digest → "dm_xxxxxxxx" = 11 chars total.
 * Synchronous, no crypto dependency, safe in browser + server.
 */
export function buildChannelId(userA: string, userB: string): string {
  const canonical = [userA, userB].sort().join("|");
  return "dm_" + fnv32a(canonical);
}

function fnv32a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}
