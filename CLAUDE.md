# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install              # Install dependencies
npm run generate         # Regenerate src/tables.ts from scripts/generate-tables.ts
npm test                 # Run all tests (vitest run)
npm run test:watch       # Watch mode
npm run typecheck        # tsc --noEmit
npm run build            # tsup dual CJS/ESM output → dist/
```

Run a single test file:
```bash
npx vitest run tests/card.test.ts
```

## Architecture

This is a pure TypeScript library implementing **Cactus Kev's poker hand evaluator** for 5-card hands. The core API is `evaluate(cards)` which returns a `HandRank` integer (1 = Royal Flush, best; 7462 = 7-high, worst). Lower = better.

### Card encoding (`src/card.ts`)

Each card is a 32-bit integer with this layout:
```
Bits 31-16: rank flag (bit 16+rank is set, one-hot)
Bits 15-12: suit (Clubs=1, Diamonds=2, Hearts=4, Spades=8)
Bits 11- 8: rank index 0-12 (Deuce=0 … Ace=12)
Bits  7- 0: prime for rank (2,3,5,7,11,13,17,19,23,29,31,37,41)
```

### Lookup tables (`src/tables.ts` — generated, do not edit)

Two 8192-entry arrays indexed by the 13-bit rank-OR of all 5 cards (`(c0|c1|c2|c3|c4) >>> 16`):
- `FLUSHES` — hand ranks for flush hands
- `UNIQUE5` — hand ranks for non-flush hands with 5 distinct ranks (straights + high-card)

Two arrays for repeated-rank hands (pairs/two-pair/trips/full house/quads) via prime-product perfect hash:
- `HASH_VALUES[8192]` — hand ranks indexed by hash output
- `HASH_ADJUST[512]` — per-bucket adjustment for Cactus Kev's perfect hash function

Regenerate tables by running `npm run generate`. The script is `scripts/generate-tables.ts`; the generated file is committed so the library has no runtime generation dependency.

### Evaluation dispatch (`src/evaluate.ts`)

Three-path dispatch:
1. **Flush** — AND of suit nibbles (`& 0xF000`) is non-zero → `FLUSHES[rankBits]`
2. **Distinct-rank non-flush** — `UNIQUE5[rankBits] !== 0` → return it (straights, high-card)
3. **Repeated-rank** — multiply all 5 primes → `hashLookup(product)` via `src/hash.ts`

### Hand rank boundaries

| Category       | Range       |
|----------------|-------------|
| Straight Flush | 1 – 10      |
| Four of a Kind | 11 – 166    |
| Full House     | 167 – 322   |
| Flush          | 323 – 1599  |
| Straight       | 1600 – 1609 |
| Three of a Kind| 1610 – 2467 |
| Two Pair       | 2468 – 3325 |
| One Pair       | 3326 – 6185 |
| High Card      | 6186 – 7462 |

### Tests

- `tests/card.test.ts` — card encoding and parsing
- `tests/evaluate.test.ts` — per-category fixtures and ordering checks
- `tests/evaluate.exhaustive.test.ts` — enumerates all C(52,5) = 2,598,960 hands and verifies exact combinatorics counts (60s timeout)
