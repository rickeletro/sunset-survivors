import { describe, expect, it } from 'vitest';
import { SALOON_REWARD, SaloonVisit, saloonDoors } from './saloon';
import { footprint, stageLandmarks } from './scenery';

describe('optional stage-limited saloon visit', () => {
  it('has an accessible canyon door without adding or expanding a ground obstacle', () => {
    const saloon = stageLandmarks('canyon').find(p => p.kind === 'frontier-saloon')!;
    expect(saloonDoors('canyon')).toEqual([{ x: 3580, y: 3668 }]);
    expect(footprint(saloon)).toEqual(footprint({ ...saloon, kind: 'barn' }));
    expect(saloonDoors('railroad')).toEqual([]);
    expect(saloonDoors('saloon').length).toBeGreaterThan(0);
  });
  it('requires explicit entry within range, unblocked, and consumes one use across all doors', () => {
    const visit = new SaloonVisit([{ x: 0, y: 0 }, { x: 1000, y: 0 }]);
    expect(visit.enter(101, 0, false)).toBe(false);
    expect(visit.enter(100, 0, true)).toBe(false);
    expect(visit.nearby(100, 0, false)).toBeTruthy(); expect(visit.used).toBe(false);
    expect(visit.enter(100, 0, false)).toBe(true);
    expect(visit.enter(0, 0, false)).toBe(false);
    expect(visit.leave(true)).toEqual(SALOON_REWARD);
    expect(visit.leave(true)).toBeUndefined();
    expect(visit.enter(1000, 0, false)).toBe(false);
  });
  it('cannot turn leaving without reward or exit spam into repeated healing or cash', () => {
    const visit = new SaloonVisit([{ x: 0, y: 0 }]);
    expect(visit.leave(true)).toBeUndefined();
    visit.enter(0, 0, false); expect(visit.leave(false)).toBeUndefined();
    expect(visit.leave(true)).toBeUndefined(); expect(visit.enter(0, 0, false)).toBe(false);
  });
});
