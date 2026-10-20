import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { createMenuRoot, menuTransform } from './menuLayout';

describe('shared menu layout lifecycle', () => {
  it.each([[1536, 1024, 1], [768, 512, 0.5], [3072, 2048, 2], [1920, 1080, 1080 / 1024]])('fits %i×%i without stretching', (width, height, scale) => {
    expect(menuTransform(width, height)).toEqual({ x: width / 2, y: height / 2, scale });
  });
  it('never produces invalid scale when a viewport is temporarily zero-sized', () => {
    expect(menuTransform(0, 0).scale).toBeGreaterThan(0);
    expect(Number.isFinite(menuTransform(0, 1024).scale)).toBe(true);
  });
  it('unsubscribes resize on shutdown and never accumulates listeners across menu visits', () => {
    const scale = Object.assign(new EventEmitter(), { width: 1536, height: 1024 });
    const events = new EventEmitter();
    const root = { setPosition: vi.fn(() => root), setScale: vi.fn(() => root) };
    const scene = { scale, events, add: { container: () => root } };
    for (let visit = 0; visit < 10; visit++) {
      createMenuRoot(scene);
      expect(scale.listenerCount('resize')).toBe(1);
      scale.width = 768; scale.height = 512; scale.emit('resize');
      expect(root.setPosition).toHaveBeenLastCalledWith(384, 256);
      expect(root.setScale).toHaveBeenLastCalledWith(0.5);
      events.emit('shutdown');
      expect(scale.listenerCount('resize')).toBe(0);
      expect(events.listenerCount('shutdown')).toBe(0);
    }
  });
});
