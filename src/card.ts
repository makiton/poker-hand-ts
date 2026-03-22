export type Card = number;

// First 13 primes, one per rank
const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41] as const;

export const enum Rank {
  Deuce = 0, Three, Four, Five, Six, Seven, Eight,
  Nine, Ten, Jack, Queen, King, Ace,
}

export const enum Suit {
  Clubs = 0x1, Diamonds = 0x2, Hearts = 0x4, Spades = 0x8,
}

/**
 * Encode a card as a 32-bit integer (Cactus Kev layout):
 *   Bits 31-16: rank flag (bit 16+rank is set)
 *   Bits 15-12: suit (one-hot: C=1, D=2, H=4, S=8)
 *   Bits 11- 8: rank index 0-12
 *   Bits  7- 0: prime for rank (fits in 8 bits; max prime 41)
 */
export function makeCard(rank: Rank, suit: Suit): Card {
  return (1 << (16 + rank)) | (suit << 12) | (rank << 8) | PRIMES[rank]!;
}

export const cardRank  = (c: Card): number => (c >>> 8) & 0xF;
export const cardSuit  = (c: Card): number => (c >>> 12) & 0xF;
export const cardPrime = (c: Card): number => c & 0xFF;

const RANK_CHARS = '23456789TJQKA';
const SUIT_CHARS = 'cdhs';
const SUIT_VALUES: Suit[] = [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades];

export function cardFromString(s: string): Card {
  if (s.length !== 2) throw new Error(`Invalid card string: "${s}"`);
  const rank = RANK_CHARS.indexOf(s[0]!.toUpperCase());
  const suitIdx = SUIT_CHARS.indexOf(s[1]!.toLowerCase());
  if (rank === -1 || suitIdx === -1) throw new Error(`Invalid card string: "${s}"`);
  return makeCard(rank as Rank, SUIT_VALUES[suitIdx]!);
}

export function cardToString(c: Card): string {
  const rank = cardRank(c);
  const suit = cardSuit(c);
  const suitIdx = [1, 2, 4, 8].indexOf(suit);
  return (RANK_CHARS[rank] ?? '?') + (SUIT_CHARS[suitIdx] ?? '?');
}
