import { describe, expect, it } from 'vitest';
import { STAGES } from './stages';
import { footprint, overlapsFootprint, resolveFootprint, stageLandmarks, sceneryForStage, SCENERY } from './scenery';

describe('walkable western settlements', () => {
  it.each(STAGES)('keeps spawn, cross streets and all landmarks inside the world in stage $id', stage => {
    const landmarks = stageLandmarks(stage.theme);
    expect(landmarks.length).toBeGreaterThanOrEqual(20);
    expect(stageLandmarks(stage.theme)).toEqual(landmarks);
    for (const prop of landmarks) {
      expect(prop.x).toBeGreaterThan(300);
      expect(prop.x).toBeLessThan(7700);
      expect(prop.y).toBeGreaterThan(300);
      expect(prop.y).toBeLessThan(7700);
      expect(overlapsFootprint(footprint(prop), 4000, 4000, 260)).toBe(false);
    }
    // A continuous east-west escape street through the initial encounter area.
    for (let x = 1600; x <= 6400; x += 20) {
      expect(landmarks.some(p => overlapsFootprint(footprint(p), x, 4000, 28))).toBe(false);
    }
    for (let i = 0; i < landmarks.length; i++) for (let j = i + 1; j < landmarks.length; j++) {
      const a = footprint(landmarks[i]), b = footprint(landmarks[j]);
      expect(Math.abs(a.x - b.x) >= a.halfWidth + b.halfWidth + 56 || Math.abs(a.y - b.y) >= a.halfHeight + b.halfHeight + 56).toBe(true);
    }
  });
  it.each(['railroad', 'caboose'] as const)('keeps the entire active train corridor clear in %s', theme => {
    for (const prop of stageLandmarks(theme)) {
      const box = footprint(prop);
      const railY = 4000 + Math.round((box.y - 4000) / 640) * 640;
      expect(Math.abs(box.y - railY) - box.halfHeight).toBeGreaterThan(90);
    }
  });
  it('preloads exactly the props placed in each theme and uses every created asset', () => {
    const used = new Set();
    for (const stage of STAGES) {
      const kinds = new Set(stageLandmarks(stage.theme).map(p => p.kind));
      expect(new Set(sceneryForStage(stage.theme))).toEqual(kinds);
      for (const kind of kinds) used.add(kind);
    }
    expect(used).toEqual(new Set(Object.keys(SCENERY)));
  });
  it('pushes circle centers, sides and corners out of a rectangular footprint', () => {
    const box = { x: 0, y: 0, halfWidth: 100, halfHeight: 35 };
    for (const [x, y] of [[0, 0], [100, 0], [-102, 0], [0, -37], [103, 38], [101, 36]]) {
      const p = resolveFootprint(box, x, y, 12);
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      expect(overlapsFootprint(box, p.x, p.y, 12 - 0.0001)).toBe(false);
    }
    expect(resolveFootprint(box, 400, 400, 12)).toEqual({ x: 400, y: 400 });
  });
});
