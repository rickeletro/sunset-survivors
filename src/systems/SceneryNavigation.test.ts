import { describe, expect, it } from 'vitest';
import { entersFootprint, sceneryChaseTarget } from './SceneryNavigation';
import { overlapsFootprint, resolveFootprint } from '../data/scenery';

const box = { x: 4000, y: 4000, halfWidth: 106, halfHeight: 40 };
describe('enemy navigation around buildings', () => {
  it('retains a direct chase when the street is clear', () => {
    const target = { x: 4200, y: 4200 };
    expect(sceneryChaseTarget([box], { x: 3800, y: 4200 }, target, 14)).toBe(target);
    expect(entersFootprint(box, { x: 3800, y: 3960 }, { x: 4200, y: 3960 })).toBe(false);
  });
  it.each([[3800, 4000, 4200, 4000], [4200, 4000, 3800, 4000], [4000, 3800, 4000, 4200], [4000, 4200, 4000, 3800], [3880, 4000, 4200, 4000]])('routes from (%i,%i) to (%i,%i) without getting stuck against a facade', (x, y, tx, ty) => {
    let position = { x, y };
    const target = { x: tx, y: ty };
    let ticks = 0;
    let direction = { x: 0, y: 0 };
    while (Math.hypot(position.x - tx, position.y - ty) > 4 && ticks++ < 600) {
      if (ticks % 6 === 1) {
        const next = sceneryChaseTarget([box], position, target, 14);
        const dx = next.x - position.x, dy = next.y - position.y, distance = Math.hypot(dx, dy) || 1;
        direction = { x: dx / distance, y: dy / distance };
      }
      position = resolveFootprint(box, position.x + direction.x * 3, position.y + direction.y * 3, 14);
      expect(overlapsFootprint(box, position.x, position.y, 13.99)).toBe(false);
    }
    expect(ticks).toBeLessThan(600);
    expect(Math.hypot(position.x - tx, position.y - ty)).toBeLessThanOrEqual(4);
  });
});
