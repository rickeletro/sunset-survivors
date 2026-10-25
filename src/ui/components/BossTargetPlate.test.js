import { createRequire } from 'node:module';
import { expect, it, vi } from 'vitest';
import { prepareGalleryPortrait, galleryPortraitCrop, GALLERY_PORTRAIT_FRAME } from './BossTargetPlate';
vi.mock('../layout/pulpSceneKit', () => ({ pulpText: vi.fn() }));
it('creates boss portrait frames without changing the shared poster default or adding duplicates', () => {
  const Texture = createRequire(import.meta.url)('phaser/src/textures/Texture.js');
  const texture = Object.assign(Object.create(Texture.prototype), {
    source: [{ width: 377, height: 503, resolution: 1, image: { width: 377, height: 503 } }], frames: {}, firstFrame: '__BASE', frameTotal: 0,
  });
  texture.add('__BASE', 0, 0, 0, 377, 503); const first = texture.firstFrame;
  prepareGalleryPortrait(texture); prepareGalleryPortrait(texture);
  expect(texture.firstFrame).toBe(first);
  expect(texture.get(GALLERY_PORTRAIT_FRAME).cutWidth).toBe(Math.floor(377 * .89));
  expect(Object.keys(texture.frames).filter(k => k === GALLERY_PORTRAIT_FRAME)).toHaveLength(1);
});
it('keeps the existing boss art crop inside each source image', () => {
  for (const [width, height] of [[377, 503], [373, 493], [1024, 1536]]) {
    const c = galleryPortraitCrop(width, height); expect(c.x + c.width).toBeLessThanOrEqual(width); expect(c.y + c.height).toBeLessThanOrEqual(height);
    expect(c.width).toBeGreaterThan(0); expect(c.height).toBeGreaterThan(0);
  }
});
