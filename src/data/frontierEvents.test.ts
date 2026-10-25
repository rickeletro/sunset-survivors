import { expect, it } from 'vitest';
import { advanceFrontierEvent, frontierEvents, hitFrontierProp, segmentNear } from './frontierEvents';
it('uses finite proximity encounters with a full warning and no automatic camera movement', () => {
  const events = frontierEvents('burning-town'); expect(events.length).toBeLessThanOrEqual(25);
  const e = events.find(e => e.kind === 'ambush')!;
  expect(advanceFrontierEvent(e, 100, 100, true)).toBe(false); expect(e.phase).toBe('idle');
  advanceFrontierEvent(e, 100, 900, false); expect(e.phase).toBe('idle');
  expect(advanceFrontierEvent(e, 100, 100, false)).toBe(false); expect(e.phase).toBe('warning');
  expect(advanceFrontierEvent(e, 1700, 100, false)).toBe(true); expect(e.phase).toBe('active');
  expect(advanceFrontierEvent(e, 1700, 100, false)).toBe(false);
});
it('uses swept projectile intersections and breaks each prop only once', () => {
  const e = frontierEvents('canyon').find(e => e.kind === 'cargo')!;
  expect(hitFrontierProp(e, e.x - 100, e.y - 105, e.x + 100, e.y - 105, 5)).toBe(true);
  expect(hitFrontierProp(e, e.x - 100, e.y - 105, e.x + 100, e.y - 105, 100)).toBe(false);
  expect(segmentNear(0, 0, 0, 0, 100, 0, 20)).toBe(false);
  const barrel = frontierEvents('canyon').find(e => e.kind === 'powder')!;
  expect(hitFrontierProp(barrel, barrel.x, barrel.y - 20, barrel.x, barrel.y - 20, 20)).toBe(false);
  expect(hitFrontierProp(barrel, barrel.x, barrel.y - 20, barrel.x, barrel.y - 20, 20)).toBe(true);
});
