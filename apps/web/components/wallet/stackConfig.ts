export const PEEK = 100;     // px of lower card visible below card above
export const PULL_UP = 765;  // px to pull each card up (≈ card height - PEEK)

// Empirically derived from: 2 cards → 128 px, 4 cards → 240 px
// Formula: count × 56 + 16
export function stackTopMargin(count: number): number {
  return count * 56 + 24;
}
