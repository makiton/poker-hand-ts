import { describe, it, expect } from 'vitest';
import { makeCard, Rank, Suit } from '../src/card.js';
import { evaluate } from '../src/evaluate.js';
import { handCategory } from '../src/rank.js';

// Build full 52-card deck
function makeDeck() {
  const deck = [];
  for (let r = 0; r <= 12; r++) {
    for (const s of [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]) {
      deck.push(makeCard(r as Rank, s));
    }
  }
  return deck;
}

describe('exhaustive 5-card evaluation (C(52,5) = 2,598,960 hands)', () => {
  it('evaluates all hands in range [1, 7462] with correct category counts', () => {
    const deck = makeDeck();
    const counts: Record<string, number> = {};
    let total = 0;

    for (let a = 0; a < 48; a++) {
      for (let b = a + 1; b < 49; b++) {
        for (let c = b + 1; c < 50; c++) {
          for (let d = c + 1; d < 51; d++) {
            for (let e = d + 1; e < 52; e++) {
              const cards = [deck[a]!, deck[b]!, deck[c]!, deck[d]!, deck[e]!] as const;
              const rank = evaluate(cards as [number,number,number,number,number]);
              expect(rank).toBeGreaterThanOrEqual(1);
              expect(rank).toBeLessThanOrEqual(7462);
              const cat = handCategory(rank);
              counts[cat] = (counts[cat] ?? 0) + 1;
              total++;
            }
          }
        }
      }
    }

    expect(total).toBe(2_598_960);

    // Known poker combinatorics
    expect(counts['Straight Flush']).toBe(40);
    expect(counts['Four of a Kind']).toBe(624);
    expect(counts['Full House']).toBe(3_744);
    expect(counts['Flush']).toBe(5_108);
    expect(counts['Straight']).toBe(10_200);
    expect(counts['Three of a Kind']).toBe(54_912);
    expect(counts['Two Pair']).toBe(123_552);
    expect(counts['One Pair']).toBe(1_098_240);
    expect(counts['High Card']).toBe(1_302_540);
  }, 60_000); // 60s timeout
});
