import { describe, expect, it } from 'vitest';
import { SALOON_REWARD, SaloonVisit, saloonDoors } from './saloon';
import { footprint, stageLandmarks } from './scenery';

describe('optional stage-limited saloon visit', () => {
  it('has an accessible canyon door without adding or expanding a ground obstacle', () => {
    const saloon = stageLandmarks('canyon').find(p => p.kind === 'frontier-saloon')!;
    expect(saloonDoors('canyon')[0]).toMatchObject({ x: 3580, y: 3668 });
    expect(footprint(saloon)).toEqual(footprint({ ...saloon, kind: 'barn' }));
    expect(saloonDoors('railroad')).toHaveLength(10);
    expect(saloonDoors('saloon').length).toBeGreaterThan(0);
  });
  it('requires explicit entry within range, unblocked, and consumes one use across all doors', () => {
    const visit = new SaloonVisit([{ x: 0, y: 0 }, { x: 1000, y: 0 }]);
    expect(visit.enter(161, 0, false)).toBe(false);
    expect(visit.enter(160, 0, true)).toBe(false);
    expect(visit.nearby(160, 0, false)).toBeTruthy(); expect(visit.used).toBe(false);
    expect(visit.enter(160, 0, false)).toBe(true);
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

it('grants the railroad courtesy only once, on accepted exit', () => {
  const reward = { healthFraction: 0.2, bounty: 35, xp: 40 };
  const doors = saloonDoors('railroad'), visit = new SaloonVisit(doors, reward);
  expect(visit.leave(true)).toBeUndefined();
  expect(visit.enter(doors[0].x, doors[0].y, false)).toBe(true);
  expect(visit.leave(true)).toEqual(reward);
  expect(visit.leave(true)).toBeUndefined();
  expect(visit.enter(doors[1].x, doors[1].y, false)).toBe(false);
});

it('supports several independent doors when explicitly enabled, including hospitality rewards', () => {
  const doors = saloonDoors('canyon'), visit = new SaloonVisit(doors, undefined, true);
  const home = doors.find(d => d.activity === 'hospitality')!;
  expect(visit.enter(home.x, home.y, false, home)).toBe(true);
  expect(visit.leave(true)).toEqual({ healthFraction: 0.12, bounty: 0, xp: 20 });
  expect(visit.wasUsed(home)).toBe(true);
  expect(visit.enter(home.x, home.y, false, home)).toBe(false);
  const saloon = doors[0];
  expect(visit.enter(saloon.x, saloon.y, false, saloon)).toBe(true);
  expect(visit.leave(true)).toEqual(SALOON_REWARD);
});

it('advertises both Faro and independent hospitality in the railroad settlement', async () => {
  const { buildingDirections } = await import('./saloon');
  const doors = saloonDoors('railroad'), visit = new SaloonVisit(doors, undefined, true);
  const guide = buildingDirections(visit, 4000, 4000, 2);
  expect(guide).toContain('FARO'); expect(guide).toContain('HOSPITALITY'); expect(guide).toContain('SOUTH');
  const home = doors.find(d => d.activity === 'hospitality')!;
  expect(buildingDirections(visit, home.x, home.y, 2)).toContain('HOSPITALITY: [E] ENTER');
  visit.enter(home.x, home.y, false, home); visit.leave(true);
  expect(visit.wasUsed(home)).toBe(true);
  expect(buildingDirections(visit, 4000, 4000, 2)).toContain('FARO');
});

it('keeps Faro available through repeat visits until the door prize is won, with one courtesy heal', () => {
  const doors = saloonDoors('railroad'), door = doors[0];
  const visit = new SaloonVisit(doors, { healthFraction: .2, bounty: 0 }, true, true);
  for (let i = 0; i < 4; i++) {
    expect(visit.enter(door.x, door.y, false, door)).toBe(true);
    expect(visit.leave(true, false)).toEqual(i === 0 ? { healthFraction: .2, bounty: 0 } : undefined);
    expect(visit.wasUsed(door)).toBe(false);
  }
  expect(visit.enter(door.x, door.y, false, door)).toBe(true); visit.leave(true, true);
  expect(visit.wasUsed(door)).toBe(true); expect(visit.enter(door.x, door.y, false, door)).toBe(false);
  const home = doors.find(d => d.activity === 'hospitality')!;
  expect(visit.enter(home.x, home.y, false, home)).toBe(true); expect(visit.leave(true)).toEqual({ healthFraction: .12, bounty: 0, xp: 20 });
  expect(visit.enter(home.x, home.y, false, home)).toBe(false);
});
it('does not consume a repeatable Faro doorway on cancelled entry or declined exit', () => {
  const door = { x: 0, y: 0 }, visit = new SaloonVisit([door], undefined, true, true);
  visit.enter(0, 0, false); visit.leave(false); expect(visit.used).toBe(false); expect(visit.enter(0, 0, false)).toBe(true);
});
