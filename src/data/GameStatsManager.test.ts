import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameStatsManager } from './GameStatsManager';
afterEach(() => vi.unstubAllGlobals());
const run = { runId: 'test-run', score: 1300, kills: 20, gold: 30, timeSurvivedSeconds: 420, stage: 1, stagesCleared: 1, level: 12, characterId: 'billy', rank: 'A' as const };
describe('persisted run economy', () => {
  it('starts a fresh account at zero and records a run once even after revisiting its results', () => {
    const storage = new Map();
    vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
    const manager = new GameStatsManager(); expect(manager.getStats().goldCollected).toBe(0);
    manager.recordRun(run, true); manager.recordRun(run, true);
    const reloaded = new GameStatsManager(); reloaded.recordRun(run, true);
    expect(reloaded.getStats()).toMatchObject({ totalScore: 1300, totalKills: 20, goldCollected: 30, playTimeSeconds: 420, stagesCleared: 1, deaths: 0 });
    reloaded.recordRun({ ...run, runId: 'another' }, false);
    expect(reloaded.getStats().goldCollected).toBe(60); expect(reloaded.getStats().deaths).toBe(1);
  });
  it('keeps existing saves compatible and grades ranks by sustained performance', () => {
    const original = { totalScore: 100, totalKills: 10, goldCollected: 5, playTimeSeconds: 60, stagesCleared: 1, deaths: 0, bestStreak: 10, unlockedBosses: [1], unlockedCharacters: ['billy'] };
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify(original), setItem: vi.fn() });
    const manager = new GameStatsManager(); manager.recordRun(run, true);
    expect(manager.getStats().totalScore).toBe(1400);
    expect(manager.calculateRank(50, 420, 1)).toBe('C');
    expect(manager.calculateRank(700, 420, 0.9)).toBe('S');
  });
});
