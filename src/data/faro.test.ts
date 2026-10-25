import { describe, expect, it } from 'vitest';
import { faroDeck, faroBudget, FaroTable } from './faro';
const c = (rank: number, suit = 0) => ({ rank, suit });
describe('Faro rules and real bounty economy', () => {
  it('shuffles 52 unique cards and exposes a soda in a real shoe', () => {
    const deck = faroDeck(() => .25);
    expect(new Set(deck.map(c => `${c.rank}:${c.suit}`)).size).toBe(52);
    const table = new FaroTable(100); expect(table.soda).toBeDefined(); expect(table.remainingCards).toBe(51);
  });
  it('never creates free funds and caps stakes and visit losses', () => {
    expect(new FaroTable(0).placeBet(7, 'player', 2)).toBe(false);
    expect(faroBudget(100)).toEqual({ bankroll: 100, maxStake: 20, lossLimit: 40 });
    expect(faroBudget(1000).maxStake).toBe(50);
    const t = new FaroTable(100, [c(7), c(2), c(7, 1), c(2, 1), c(7, 2), c(2, 2)]);
    for (let i = 0; i < 2; i++) { expect(t.placeBet(7, 'player', 20)).toBe(true); t.deal(); }
    expect(t.finished).toBe(true); expect(t.close().bountyDelta).toBe(-40);
  });
  it('pays even money and qualifies only a $10+ win for an item', () => {
    const t = new FaroTable(100, [c(2), c(7), c(2, 1), c(7, 1)]);
    t.placeBet(7, 'player', 2); expect(t.deal()?.outcome).toBe('win'); expect(t.wonItem).toBe(false);
    t.placeBet(7, 'player', 10); t.deal();
    expect(t.close()).toEqual({ bountyDelta: 12, wonItem: true });
    expect(t.close()).toEqual({ bountyDelta: 12, wonItem: true });
    expect(t.placeBet(7, 'player', 2)).toBe(false);
  });
  it('locks a copper bet through pushes without charging it twice', () => {
    const t = new FaroTable(100, [c(2), c(3), c(7), c(5)]);
    expect(t.placeBet(7, 'banker', 20)).toBe(true); t.deal(); expect(t.balance).toBe(80);
    expect(t.placeBet(5, 'player', 2)).toBe(false);
    expect(t.deal()?.outcome).toBe('win'); expect(t.close().bountyDelta).toBe(20);
  });
  it('takes half a split stake, even with copper', () => {
    const t = new FaroTable(100, [c(7), c(7, 1)]); t.placeBet(7, 'banker', 10);
    expect(t.deal()?.outcome).toBe('split'); expect(t.close().bountyDelta).toBe(-5);
  });
  it('rejects invalid bets and refunds unresolved wagers on exit/end of shoe', () => {
    const t = new FaroTable(20, [c(2), c(3), c(7)]);
    for (const [rank, amount] of [[7, 10], [0, 2], [14, 2], [1, 2], [2, -2], [2, 3]]) expect(t.placeBet(rank, 'player', amount)).toBe(false);
    expect(t.placeBet(7, 'player', 2)).toBe(true); t.deal(); expect(t.close().bountyDelta).toBe(0);
    const paid = new FaroTable(100, [c(2), c(7)]); paid.placeBet(7, 'player', 10); expect(paid.close().bountyDelta).toBe(0);
  });
});
it('allows withdrawing an unresolved bet between pairs without inventing money', () => {
  const t = new FaroTable(100, [c(2), c(3), c(7), c(5)]);
  t.placeBet(7, 'player', 10); t.deal(); t.withdrawBet();
  expect(t.balance).toBe(100); expect(t.activeBet).toBeUndefined(); expect(t.remainingBets).toBe(2);
});
it('matches the exact ordered-pair counts and house edge of a full deck', () => {
  const deck = faroDeck(), counts = { win: 0, lose: 0, split: 0, push: 0 }; let net = 0;
  for (let a = 0; a < 52; a++) for (let b = 0; b < 52; b++) if (a !== b) {
    const t = new FaroTable(100, [deck[a], deck[b], c(7)]); t.placeBet(7, 'player', 10);
    const outcome = t.deal()!.outcome; counts[outcome]++; net += t.close().bountyDelta;
  }
  expect(counts).toEqual({ win: 192, lose: 192, split: 12, push: 2256 });
  expect(net / (52 * 51 * 10)).toBeCloseTo(-.0022624434, 9);
});
