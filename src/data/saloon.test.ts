import { describe, expect, it } from 'vitest';
import { SALOON_ENTRY_RADIUS, SaloonVisit, saloonDoors, buildingDistance } from './saloon';
import { footprint, stageLandmarks } from './scenery';

describe('optional stage-limited saloon visit', () => {
  it.each(['saloon', 'hospitality', 'gallery'] as const)('allows %s entry near either side of the building without standing on the door circle', activity => {
    const door = saloonDoors('canyon').find(d => (d.activity ?? 'saloon') === activity)!;
    const f = door.portal!.facade;
    for (const side of [-1, 1]) {
      const visit = new SaloonVisit([door], undefined, true);
      const x = f.x + side * (f.width / 2 + SALOON_ENTRY_RADIUS - 1), y = f.y + 40;
      expect(Math.hypot(x - door.x, y - door.y)).toBeGreaterThan(SALOON_ENTRY_RADIUS);
      expect(buildingDistance(door, x, y)).toBeCloseTo(SALOON_ENTRY_RADIUS - 1);
      expect(visit.nearby(x, y, false)).toBe(door);
      expect(visit.open).toBe(false);
      expect(visit.enter(x, y, false, door)).toBe(true);
    }
    const visit = new SaloonVisit([door]);
    const farX = f.x + f.width / 2 + SALOON_ENTRY_RADIUS + 1;
    expect(visit.enter(farX, f.y, false, door)).toBe(false);
    expect(visit.enter(f.x, f.y, true, door)).toBe(false);
  });
  it('has an accessible canyon door without adding or expanding a ground obstacle', () => {
    const saloon = stageLandmarks('canyon').find(p => p.kind === 'frontier-saloon')!;
    expect(saloonDoors('canyon')[0]).toMatchObject({ x: 3580, y: 3668 });
    expect(footprint(saloon)).toEqual(footprint({ ...saloon, kind: 'barn' }));
    expect(saloonDoors('railroad')).toHaveLength(11);
    expect(saloonDoors('saloon').length).toBeGreaterThan(0);
  });
  it('requires explicit entry within range, unblocked, and consumes one use across all doors', () => {
    const visit = new SaloonVisit([{ x: 0, y: 0 }, { x: 1000, y: 0 }]);
    expect(visit.enter(161, 0, false)).toBe(false);
    expect(visit.enter(160, 0, true)).toBe(false);
    expect(visit.nearby(160, 0, false)).toBeTruthy(); expect(visit.used).toBe(false);
    expect(visit.enter(160, 0, false)).toBe(true);
    expect(visit.enter(0, 0, false)).toBe(false);
    expect(visit.leave(true)).toBeUndefined();
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

it('never grants free courtesy rewards on accepted exit', () => {
  const reward = { healthFraction: 0.2, bounty: 35, xp: 40 };
  const doors = saloonDoors('railroad'), visit = new SaloonVisit(doors, reward);
  expect(visit.leave(true)).toBeUndefined();
  expect(visit.enter(doors[0].x, doors[0].y, false)).toBe(true);
  expect(visit.leave(true)).toBeUndefined();
  expect(visit.leave(true)).toBeUndefined();
  expect(visit.enter(doors[1].x, doors[1].y, false)).toBe(false);
});

it('supports several independent doors when explicitly enabled, including hospitality rewards', () => {
  const doors = saloonDoors('canyon'), visit = new SaloonVisit(doors, undefined, true);
  const home = doors.find(d => d.activity === 'hospitality')!;
  expect(visit.enter(home.x, home.y, false, home)).toBe(true);
  expect(visit.leave(true)).toBeUndefined();
  expect(visit.wasUsed(home)).toBe(true);
  expect(visit.enter(home.x, home.y, false, home)).toBe(false);
  const saloon = doors[0];
  expect(visit.enter(saloon.x, saloon.y, false, saloon)).toBe(true);
  expect(visit.leave(true)).toBeUndefined();
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

it('keeps Faro available through repeat visits until the door prize is won, without free courtesy heals', () => {
  const doors = saloonDoors('railroad'), door = doors[0];
  const visit = new SaloonVisit(doors, { healthFraction: .2, bounty: 0 }, true, true);
  for (let i = 0; i < 4; i++) {
    expect(visit.enter(door.x, door.y, false, door)).toBe(true);
    expect(visit.leave(true, false)).toBeUndefined();
    expect(visit.wasUsed(door)).toBe(false);
  }
  expect(visit.enter(door.x, door.y, false, door)).toBe(true); visit.leave(true, true);
  expect(visit.wasUsed(door)).toBe(true); expect(visit.enter(door.x, door.y, false, door)).toBe(false);
  const home = doors.find(d => d.activity === 'hospitality')!;
  expect(visit.enter(home.x, home.y, false, home)).toBe(true); expect(visit.leave(true)).toBeUndefined();
  expect(visit.enter(home.x, home.y, false, home)).toBe(false);
});
it('does not consume a repeatable Faro doorway on cancelled entry or declined exit', () => {
  const door = { x: 0, y: 0 }, visit = new SaloonVisit([door], undefined, true, true);
  visit.enter(0, 0, false); visit.leave(false); expect(visit.used).toBe(false); expect(visit.enter(0, 0, false)).toBe(true);
});

it('offers a dedicated gallery in every theme without replacing ordinary saloons or hospitality', async () => {
  const { STAGES } = await import('./stages');
  for (const stage of STAGES) {
    const doors = saloonDoors(stage.theme), galleries = doors.filter(d => d.activity === 'gallery');
    expect(galleries).toHaveLength(1); expect(galleries[0].portal?.facade.texture).toBe('scenery_gallery-saloon');
    const guide = (await import('./saloon')).buildingDirections(new SaloonVisit(doors, undefined, true), 4000, 4000, stage.id);
    expect(guide).toContain('TARGETS');
  }
  const rail = saloonDoors('railroad');
  expect(rail.filter(d => d.activity === 'saloon')).toHaveLength(5);
  expect(rail.find(d => d.activity === 'gallery')?.portal?.id).not.toBe(rail.find(d => d.activity === 'saloon')?.portal?.id);
});
it('consumes the gallery once even when Faro doors allow unlimited paid retries', () => {
  const doors = saloonDoors('railroad'), gallery = doors.find(d => d.activity === 'gallery')!;
  const visit = new SaloonVisit(doors, { healthFraction: .2, bounty: 0 }, true, true);
  expect(visit.enter(gallery.x, gallery.y, false, gallery)).toBe(true); visit.leave(false);
  expect(visit.wasUsed(gallery)).toBe(true); expect(visit.enter(gallery.x, gallery.y, false, gallery)).toBe(false);
  const faro = doors.find(d => d.activity === 'saloon')!;
  expect(visit.enter(faro.x, faro.y, false, faro)).toBe(true); visit.leave(false);
  expect(visit.wasUsed(faro)).toBe(false); expect(visit.enter(faro.x, faro.y, false, faro)).toBe(true);
});
