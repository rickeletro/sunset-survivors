import { describe, expect, it, vi } from 'vitest';
import { FirstRunTutorial, TutorialProgress } from './FirstRunTutorial';

describe('first gunslinger steps', () => {
  it('waits for actual movement, then actual fire, then lets the player read the confirmation', () => {
    const remember = vi.fn(), tutorial = new FirstRunTutorial(false, 'keyboard', remember);
    tutorial.tick(60000, 0);
    expect(tutorial.phase).toBe('move'); expect(tutorial.blocking).toBe(true);
    tutorial.tick(100, 55); expect(tutorial.phase).toBe('move');
    tutorial.tick(100, 1); expect(tutorial.phase).toBe('shoot');
    tutorial.tick(10000); expect(tutorial.blocking).toBe(true);
    tutorial.fired(); tutorial.tick(2199); expect(tutorial.phase).toBe('shoot');
    tutorial.tick(1); expect(tutorial.phase).toBe('ready'); expect(tutorial.blocking).toBe(false);
    expect(remember).toHaveBeenCalledTimes(1);
    tutorial.tick(3000); expect(tutorial.visible).toBe(false);
  });
  it('allows skipping from either learning step, remembers it once, and preserves the XP hint', () => {
    for (const distance of [0, 56]) {
      const remember = vi.fn(), tutorial = new FirstRunTutorial(false, 'keyboard', remember);
      tutorial.tick(16, distance); tutorial.skip(); tutorial.skip();
      expect(tutorial.blocking).toBe(false); expect(remember).toHaveBeenCalledTimes(1);
      tutorial.collectedXp(); expect(tutorial.phase).toBe('loot');
      tutorial.tick(5000); expect(tutorial.visible).toBe(false);
      tutorial.collectedXp(); expect(tutorial.visible).toBe(false);
    }
  });
  it('gives returning players a short nonblocking reminder and no repeated XP lesson', () => {
    const remember = vi.fn(), tutorial = new FirstRunTutorial(true, 'touch', remember);
    expect(tutorial.blocking).toBe(false); expect(tutorial.copy.body).toContain('Drag');
    tutorial.tick(4500); tutorial.collectedXp();
    expect(tutorial.visible).toBe(false); expect(remember).not.toHaveBeenCalled();
  });
  it('changes hints for hybrid devices and ignores XP while practice is active', () => {
    const tutorial = new FirstRunTutorial(false, 'keyboard', vi.fn());
    expect(tutorial.copy.body).toContain('WASD');
    tutorial.setInput('touch'); expect(tutorial.copy.body).toContain('finger');
    tutorial.collectedXp(); expect(tutorial.phase).toBe('move');
    tutorial.setInput('keyboard'); expect(tutorial.copy.body).toContain('WASD');
    tutorial.tick(NaN, NaN); tutorial.tick(-50, -100); expect(tutorial.phase).toBe('move');
  });
  it('persists only its own completion preference and survives blocked storage', () => {
    const values = new Map([['sunset_survivors_stats_v1', 'existing stats']]);
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(new TutorialProgress(() => storage).hasCompleted()).toBe(false);
    new TutorialProgress(() => storage).complete();
    expect(new TutorialProgress(() => storage).hasCompleted()).toBe(true);
    expect(values.get('sunset_survivors_stats_v1')).toBe('existing stats');
    const blocked = new TutorialProgress(() => { throw new Error('Storage disabled'); });
    expect(blocked.hasCompleted()).toBe(false);
    blocked.complete(); expect(blocked.hasCompleted()).toBe(true);
  });
});
