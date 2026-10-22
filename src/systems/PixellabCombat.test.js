import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { ENEMY_DEFS } from '../data/enemies';
import bounds from '../assets/enemyFrameBounds.json';
import { framePath } from '../assets/registry';
import { COMBAT_DIRECTIONS, ENEMY_ASSETS, enemyFramePivot, enemySpriteTexture, playEnemyMovement, preloadCombatSprites } from './PixellabCombat';
function fixture() {
    const files = new Map();
    const frames = new Map();
    const animations = new Map();
    const scene = {
        load: { image: (key, path) => { files.set(key, path); frames.set(key, {}); } },
        textures: { exists: (key) => frames.has(key), getFrame: (key) => frames.get(key) },
        anims: { exists: (key) => animations.has(key), create: (config) => animations.set(config.key, config) },
    };
    return { scene: scene, files, frames, animations };
}
describe('detailed enemy presentation', () => {
    it('maps all legacy kinds to loaded detailed art without duplicating assets or animations', () => {
        const { scene, files, frames, animations } = fixture();
        preloadCombatSprites(scene, 1);
        expect(files.size).toBe(96);
        expect(Object.keys(ENEMY_ASSETS).sort()).toEqual(Object.keys(ENEMY_DEFS).sort());
        expect(ENEMY_ASSETS).toMatchObject({ bandit: 'rifle_guard', heavy: 'rifle_guard', elite: 'rifle_guard', snake: 'coyote' });
        for (const kind of Object.keys(ENEMY_DEFS)) {
            const key = enemySpriteTexture(scene, kind);
            expect(key).toBe(`enemy_pl_${ENEMY_ASSETS[kind]}_south_0`);
            expect(frames.get(key)?.customPivot).toBe(true);
            for (const [dx, dy, dir] of [[1, 0, 'east'], [-1, 0, 'west'], [0, 1, 'south'], [0, -1, 'north']]) {
                const sprite = { scene, setFlipX: vi.fn(), play: vi.fn() };
                playEnemyMovement(sprite, kind, dx, dy);
                expect(sprite.play).toHaveBeenCalledWith(`enemy_pl_${ENEMY_ASSETS[kind]}_${dir}`, true);
                expect(sprite.setFlipX).toHaveBeenCalledWith(false);
            }
        }
        expect(animations.size).toBe(24);
        expect([...frames.values()].every(frame => frame.customPivot)).toBe(true);
    });
    it('keeps the measured feet and horizontal silhouette center stable across all 96 frames', () => {
        // Bounds measured from nontransparent pixels of the existing PNGs, not their canvas size.
        for (const asset of new Set(Object.values(ENEMY_ASSETS))) {
            const data = bounds[asset];
            for (const dir of COMBAT_DIRECTIONS)
                for (let i = 0; i < 4; i++) {
                    const { width, height, bounds: b } = data.frames[dir][i];
                    const png = readFileSync(new URL(`../../public/${framePath(`enemy:${asset}`, dir, i)}`, import.meta.url));
                    expect(png.readUInt32BE(16)).toBe(width);
                    expect(png.readUInt32BE(20)).toBe(height);
                    const pivot = enemyFramePivot(asset, dir, i);
                    expect(b[3] - pivot.y * height).toBeCloseTo(data.footOffset);
                    expect((b[0] + b[2]) / 2 - pivot.x * width).toBeCloseTo(0);
                }
        }
    });
});
