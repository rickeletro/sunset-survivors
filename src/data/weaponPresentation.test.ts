import { describe, expect, it } from 'vitest';
import { bulletAppearance, distanceToRope, molotovFootprint, whipPoints } from './weaponPresentation';

describe('readable weapon upgrades', () => {
  it.each(['revolver', 'peacemaker', 'shotgun', 'rifle'])('%s changes silhouette and palette on all five ranks', weapon => {
    const profiles = [1, 2, 3, 4, 5].map(level => bulletAppearance(weapon, level));
    expect(new Set(profiles.map(profile => JSON.stringify(profile))).size).toBe(5);
    expect(profiles[4].length).toBeGreaterThan(profiles[0].length);
    expect(profiles[4].trail).toBeGreaterThan(profiles[0].trail);
  });
  it('keeps the whip directional and hits its rope, not an unrelated circular aura', () => {
    const right = whipPoints(0, 0, 1, 0.5, 150), left = whipPoints(0, 0, -1, 0.5, 150);
    expect(right.at(-1)!.x).toBeCloseTo(150); expect(left.at(-1)!.x).toBeCloseTo(-150);
    expect(distanceToRope(100, 0, right)).toBeLessThan(25);
    expect(distanceToRope(-100, 0, right)).toBeGreaterThan(90);
    expect(distanceToRope(60, 100, right)).toBeGreaterThan(70);
    expect(whipPoints(0, 0, 1, 0, 150).every(point => point.x === 0)).toBe(true);
  });
  it('increases actual fire duration and area with upgrades', () => {
    expect(molotovFootprint(5, 1).life).toBeGreaterThan(molotovFootprint(1, 1).life);
    expect(molotovFootprint(5, 1).radius).toBeGreaterThan(molotovFootprint(1, 1).radius);
    expect(molotovFootprint(2, 2).radius).toBe(molotovFootprint(2, 1).radius * 2);
    expect(bulletAppearance('golden_repeater', 1).tier).toBe(6);
  });
});
