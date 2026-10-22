import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} } } }));

const cases = [
  [['W', 'D'], 1, -1, 'north', false], [['W', 'A'], -1, -1, 'north', false],
  [['W'], 0, -1, 'north', false], [['S'], 0, 1, 'south', false],
  [['A'], -1, 0, 'west', false], [['D'], 1, 0, 'east', false],
  [['S', 'D'], 1, 1, 'south', false], [['S', 'A'], -1, 1, 'south', true],
];

describe('Cormano keyboard movement with four real views', () => {
  it.each(cases)('%j selects the nearest real view and retains speed and collision radius', (keys, dx, dy, dir, flip) => {
    const game = Object.create(GameScene.prototype);
    const sprite = { x: 0, y: 0, anims: { isPlaying: false }, play: vi.fn(), stop: vi.fn(),
      setFlipX: vi.fn(), setTexture: vi.fn() };
    Object.assign(game, { player: sprite, character: { id: 'cormano' }, usePixellab: true,
      moveSpeed: 180, keysWASD: Object.fromEntries(['W', 'A', 'S', 'D'].map(key => [key, { isDown: keys.includes(key) }])),
      worldMap: { resolve: vi.fn((x, y) => ({ x, y })) } });
    game.handlePlayerMovement(100);
    const length = Math.hypot(dx, dy);
    expect(sprite.x).toBeCloseTo(dx / length * 18);
    expect(sprite.y).toBeCloseTo(dy / length * 18);
    expect(sprite.play).toHaveBeenCalledWith(`pl_cormano_${dir}_walk`);
    expect(sprite.setFlipX).toHaveBeenCalledWith(flip);
    expect(game.worldMap.resolve).toHaveBeenCalledWith(sprite.x, sprite.y, 10);
    // Idle preserves the selected view and its horizontal mirroring.
    sprite.anims.isPlaying = true;
    for (const key of Object.values(game.keysWASD)) key.isDown = false;
    game.handlePlayerMovement(100);
    expect(sprite.setTexture).toHaveBeenCalledWith(`pl_cormano_${dir}_0`);
    expect(sprite.setFlipX).toHaveBeenCalledTimes(1);
  });
});
