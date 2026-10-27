import { describe, expect, it } from 'vitest';
import { economicRun } from '../../scripts/economy-model';
import { ECONOMY, bankReward, servicePrice, type RunServiceId } from './economy';

describe('economic progression and pricing contract', () => {
  it('prices each paid service monotonically across eight stages', () => {
    for (const id of Object.keys(ECONOMY.services) as RunServiceId[]) {
      const prices=Array.from({length:8},(_,i)=>servicePrice(id,i+1));
      expect(prices[0]).toBeGreaterThan(0);
      expect(prices).toEqual([...prices].sort((a,b)=>a-b));
      expect(servicePrice(id,0)).toBe(prices[0]);
      expect(servicePrice(id,99)).toBe(prices[7]);
    }
  });
  it('caps time credit and rejects malformed income without creating funds', () => {
    expect(bankReward(100,600,true)).toBe(180);
    expect(bankReward(100,900,true)).toBe(180);
    expect(bankReward(NaN,Infinity,false)).toBe(0);
    expect(bankReward(-100,-60,false)).toBe(0);
    expect(bankReward(100,600,true,'hardcore')).toBeGreaterThan(bankReward(100,600,true,'easy'));
  });
  it('conserves run money in every duration, profile and difficulty scenario', () => {
    for (const mode of ['easy','normal','hardcore'] as const)
      for (const profile of ['cautious','steady','fast'] as const)
        for (const length of ['short','medium','long'] as const) {
          const row=economicRun(length,profile,mode);
          expect(row.remaining).toBe(row.gross+row.galleryGross-row.spent);
          expect(row.remaining).toBeGreaterThanOrEqual(0);
          expect(row.banked).toBe(row.remaining+bankReward(0,row.seconds,length==='long',mode));
          expect(row.bobRuns).toBeGreaterThan(0);
          expect(row.cormanoTotalRuns).toBeGreaterThan(row.bobRuns);
        }
  });
  it('keeps full-run unlocks attainable while costing more than one run', () => {
    expect(ECONOMY.characters.cormano).toBeGreaterThan(ECONOMY.characters.bob*2);
    for (const profile of ['cautious','steady','fast'] as const) {
      const row=economicRun('long',profile);
      expect(row.bobRuns).toBeGreaterThanOrEqual(1);
      expect(row.bobRuns).toBeLessThanOrEqual(4);
      expect(row.cormanoTotalRuns).toBeLessThanOrEqual(14);
    }
    expect(economicRun('short').banked).toBeLessThan(economicRun('medium').banked);
    expect(economicRun('medium').banked).toBeLessThan(economicRun('long').banked);
  });
});
