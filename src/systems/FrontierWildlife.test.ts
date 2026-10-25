import { describe, expect, it, vi } from 'vitest';
import { FrontierWildlife } from './FrontierWildlife';
import { stageChickens } from '../data/frontierWildlife';

function fixture() {
  const objects: any[] = [];
  let shutdown = () => {};
  const scene: any = { events: { once: (_: string, callback: () => void) => { shutdown = callback; } },
    add: { image: (x: number, y: number) => {
      const image: any = { x, y, destroy: vi.fn() };
      for (const name of ['setOrigin', 'setPosition', 'setTexture', 'setDepth', 'setFlipX', 'setAngle']) image[name] = vi.fn(() => image);
      objects.push(image); return image;
    } } };
  return { wildlife: new FrontierWildlife(scene, 'canyon'), objects, shutdown: () => shutdown() };
}
const clear = (x: number, y: number) => ({ x, y });
describe('streamed wildlife lifecycle', () => {
  it('streams actors, preserves cooked food offscreen, pays once and disposes every image', () => {
    const { wildlife, objects, shutdown } = fixture(), bird = stageChickens('canyon')[0];
    wildlife.hit(bird.x - 200, bird.y, bird.x + 200, bird.y);
    expect(wildlife.update(16, bird.x, bird.y, 100, 100, clear)).toBe(0);
    expect(objects.length).toBeLessThanOrEqual(9);
    expect(objects[0].setTexture).toHaveBeenLastCalledWith('stage_roast');
    wildlife.update(16, 7800, 7800, 50, 100, clear);
    expect(objects.every(image => image.destroy.mock.calls.length === 1)).toBe(true);
    expect(wildlife.update(16, bird.x, bird.y, 95, 100, clear)).toBe(5);
    expect(wildlife.update(16, bird.x, bird.y, 50, 100, clear)).toBe(0);
    shutdown();
    expect(objects.every(image => image.destroy.mock.calls.length === 1)).toBe(true);
  });
});
