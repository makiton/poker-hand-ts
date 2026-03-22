import { describe, it, expect } from 'vitest';
import { evaluate } from '../src/evaluate.js';
import { handCategory } from '../src/rank.js';
import { cardFromString } from '../src/card.js';
import type { Card } from '../src/card.js';

function hand(strs: [string, string, string, string, string]): readonly [Card, Card, Card, Card, Card] {
  return strs.map(cardFromString) as unknown as [Card, Card, Card, Card, Card];
}

describe('evaluate — hand categories', () => {
  it('Royal Flush = rank 1', () => {
    const r = evaluate(hand(['As', 'Ks', 'Qs', 'Js', 'Ts']));
    expect(r).toBe(1);
    expect(handCategory(r)).toBe('Straight Flush');
  });

  it('Straight Flush (9-high)', () => {
    const r = evaluate(hand(['9s', '8s', '7s', '6s', '5s']));
    expect(handCategory(r)).toBe('Straight Flush');
    expect(r).toBeGreaterThan(1);
    expect(r).toBeLessThanOrEqual(10);
  });

  it('Wheel straight flush (5-high) = rank 10', () => {
    const r = evaluate(hand(['As', '2s', '3s', '4s', '5s']));
    expect(r).toBe(10);
  });

  it('Four of a Kind', () => {
    const r = evaluate(hand(['Ah', 'Ad', 'As', 'Ac', 'Kh']));
    expect(handCategory(r)).toBe('Four of a Kind');
    expect(r).toBe(11); // Best quad hand
  });

  it('Full House', () => {
    const r = evaluate(hand(['Ah', 'Ad', 'As', 'Kh', 'Kd']));
    expect(handCategory(r)).toBe('Full House');
    expect(r).toBe(167); // Best full house
  });

  it('Flush', () => {
    const r = evaluate(hand(['As', 'Qs', '9s', '6s', '3s']));
    expect(handCategory(r)).toBe('Flush');
  });

  it('Broadway Straight (A-high)', () => {
    const r = evaluate(hand(['Ah', 'Kd', 'Qc', 'Js', 'Th']));
    expect(handCategory(r)).toBe('Straight');
    expect(r).toBe(1600);
  });

  it('Wheel Straight (5-high) = rank 1609', () => {
    const r = evaluate(hand(['Ah', '2d', '3c', '4s', '5h']));
    expect(handCategory(r)).toBe('Straight');
    expect(r).toBe(1609);
  });

  it('Three of a Kind', () => {
    const r = evaluate(hand(['Ah', 'Ad', 'As', 'Kh', 'Qd']));
    expect(handCategory(r)).toBe('Three of a Kind');
  });

  it('Two Pair', () => {
    const r = evaluate(hand(['Ah', 'Ad', 'Kh', 'Kd', 'Qc']));
    expect(handCategory(r)).toBe('Two Pair');
  });

  it('One Pair', () => {
    const r = evaluate(hand(['Ah', 'Ad', 'Kh', 'Qd', 'Jc']));
    expect(handCategory(r)).toBe('One Pair');
  });

  it('High Card', () => {
    const r = evaluate(hand(['7h', '5d', '4c', '3s', '2h']));
    expect(handCategory(r)).toBe('High Card');
    expect(r).toBe(7462); // Worst possible hand
  });
});

describe('evaluate — ordering', () => {
  it('Straight Flush beats Four of a Kind', () => {
    const sf = evaluate(hand(['9s', '8s', '7s', '6s', '5s']));
    const foak = evaluate(hand(['Ah', 'Ad', 'As', 'Ac', 'Kh']));
    expect(sf).toBeLessThan(foak);
  });

  it('Four of a Kind beats Full House', () => {
    const foak = evaluate(hand(['2h', '2d', '2s', '2c', '3h']));
    const fh = evaluate(hand(['Ah', 'Ad', 'As', 'Kh', 'Kd']));
    expect(foak).toBeLessThan(fh);
  });

  it('Full House beats Flush', () => {
    const fh = evaluate(hand(['2h', '2d', '2s', '3h', '3d']));
    const fl = evaluate(hand(['As', 'Qs', '9s', '6s', '3s']));
    expect(fh).toBeLessThan(fl);
  });

  it('Flush beats Straight', () => {
    const fl = evaluate(hand(['7s', '5s', '4s', '3s', '2s']));
    const st = evaluate(hand(['Ah', 'Kd', 'Qc', 'Js', 'Th']));
    expect(fl).toBeLessThan(st);
  });

  it('Straight beats Three of a Kind', () => {
    const st = evaluate(hand(['Ah', 'Kd', 'Qc', 'Js', 'Th']));
    const toak = evaluate(hand(['2h', '2d', '2s', '3h', '4d']));
    expect(st).toBeLessThan(toak);
  });

  it('Higher flush beats lower flush', () => {
    const high = evaluate(hand(['As', 'Ks', 'Qs', 'Js', '9s']));
    const low  = evaluate(hand(['7s', '5s', '4s', '3s', '2s']));
    expect(high).toBeLessThan(low);
  });
});
