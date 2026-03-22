import { HASH_VALUES, HASH_ADJUST } from './tables.js';

/**
 * Cactus Kev perfect hash for prime products of repeated-rank hands.
 * Returns the hand rank (1-7462).
 */
export function hashLookup(product: number): number {
  let q = (product + 0xE91AAA35) >>> 0;
  q = (q ^ (q >>> 16)) >>> 0;
  q = (q + (q << 8)) >>> 0;
  q = (q ^ (q >>> 4)) >>> 0;
  const b = (q >>> 8) & 0x1FF;
  const a = (q + (q << 2)) >>> 19;
  const idx = a ^ (HASH_ADJUST[b] ?? 0);
  return HASH_VALUES[idx] ?? 0;
}
