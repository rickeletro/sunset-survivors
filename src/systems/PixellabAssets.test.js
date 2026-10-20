import { existsSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { createPixellabAnims, pickDirection, preloadPixellabHeroes } from './PixellabHeroes';
import { createGreedwellAnims, preloadGreedwell } from './GreedwellSprites';

vi.mock('phaser', () => ({ default: {} }));

function captureAssets(preload) {
  const images = new Map();
  const animations = [];
  const scene = {
    load: { image: (key, path) => images.set(key, path) },
    anims: {
      exists: () => false,
      create: (animation) => animations.push(animation),
    },
  };
  preload(scene);
  return { scene, images, animations };
}

function expectAssetsExist(images, root) {
  for (const [key, path] of images) {
    expect(path, key).toMatch(new RegExp(`^assets/${root}/pixellab/`));
    expect(existsSync(new URL(`../../public/${path}`, import.meta.url)), path).toBe(true);
  }
}

describe('Pixellab asset migration', () => {
  it('loads every existing hero frame from the character folders with unchanged texture keys', () => {
    const { scene, images, animations } = captureAssets(preloadPixellabHeroes);
    expect(images.size).toBe(80);
    expectAssetsExist(images, 'characters');
    for (const hero of ['steve', 'bob', 'cormano', 'billy']) createPixellabAnims(scene, hero);
    expect(animations).toHaveLength(20);
    for (const animation of animations) {
      expect(animation.frameRate).toBe(8);
      expect(animation.repeat).toBe(-1);
      const frames = animation.frames;
      expect(frames).toHaveLength(4);
      for (const frame of frames) expect(images.has(frame.key)).toBe(true);
    }
    expect(pickDirection('billy', -1, -1)).toEqual({ dir: 'north-west', flipX: false });
    expect(pickDirection('billy', -1, 1)).toEqual({ dir: 'south-west', flipX: false });
    expect(pickDirection('steve', -1, 1)).toEqual({ dir: 'south-east', flipX: true });
    expect(pickDirection('bob', 0, -1)).toEqual({ dir: 'north', flipX: false });
    expect(pickDirection('cormano', 0, -1)).toEqual({ dir: 'south', flipX: false });
  });

  it('loads Simon from the boss folder without changing combat animation timing', () => {
    const { scene, images, animations } = captureAssets(preloadGreedwell);
    expect(images.size).toBe(28);
    expectAssetsExist(images, 'bosses');
    createGreedwellAnims(scene);
    expect(animations.map(({ key, frameRate, repeat, frames }) => ({
      key, frameRate, repeat, count: frames.length,
    }))).toEqual([
      { key: 'pl_greedwell_run_east', frameRate: 10, repeat: -1, count: 6 },
      { key: 'pl_greedwell_run_west', frameRate: 10, repeat: -1, count: 6 },
      { key: 'pl_greedwell_shoot', frameRate: 14, repeat: 0, count: 9 },
      { key: 'pl_greedwell_death', frameRate: 9, repeat: 0, count: 7 },
    ]);
    for (const animation of animations) {
      for (const frame of animation.frames) {
        expect(images.has(frame.key)).toBe(true);
      }
    }
  });
});

// Verify the exact files requested by all eight stage loaders, without a browser.
import { preloadCombatSprites, combatDirection, bossDirection } from './PixellabCombat';

describe('campaign combat sprite files', () => {
  it('resolves all six four-direction enemies and every stage-specific boss frame', () => {
    const allFiles = new Set();
    for (let stage = 1; stage <= 8; stage++) {
      const images = new Map();
      const scene = { textures: { exists: () => false }, load: { image: (key, path) => images.set(key, path) } };
      preloadCombatSprites(scene, stage);
      const bossFrames = stage === 1 ? 0 : stage === 4 ? 128 : 64;
      expect(images.size).toBe(96 + bossFrames);
      for (const path of images.values()) {
        expect(existsSync(new URL(`../../public/${path}`, import.meta.url)), path).toBe(true);
        allFiles.add(path);
      }
    }
    expect(allFiles.size).toBe(96 + 512);
  });
  it('selects screen directions correctly for enemies and mounted bosses', () => {
    expect(combatDirection(1, 0)).toBe('east');
    expect(combatDirection(-1, 0)).toBe('west');
    expect(combatDirection(0, -1)).toBe('north');
    expect(combatDirection(0, 1)).toBe('south');
    expect(bossDirection(-1, -1)).toBe('north-west');
    expect(bossDirection(1, 1)).toBe('south-east');
  });
});
