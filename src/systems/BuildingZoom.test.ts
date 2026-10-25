import { expect, it } from 'vitest';
import { buildingZoom } from './BuildingMotion';
it('makes doorway zoom perceptible but bounded and restores the original lens', () => {
  expect(buildingZoom(0, 1000)).toBe(1);
  expect(buildingZoom(500, 1000)).toBeCloseTo(1.10);
  expect(buildingZoom(1000, 1000)).toBeCloseTo(1);
  expect(buildingZoom(10000, 1000)).toBeCloseTo(1);
  expect(buildingZoom(-100, 1000)).toBe(1);
});
