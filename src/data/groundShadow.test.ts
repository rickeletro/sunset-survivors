import { describe, expect, it } from 'vitest';
import { groundShadowGeometry, measureGroundSupport, projectedShadowHull, SUNSET_LIGHT } from './groundShadow';

describe('ground contact and sunset projection', () => {
  it('ignores transparent canvas margins and anchors at the visible soles, with overlap', () => {
    const support = measureGroundSupport(128, 128, (x, y) => x >= 42 && x <= 74 && y >= 20 && y <= 99 ? 255 : 0);
    expect(support).toMatchObject({ x: 58.5, bottom: 100, width: 33, height: 80 });
    const shape = groundShadowGeometry(support, 128, 128, 0.5, 0.5, 0.5, 0.5);
    expect(shape.y).toBe(17.5); // Not the bottom of the 128px canvas (32 world pixels).
    expect(shape.x).toBe(-2.75);
    expect(shape.width).toBe(16.5);
  });
  it('projects opposite the sunset, with a compressed ground plane and finite length', () => {
    const shape = groundShadowGeometry({ x: 96, bottom: 166, width: 120, height: 141 }, 192, 192, 0.5, 1, 1.45, 1.45);
    expect(shape.y).toBeCloseTo(-38.7); // Foundation is above the PNG bottom margin.
    expect(shape.dx * SUNSET_LIGHT.x + shape.dy * SUNSET_LIGHT.y).toBeLessThan(0);
    expect(shape.dx).toBeGreaterThan(shape.dy);
    expect(shape.dy).toBeGreaterThan(0);
    expect(Math.hypot(shape.dx, shape.dy)).toBeLessThanOrEqual(180);
  });
  it('uses the footprint band rather than the hat/roof width and follows flipped frames', () => {
    const support = measureGroundSupport(100, 100, (x, y) =>
      y >= 10 && y < 40 ? 255 : y >= 40 && y <= 90 && x >= 20 && x <= 29 ? 255 : 0);
    expect(support.width).toBe(10);
    const normal = groundShadowGeometry(support, 100, 100, 0.5, 0.5, 1, 1);
    const flipped = groundShadowGeometry(support, 100, 100, 0.5, 0.5, 1, 1, true);
    expect(flipped.x).toBe(-normal.x);
    expect(flipped.dx).toBe(normal.dx); // Flipping the actor cannot flip the sun.
    expect(flipped.y).toBe(normal.y);
  });
  it('keeps only contact indoors and hides fully transparent frames', () => {
    const empty = measureGroundSupport(32, 32, () => 0);
    expect(groundShadowGeometry(empty, 32, 32, 0.5, 1, 1, 1).visible).toBe(false);
    const shape = groundShadowGeometry({ x: 16, bottom: 32, width: 12, height: 28 }, 32, 32, 0.5, 1, 1, 1, false, true);
    expect(shape.dx).toBe(0); expect(shape.dy).toBe(0);
    expect(shape.contactHeight).toBeGreaterThan(0);
  });
});

it('follows diagonal foundation contours rather than placing a horizontal oval below them', () => {
  const support = measureGroundSupport(32, 32, (x, y) => y >= 3 && y <= 20 + Math.floor(x / 4) ? 255 : 0);
  const shape = groundShadowGeometry(support, 32, 32, 0.5, 1, 1, 1);
  expect(shape.base![0].y).toBeLessThan(shape.base!.at(-1)!.y);
  const hull = projectedShadowHull(shape.base!, shape.dx, shape.dy);
  expect(hull.length).toBeGreaterThanOrEqual(4);
  expect(Math.max(...hull.map(p => p.x))).toBeCloseTo(Math.max(...shape.base!.map(p => p.x)) + shape.dx);
});
