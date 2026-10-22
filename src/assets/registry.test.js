import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CATALOG, framePath, preloadImages } from './registry';

describe('single runtime asset catalog', () => {
  it('resolves all images, sheets and animated frames to existing public files', () => {
    const paths = new Set([...Object.values(CATALOG.images), ...Object.values(CATALOG.sheets).map(s => s.path)]);
    for (const [key, sequence] of Object.entries(CATALOG.sequences)) {
      for (const direction of sequence.directions) for (let i = 0; i < sequence.frames; i++) paths.add(framePath(key, direction, i));
    }
    expect(paths.size).toBe(801);
    for (const path of paths) expect(existsSync(new URL(`../../public/${path}`, import.meta.url)), path).toBe(true);
  });
  it('skips cached textures and fails clearly for a key absent from the catalog', () => {
    const loaded = [];
    const scene = { textures: { exists: key => key === 'intro_bkg' }, load: { image: (key, path) => loaded.push({ key, path }) } };
    preloadImages(scene, ['intro_bkg', 'intro_logo_new']);
    expect(loaded).toEqual([{ key: 'intro_logo_new', path: CATALOG.images.intro_logo_new }]);
    expect(() => preloadImages(scene, ['unregistered'])).toThrow('Unknown asset key');
  });
});
