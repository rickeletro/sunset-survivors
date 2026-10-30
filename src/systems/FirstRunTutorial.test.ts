import { describe, expect, it, vi } from 'vitest';
import { FirstRunTutorial, TutorialProgress } from './FirstRunTutorial';

describe('stage 1 movement instruction', () => {
  it('waits for actual player movement, then finishes and remembers completion', () => {
    const remember = vi.fn();
    const tutorial = new FirstRunTutorial(false, 'keyboard', remember);
    expect(tutorial.phase).toBe('move');
    expect(tutorial.blocking).toBe(true);
    expect(tutorial.visible).toBe(true);

    tutorial.tick(100, 2);
    expect(tutorial.phase).toBe('move');
    expect(tutorial.blocking).toBe(true);

    tutorial.tick(100, 2); // total distance 4
    expect(tutorial.phase).toBe('idle');
    expect(tutorial.blocking).toBe(false);
    expect(tutorial.visible).toBe(false);
    expect(remember).toHaveBeenCalledTimes(1);
  });

  it('closes automatically after 6 seconds if player remains stationary', () => {
    const remember = vi.fn();
    const tutorial = new FirstRunTutorial(false, 'keyboard', remember);
    tutorial.tick(5999, 0);
    expect(tutorial.phase).toBe('move');
    expect(tutorial.blocking).toBe(true);

    tutorial.tick(1, 0);
    expect(tutorial.phase).toBe('idle');
    expect(tutorial.blocking).toBe(false);
    expect(remember).toHaveBeenCalledTimes(1);
  });

  it('allows skipping immediately and remembers completion once', () => {
    const remember = vi.fn();
    const tutorial = new FirstRunTutorial(false, 'keyboard', remember);
    tutorial.skip();
    tutorial.skip();
    expect(tutorial.blocking).toBe(false);
    expect(tutorial.visible).toBe(false);
    expect(remember).toHaveBeenCalledTimes(1);
  });

  it('initializes nonblocking and invisible when already completed', () => {
    const remember = vi.fn();
    const tutorial = new FirstRunTutorial(true, 'touch', remember);
    expect(tutorial.blocking).toBe(false);
    expect(tutorial.visible).toBe(false);
    tutorial.skip();
    expect(remember).not.toHaveBeenCalled();
  });

  it('changes copy for keyboard and touch devices and ignores invalid movement input', () => {
    const tutorial = new FirstRunTutorial(false, 'keyboard', vi.fn());
    expect(tutorial.copy.body).toContain('W, A, S, D');
    tutorial.setInput('touch');
    expect(tutorial.copy.body).toContain('DRAG');
    tutorial.setInput('keyboard');
    expect(tutorial.copy.body).toContain('W, A, S, D');
    tutorial.tick(NaN, NaN);
    tutorial.tick(-50, -100);
    expect(tutorial.phase).toBe('move');
  });

  it('persists only its own completion preference and survives blocked storage', () => {
    const values = new Map([['sunset_survivors_stats_v1', 'existing stats']]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
    };
    expect(new TutorialProgress(() => storage).hasCompleted()).toBe(false);
    new TutorialProgress(() => storage).complete();
    expect(new TutorialProgress(() => storage).hasCompleted()).toBe(true);
    expect(values.get('sunset_survivors_stats_v1')).toBe('existing stats');

    const blocked = new TutorialProgress(() => { throw new Error('Storage disabled'); });
    expect(blocked.hasCompleted()).toBe(false);
    blocked.complete();
    expect(blocked.hasCompleted()).toBe(true);
  });
});
