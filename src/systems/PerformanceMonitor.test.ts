import { describe, expect, it, vi } from 'vitest';
import { PerformanceMonitor } from './PerformanceMonitor';

describe('PerformanceMonitor', () => {
  it('initializes and updates FPS/frametime stats correctly', () => {
    const textObj = { setText: vi.fn() };
    const containerObj = {
      setDepth: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      add: vi.fn(),
      setVisible: vi.fn(),
      destroy: vi.fn(),
    };
    const scene: any = {
      scale: { width: 1920, height: 1080 },
      add: {
        container: vi.fn(() => containerObj),
        graphics: vi.fn(() => ({
          fillStyle: vi.fn().mockReturnThis(),
          fillRoundedRect: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          strokeRoundedRect: vi.fn().mockReturnThis(),
        })),
        text: vi.fn(() => textObj),
      },
      input: {
        keyboard: {
          on: vi.fn(),
          off: vi.fn(),
        },
      },
      events: { once: vi.fn() },
      game: { renderer: {} },
    };

    const monitor = new PerformanceMonitor(scene);
    expect(monitor.isVisible()).toBe(false);

    monitor.toggle();
    expect(monitor.isVisible()).toBe(true);
    expect(containerObj.setVisible).toHaveBeenCalledWith(true);

    // Simulate 30 frames over 500ms
    for (let i = 0; i < 30; i++) {
      monitor.update(16.6, { enemies: 50, projectiles: 20, particles: 15 });
    }

    expect(textObj.setText).toHaveBeenCalled();
    const calls = textObj.setText.mock.calls;
    const lastCall = calls[calls.length - 1][0];
    expect(lastCall.some((line: string) => line.includes('FPS'))).toBe(true);
    expect(lastCall.some((line: string) => line.includes('ENEMIES: 50 | PROJ: 20'))).toBe(true);
  });
});
