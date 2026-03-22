import { type Card } from './card.js';
import { type HandRank } from './rank.js';
import { FLUSHES, UNIQUE5 } from './tables.js';
import { hashLookup } from './hash.js';

/**
 * Evaluate a 5-card hand using Cactus Kev's algorithm.
 * Returns a HandRank: 1 (Royal Flush, best) → 7462 (worst high card).
 * Lower value = better hand.
 */
export function evaluate(
  cards: readonly [Card, Card, Card, Card, Card],
): HandRank {
  const [c0, c1, c2, c3, c4] = cards;

  // 1. Flush detection: AND of suit nibbles (bits 15-12)
  if ((c0 & c1 & c2 & c3 & c4 & 0xF000) !== 0) {
    const rankBits = (c0 | c1 | c2 | c3 | c4) >>> 16;
    return FLUSHES[rankBits] ?? 0;
  }

  // 2. Distinct-rank non-flush: straights and high-card hands
  const rankBits = (c0 | c1 | c2 | c3 | c4) >>> 16;
  const q = UNIQUE5[rankBits] ?? 0;
  if (q !== 0) return q;

  // 3. Repeated-rank hands: pairs, two-pair, trips, full house, quads
  const product = (c0 & 0xFF) * (c1 & 0xFF) * (c2 & 0xFF)
                * (c3 & 0xFF) * (c4 & 0xFF);
  return hashLookup(product);
}
