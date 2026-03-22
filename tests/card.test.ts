import { describe, it, expect } from 'vitest';
import { makeCard, cardFromString, cardRank, cardSuit, cardPrime, Rank, Suit } from '../src/card.js';

describe('makeCard', () => {
  it('encodes prime in bits 3-0', () => {
    expect(makeCard(Rank.Deuce, Suit.Spades) & 0x3F).toBe(2);
    expect(makeCard(Rank.Ace,   Suit.Spades) & 0x3F).toBe(41);
  });

  it('encodes rank index in bits 7-4', () => {
    expect(cardRank(makeCard(Rank.Deuce, Suit.Clubs))).toBe(0);
    expect(cardRank(makeCard(Rank.Ace,   Suit.Clubs))).toBe(12);
  });

  it('encodes suit in bits 15-12', () => {
    expect(cardSuit(makeCard(Rank.Ace, Suit.Clubs))).toBe(0x1);
    expect(cardSuit(makeCard(Rank.Ace, Suit.Diamonds))).toBe(0x2);
    expect(cardSuit(makeCard(Rank.Ace, Suit.Hearts))).toBe(0x4);
    expect(cardSuit(makeCard(Rank.Ace, Suit.Spades))).toBe(0x8);
  });

  it('sets exactly one rank-flag bit in bits 31-16', () => {
    const card = makeCard(Rank.Ace, Suit.Spades);
    const rankBits = card >>> 16;
    expect(rankBits).toBe(1 << 12); // Ace = rank 12
  });

  it('encodes correct prime for each rank', () => {
    const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41];
    for (let r = 0; r <= 12; r++) {
      expect(cardPrime(makeCard(r as Rank, Suit.Spades))).toBe(primes[r]);
    }
  });
});

describe('cardFromString', () => {
  it('parses all 52 cards without error', () => {
    const ranks = '23456789TJQKA';
    const suits = 'cdhs';
    for (const r of ranks) {
      for (const s of suits) {
        expect(() => cardFromString(r + s)).not.toThrow();
      }
    }
  });

  it('roundtrips rank and suit', () => {
    const card = cardFromString('Ah');
    expect(cardRank(card)).toBe(12); // Ace
    expect(cardSuit(card)).toBe(0x4); // Hearts
  });

  it('throws on invalid input', () => {
    expect(() => cardFromString('XX')).toThrow();
    expect(() => cardFromString('A')).toThrow();
  });
});
