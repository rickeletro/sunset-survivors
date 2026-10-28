import { describe, expect, it, vi } from 'vitest';
import { CrowRush } from './CrowRush';

function scene() {
  const graphics = { setDepth: vi.fn().mockReturnThis(), clear: vi.fn().mockReturnThis(), fillStyle: vi.fn().mockReturnThis(), fillTriangle: vi.fn().mockReturnThis(), fillRect: vi.fn().mockReturnThis(), destroy: vi.fn() };
  return { add: { graphics: vi.fn(() => graphics) }, events: { once: vi.fn() }, graphics };
}

describe('CrowRush', () => {
  it('uses one bounded drawing surface and pulls only inside the flying flock corridor', () => {
    const s = scene(), banner = vi.fn(), rush = new CrowRush(s as never, banner, () => 0.9);
    expect(rush.update(0, 184999, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(rush.update(0, 185000, { x: 100, y: 100 }, false)).toBeUndefined();
    expect(rush.update(1500, 186500, { x: 100, y: 212 }, false)).toEqual({ x: 172.5, y: 0 });
    expect(banner).toHaveBeenCalledWith('CROW RUSH — BREAK FREE FROM THE FLOCK!');
    expect(s.add.graphics).toHaveBeenCalledOnce();
    expect(rush.update(100, 186600, { x: 100, y: 500 }, false)).toBeUndefined();
  });
  it('does not start or pull while combat is blocked', () => {
    const rush = new CrowRush(scene() as never, vi.fn(), () => 0);
    expect(rush.update(100, 200000, { x: 0, y: 0 }, true)).toBeUndefined();
  });
});
