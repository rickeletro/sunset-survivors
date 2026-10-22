import { describe, expect, it, vi } from 'vitest';
import { buildingPath, pathLength, samplePath } from './BuildingPath';
import { buildingMotion } from './BuildingMotion';
import { entersFootprint } from './SceneryNavigation';
import { overlapsFootprint } from '../data/scenery';
import { WorldMap } from './WorldMap';
vi.mock('phaser', () => ({ default: {} }));
const box = { x: 4000, y: 4000, halfWidth: 106, halfHeight: 35 };
const clear = (a: {x: number; y: number}, b: {x: number; y: number}) => !entersFootprint({ ...box, halfWidth: 116, halfHeight: 45 }, a, b);

describe('reusable building approaches and presentation', () => {
  it('routes around a facade instead of crossing its footprint, including diagonal corners', () => {
    const from = { x: 4000, y: 3930 }, to = { x: 4020, y: 4047 };
    const path = buildingPath(from, to, clear)!;
    expect(path.length).toBeGreaterThan(2); expect(path.at(-1)).toEqual(to); expect(pathLength(path)).toBeLessThan(640);
    for (let i = 1; i < path.length; i++) expect(clear(path[i - 1], path[i])).toBe(true);
    for (let distance = 0; distance <= pathLength(path); distance += 2) {
      const p = samplePath(path, distance); expect(overlapsFootprint(box, p.x, p.y, 10 - 1e-5)).toBe(false);
    }
    expect(buildingPath(from, to, () => false)).toBeUndefined();
  });
  it('uses swept-circle collision checks for props, not just clear endpoints', () => {
    const world = Object.assign(Object.create(WorldMap.prototype), {
      landmarks: { entrySegmentClear: () => true },
      getChunk: () => [{ x: 180, y: 100, r: 34 }],
    });
    const from = { x: 100, y: 100 }, to = { x: 260, y: 100 };
    expect(world.entrySegmentClear(from, to, 10)).toBe(false);
    const path = world.buildingPath(from, to);
    expect(path).toBeTruthy();
    for (let distance = 0; distance <= pathLength(path); distance += 2) {
      const p = samplePath(path, distance); expect(Math.hypot(p.x - 180, p.y - 100)).toBeGreaterThanOrEqual(44 - 1e-5);
    }
  });
  it('shrinks only the visual double into the door while the physical actor remains outside', () => {
    const path = [{ x: 4000, y: 4100 }, { x: 4020, y: 4047 }], aperture = { x: 4020, y: 3970 };
    const start = buildingMotion(path, aperture, 'enter', 0), middle = buildingMotion(path, aperture, 'enter', start.walkMs + 160);
    expect(start.scale).toBe(1); expect(middle.scale).toBeLessThan(1);
    expect(middle.physical.x).toBe(4020); expect(middle.physical.y).toBe(4047);
    expect(middle.visual.y).toBeLessThan(middle.physical.y);
    const done = buildingMotion(path, aperture, 'enter', start.totalMs);
    expect(done.done).toBe(true); expect(done.alpha).toBe(0);
    const reverse = [...path].reverse(), exit = buildingMotion(reverse, aperture, 'exit', 0);
    expect(exit.alpha).toBe(0); expect(exit.physical.y).toBe(4047);
    const exited = buildingMotion(reverse, aperture, 'exit', exit.totalMs);
    expect(exited.done).toBe(true); expect(exited.alpha).toBe(1); expect(exited.scale).toBe(1);
    expect(exited.physical.x).toBe(4000); expect(exited.physical.y).toBe(4100);
  });
});
