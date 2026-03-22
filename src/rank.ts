// Hand rank values: 1 (Royal Flush, best) → 7462 (7-high, worst)
// Lower value = better hand

export type HandRank = number;

export type HandCategory =
  | 'Straight Flush'
  | 'Four of a Kind'
  | 'Full House'
  | 'Flush'
  | 'Straight'
  | 'Three of a Kind'
  | 'Two Pair'
  | 'One Pair'
  | 'High Card';

export function handCategory(rank: HandRank): HandCategory {
  if (rank <=   10) return 'Straight Flush';
  if (rank <=  166) return 'Four of a Kind';
  if (rank <=  322) return 'Full House';
  if (rank <= 1599) return 'Flush';
  if (rank <= 1609) return 'Straight';
  if (rank <= 2467) return 'Three of a Kind';
  if (rank <= 3325) return 'Two Pair';
  if (rank <= 6185) return 'One Pair';
  return 'High Card';
}

export function handRankName(rank: HandRank): string {
  return handCategory(rank);
}
