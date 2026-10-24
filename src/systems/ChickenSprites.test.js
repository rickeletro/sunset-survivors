import { expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { chickenFrame, preloadChickens, CHICKEN_DIRECTIONS } from './ChickenSprites';
import { CATALOG, framePath } from '../assets/registry';
it('preloads exactly 72 original PixelLab walking frames and no wildlife inside', () => {
  const scene = { textures: { exists: () => false }, load: { image: vi.fn() } };
  preloadChickens(scene, 'canyon');
  expect(scene.load.image).toHaveBeenCalledTimes(72);
  for (const [key, path] of scene.load.image.mock.calls) {
    expect(key).toMatch(/^chicken_walk_/);
    const bytes = readFileSync(`public/${path}`);
    expect(bytes.readUInt32BE(16)).toBe(32); expect(bytes.readUInt32BE(20)).toBe(32);
  }
  scene.load.image.mockClear(); preloadChickens(scene, 'saloon'); expect(scene.load.image).not.toHaveBeenCalled();
  expect(CATALOG.sequences['wildlife:chicken-walk'].frames).toBe(9);
  expect(framePath('wildlife:chicken-walk', 'south', 0)).toContain('pixellab/chicken/walk/south/frame_000.png');
});
it('uses true directional frames and loops the imported animation without mirroring', () => {
  for (const [i, dir] of CHICKEN_DIRECTIONS.entries()) {
    const angle = i * Math.PI / 4;
    expect(chickenFrame(Math.cos(angle), Math.sin(angle), 0, 0)).toBe(`chicken_walk_${dir}_0`);
  }
  expect(chickenFrame(1, 0, 125, 0)).toBe('chicken_walk_east_1');
  expect(chickenFrame(1, 0, 1125, 0)).toBe('chicken_walk_east_0');
});
