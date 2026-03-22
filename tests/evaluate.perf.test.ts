import { describe, it, expect } from 'vitest';
import { makeCard, Rank, Suit } from '../src/card.js';
import { evaluate } from '../src/evaluate.js';
import type { Card } from '../src/card.js';

function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (let r = 0; r <= 12; r++) {
    for (const s of [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]) {
      deck.push(makeCard(r as Rank, s));
    }
  }
  return deck;
}

function buildHands(count: number): Array<readonly [Card, Card, Card, Card, Card]> {
  const deck = makeDeck();
  const hands: Array<readonly [Card, Card, Card, Card, Card]> = [];
  let seed = 0xdeadbeef;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed;
  };
  for (let i = 0; i < count; i++) {
    const d = deck.slice();
    for (let j = 0; j < 5; j++) {
      const k = j + (rand() % (52 - j));
      [d[j], d[k]] = [d[k]!, d[j]!];
    }
    hands.push([d[0]!, d[1]!, d[2]!, d[3]!, d[4]!]);
  }
  return hands;
}

const HANDS_10K = buildHands(10_000);

describe('evaluate() performance', () => {
  it('evaluates 10,000 hands in under 1 second', () => {
    const start = performance.now();
    for (const hand of HANDS_10K) {
      evaluate(hand);
    }
    const elapsed = performance.now() - start;
    expect(
      elapsed,
      `10,000 evaluations took ${elapsed.toFixed(1)} ms (limit: 1000 ms)`,
    ).toBeLessThan(1000);
  });
});
