# poker-hand-ts

Fast 5-card poker hand evaluator in TypeScript, based on [Cactus Kev's algorithm](http://suffe.cool/poker/evaluator.html).

Returns a `HandRank` integer from **1** (Royal Flush, best) to **7462** (7-high, worst). Lower = better, so hands can be compared with `<`.

## Installation

```bash
npm install poker-hand-ts
```

## Usage

```ts
import { cardFromString, evaluate, handCategory } from 'poker-hand-ts';

const hand = [
  cardFromString('As'),
  cardFromString('Ks'),
  cardFromString('Qs'),
  cardFromString('Js'),
  cardFromString('Ts'),
] as const;

const rank = evaluate(hand);          // 1
console.log(handCategory(rank));      // "Straight Flush"
```

### Comparing hands

```ts
const rank1 = evaluate(hand1);
const rank2 = evaluate(hand2);

if (rank1 < rank2) console.log('hand1 wins');
if (rank1 > rank2) console.log('hand2 wins');
if (rank1 === rank2) console.log('tie');
```

## API

### `cardFromString(s: string): Card`

Parse a two-character card string into a `Card` integer. Rank is one of `2 3 4 5 6 7 8 9 T J Q K A` (case-insensitive); suit is one of `c d h s`.

```ts
cardFromString('Ah')  // Ace of Hearts
cardFromString('2c')  // Deuce of Clubs
```

### `makeCard(rank: Rank, suit: Suit): Card`

Construct a card from the `Rank` and `Suit` enums.

```ts
import { makeCard, Rank, Suit } from 'poker-hand-ts';

const card = makeCard(Rank.Ace, Suit.Spades);
```

### `cardToString(card: Card): string`

Convert a `Card` back to its two-character string representation.

### `evaluate(cards: readonly [Card, Card, Card, Card, Card]): HandRank`

Evaluate a 5-card hand. Returns a `HandRank` integer (1–7462); lower is better.

### `handCategory(rank: HandRank): HandCategory`

Map a `HandRank` to its category string.

```ts
handCategory(1)     // "Straight Flush"
handCategory(11)    // "Four of a Kind"
handCategory(7462)  // "High Card"
```

### Hand rank boundaries

| Category        | Range       |
|-----------------|-------------|
| Straight Flush  | 1 – 10      |
| Four of a Kind  | 11 – 166    |
| Full House      | 167 – 322   |
| Flush           | 323 – 1599  |
| Straight        | 1600 – 1609 |
| Three of a Kind | 1610 – 2467 |
| Two Pair        | 2468 – 3325 |
| One Pair        | 3326 – 6185 |
| High Card       | 6186 – 7462 |

## License

MIT
