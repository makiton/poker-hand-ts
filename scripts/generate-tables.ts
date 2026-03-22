// Run: npx tsx scripts/generate-tables.ts
// Generates: src/tables.ts

import { writeFileSync } from 'fs';

const PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41];

// ── Helpers ──────────────────────────────────────────────────────────────

/** All C(n, k) combinations of indices 0..n-1 */
function combinations(n: number, k: number): number[][] {
  const result: number[][] = [];
  const combo: number[] = [];
  function go(start: number) {
    if (combo.length === k) { result.push([...combo]); return; }
    for (let i = start; i < n; i++) {
      combo.push(i);
      go(i + 1);
      combo.pop();
    }
  }
  go(0);
  return result;
}

/** Is a sorted array of 5 rank indices a straight? */
function isStraight(ranks: number[]): boolean {
  const sorted = [...ranks].sort((a, b) => a - b);
  // Normal straight: consecutive ranks
  if (sorted[4]! - sorted[0]! === 4 &&
      sorted[1]! - sorted[0]! === 1 &&
      sorted[2]! - sorted[0]! === 2 &&
      sorted[3]! - sorted[0]! === 3) return true;
  // Wheel: A-2-3-4-5 (ranks 12,0,1,2,3)
  if (sorted[0] === 0 && sorted[1] === 1 && sorted[2] === 2 &&
      sorted[3] === 3 && sorted[4] === 12) return true;
  return false;
}

/** High card of a straight (rank index 0-12), e.g. wheel → 3 (5-high) */
function straightHighCard(ranks: number[]): number {
  const sorted = [...ranks].sort((a, b) => b - a); // descending
  if (sorted[0] === 12 && sorted[4] === 0) return 3; // wheel: 5-high
  return sorted[0]!;
}

/** Mask for an array of rank indices (13-bit) */
function rankMask(ranks: number[]): number {
  return ranks.reduce((m, r) => m | (1 << r), 0);
}

// ── 1. FLUSHES & UNIQUE5 (8192 entries each) ───────────────────────────

// Rank boundaries:
// SF   :   1 -   10
// Flush: 323 - 1599
// Str  :1600 - 1609
// HC   :6186 - 7462

const flushes  = new Int32Array(8192);
const unique5  = new Int32Array(8192);

// Enumerate all C(13,5) rank combos
const allCombos5 = combinations(13, 5);

// Separate into straights and non-straights
const straightMasks: number[] = [];
const nonStraightMasks: number[] = [];

for (const ranks of allCombos5) {
  const mask = rankMask(ranks);
  if (isStraight(ranks)) {
    straightMasks.push(mask);
  } else {
    nonStraightMasks.push(mask);
  }
}

// Sort straights by high card (descending) → rank 1..10 for SF, 1600..1609 for straight
// straightHighCard descending order
straightMasks.sort((a, b) => {
  const rankA = [...Array(13).keys()].filter(i => (a >> i) & 1);
  const rankB = [...Array(13).keys()].filter(i => (b >> i) & 1);
  const hcA = straightHighCard(rankA);
  const hcB = straightHighCard(rankB);
  return hcB - hcA; // descending
});

// Sort non-straights by mask descending → best hand has highest mask
nonStraightMasks.sort((a, b) => b - a);

// Assign flush table
for (let i = 0; i < straightMasks.length; i++) {
  const mask = straightMasks[i]!;
  flushes[mask] = i + 1; // 1..10 for SF
}
for (let i = 0; i < nonStraightMasks.length; i++) {
  const mask = nonStraightMasks[i]!;
  flushes[mask] = 323 + i; // 323..1599 for flush
}

// Assign unique5 table (non-flush)
for (let i = 0; i < straightMasks.length; i++) {
  const mask = straightMasks[i]!;
  unique5[mask] = 1600 + i; // 1600..1609 for straight
}
for (let i = 0; i < nonStraightMasks.length; i++) {
  const mask = nonStraightMasks[i]!;
  unique5[mask] = 6186 + i; // 6186..7462 for high card
}

// ── 2. HASH_VALUES & HASH_ADJUST (for paired hands) ────────────────────

// Enumerate all hands with repeated ranks and compute their prime products

interface HandEntry {
  product: number;
  rank: number;
}

const entries: HandEntry[] = [];

// Helper: add entry for a prime product and hand rank
function addEntry(rankIndices: number[], handRankValue: number) {
  const product = rankIndices.reduce((p, r) => p * PRIMES[r]!, 1);
  entries.push({ product, rank: handRankValue });
}

// Four of a kind (11-166): 13 * 12 = 156
// Sort: quad rank desc, kicker rank desc
{
  let rank = 11;
  for (let q = 12; q >= 0; q--) {   // quad rank, high to low
    for (let k = 12; k >= 0; k--) { // kicker, high to low
      if (k === q) continue;
      addEntry([q, q, q, q, k], rank++);
    }
  }
}

// Full house (167-322): 13 * 12 = 156
// Sort: trip rank desc, pair rank desc
{
  let rank = 167;
  for (let t = 12; t >= 0; t--) {   // trip rank, high to low
    for (let p = 12; p >= 0; p--) { // pair rank, high to low
      if (p === t) continue;
      addEntry([t, t, t, p, p], rank++);
    }
  }
}

// Three of a kind (1610-2467): 13 * C(12,2) = 858
// Sort: trip rank desc, then kickers as pair (sort kickers descending)
{
  let rank = 1610;
  for (let t = 12; t >= 0; t--) {
    // Kicker pairs sorted by (high kicker desc, low kicker desc)
    const kickers: [number, number][] = [];
    for (let k1 = 12; k1 >= 0; k1--) {
      for (let k2 = k1 - 1; k2 >= 0; k2--) {
        if (k1 !== t && k2 !== t) kickers.push([k1, k2]);
      }
    }
    // Already in descending order (k1 high to low, k2 high to low for each k1)
    for (const [k1, k2] of kickers) {
      addEntry([t, t, t, k1, k2], rank++);
    }
  }
}

// Two pair (2468-3325): C(13,2) * 11 = 858
// Sort: high pair rank desc, low pair rank desc, kicker desc
{
  let rank = 2468;
  for (let p1 = 12; p1 >= 0; p1--) {
    for (let p2 = p1 - 1; p2 >= 0; p2--) {
      for (let k = 12; k >= 0; k--) {
        if (k === p1 || k === p2) continue;
        addEntry([p1, p1, p2, p2, k], rank++);
      }
    }
  }
}

// One pair (3326-6185): 13 * C(12,3) = 2860
// Sort: pair rank desc, then kickers sorted descending (as triple)
{
  let rank = 3326;
  for (let p = 12; p >= 0; p--) {
    // All C(12,3) kicker combos, sorted by (k1 desc, k2 desc, k3 desc)
    const kickers: [number, number, number][] = [];
    for (let k1 = 12; k1 >= 0; k1--) {
      for (let k2 = k1 - 1; k2 >= 0; k2--) {
        for (let k3 = k2 - 1; k3 >= 0; k3--) {
          if (k1 !== p && k2 !== p && k3 !== p) kickers.push([k1, k2, k3]);
        }
      }
    }
    for (const [k1, k2, k3] of kickers) {
      addEntry([p, p, k1, k2, k3], rank++);
    }
  }
}

console.log(`Total paired hand entries: ${entries.length}`); // should be 4888

// ── 3. Build perfect hash (hash_adjust + hash_values) ──────────────────

// Cactus Kev hash function (intermediate values)
function hashIntermediate(key: number): { a: number, b: number } {
  let q = (key + 0xE91AAA35) >>> 0;
  q = (q ^ (q >>> 16)) >>> 0;
  q = (q + (q << 8)) >>> 0;
  q = (q ^ (q >>> 4)) >>> 0;
  const b = (q >>> 8) & 0x1FF;
  const a = ((q + (q << 2)) >>> 19);
  return { a, b };
}

// Compute (a, b) for each entry
const entryHashes = entries.map(e => ({
  ...e,
  ...hashIntermediate(e.product),
}));

// Group by b
const groups = new Map<number, typeof entryHashes>();
for (const e of entryHashes) {
  const g = groups.get(e.b) ?? [];
  g.push(e);
  groups.set(e.b, g);
}

// Greedy perfect hash construction
// Process groups from largest to smallest (critical for greedy to succeed)
// For each bucket b, find hash_adjust[b] such that a ^ adjust doesn't collide globally
const hashAdjust = new Int32Array(512);
const usedIndices = new Set<number>();
// We also need hash_values to be sized appropriately
// Max possible index: a (up to 8191) XOR adjust (up to 8191) = up to 8191
const hashValues = new Int32Array(8192);

// Sort buckets by group size descending
const bucketOrder = Array.from({ length: 512 }, (_, i) => i)
  .sort((a, b) => (groups.get(b)?.length ?? 0) - (groups.get(a)?.length ?? 0));

for (const b of bucketOrder) {
  const group = groups.get(b);
  if (!group || group.length === 0) {
    hashAdjust[b] = 0;
    continue;
  }

  // Find adjust value (0-8191) such that all a ^ adjust are unused and distinct
  let found = false;
  for (let adj = 0; adj < 8192; adj++) {
    const indices = group.map(e => e.a ^ adj);
    // Check uniqueness within the group
    const indexSet = new Set(indices);
    if (indexSet.size !== indices.length) continue;
    // Check no collision with globally used indices
    if (indices.some(idx => usedIndices.has(idx))) continue;
    // All unique and unused
    hashAdjust[b] = adj;
    for (let i = 0; i < group.length; i++) {
      const idx = indices[i]!;
      usedIndices.add(idx);
      hashValues[idx] = group[i]!.rank;
    }
    found = true;
    break;
  }
  if (!found) throw new Error(`Could not find hash_adjust for b=${b}`);
}

console.log(`Hash slots used: ${usedIndices.size} of 8192`);

// ── 4. Write src/tables.ts ──────────────────────────────────────────────

function arrayLiteral(arr: Int32Array, name: string): string {
  const vals = Array.from(arr).join(',');
  return `export const ${name}: readonly number[] = [${vals}];\n`;
}

const output = `// AUTO-GENERATED by scripts/generate-tables.ts — do not edit manually
// Cactus Kev poker hand lookup tables

${arrayLiteral(flushes, 'FLUSHES')}
${arrayLiteral(unique5, 'UNIQUE5')}
${arrayLiteral(hashValues, 'HASH_VALUES')}
${arrayLiteral(hashAdjust, 'HASH_ADJUST')}
`;

writeFileSync(new URL('../src/tables.ts', import.meta.url), output, 'utf8');
console.log('Generated src/tables.ts');
