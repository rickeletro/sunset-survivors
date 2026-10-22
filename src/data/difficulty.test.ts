import { describe, expect, it } from 'vitest';
import { DifficultySettings, DIFFICULTY_IDS, enemyHealth, bossHealth, incomingDamage, threatFactor } from './difficulty';
import { ENEMY_DEFS } from './enemies';
import { getBossCombat, bossAttackDamage } from './bossCombat';
import { xpForLevel } from './economy';
import { cumulativeCost, fitReportedRun, reproduceRun, reportedRunCost } from '../../scripts/telemetry-model';

describe('explicit difficulty and active-time threat', () => {
  it('persists a valid choice, defaults safely and survives unavailable storage', () => {
    const values = new Map<string, string>();
    const storage = () => ({ getItem: (k: string) => values.get(k) ?? null, setItem: (k: string, v: string) => { values.set(k, v); } });
    const a = new DifficultySettings(storage); expect(a.get()).toBe('normal'); a.set('hardcore');
    expect(new DifficultySettings(storage).get()).toBe('hardcore'); a.set('erase-save'); expect(a.get()).toBe('normal');
    const offline = new DifficultySettings(() => { throw Error('blocked'); }); offline.set('easy'); expect(offline.get()).toBe('easy');
  });
  it('ramps smoothly, caps the entire spawn HP budget at 7 minutes, and retains mode ordering', () => {
    expect([0, 60, 120, 180, 240, 300, 360, 420].map(t => enemyHealth(ENEMY_DEFS.bandit, t))).toEqual([30, 67, 112, 163, 222, 288, 361, 442]);
    expect(threatFactor(360)).toBeCloseTo(1.72); expect(threatFactor(420)).toBeCloseTo(1.84);
    expect(enemyHealth(ENEMY_DEFS.bandit, 6000)).toBe(442);
    expect(threatFactor(180.1) - threatFactor(180)).toBeCloseTo(0.0002);
    for (const def of Object.values(ENEMY_DEFS)) {
      expect(enemyHealth(def, 360, 'easy')).toBeLessThan(enemyHealth(def, 360, 'normal'));
      expect(enemyHealth(def, 360, 'hardcore')).toBeGreaterThan(enemyHealth(def, 360, 'normal'));
    }
  });
  it('applies mode damage once before the same armor and preserves a learnable Easy mode', () => {
    expect(DIFFICULTY_IDS.map(mode => incomingDamage(12, 3, mode))).toEqual([5, 9, 11]);
    expect(DIFFICULTY_IDS.map(mode => incomingDamage(56, 3, mode))).toEqual([33, 53, 61]);
    expect(incomingDamage(1, 10, 'easy')).toBe(1);
  });
  it('doubles all boss HP/contact budgets once, including both Smith brothers and all ranged/area bases', () => {
    const hp = [22000, 32000, 44000, 28000, 65000, 80000, 100000, 135000];
    const damage = [28, 28, 34, 28, 32, 34, 36, 38];
    for (let stage = 1; stage <= 8; stage++) for (let retry = 0; retry < 4; retry++) {
      const boss = getBossCombat(stage); expect(boss.hp).toBe(hp[stage - 1] * 2); expect(boss.damage).toBe(damage[stage - 1] * 2);
      expect(bossHealth(boss.hp, 'normal')).toBe(boss.hp);
    }
    expect(getBossCombat(4).hp * getBossCombat(4).slugs.length).toBe(112000);
    expect([18, 20, 25, 30].map(bossAttackDamage)).toEqual([36, 40, 50, 60]);
    expect(DIFFICULTY_IDS.map(mode => bossHealth(44000, mode))).toEqual([33000, 44000, 50600]);
  });
});

describe('reported high-throughput playtest regression', () => {
  it('reconstructs the required XP without assuming level carryover or a free starting badge', () => {
    expect(cumulativeCost(27)).toBe(45094); expect(cumulativeCost(36)).toBe(103090);
    const rows = [[1, 360, 27, 21], [2, 403, 36, 25]] as const;
    for (const [stage, seconds, level, revisedLevel] of rows) {
      const before = fitReportedRun(stage, seconds, level);
      expect(before.level).toBe(level); expect(before.badgeRank).toBe(5);
      expect(before.choices.filter(c => c.badgeRank > 0 && [3, 5, 7, 9, 11].includes(c.level))).toHaveLength(5);
      expect(before.choices[0].badgeRank).toBe(0);
      const now = reproduceRun(stage, seconds, before.finalKillsPerSecond, xpForLevel);
      expect(now.kills).toBe(before.kills); expect(now.rawXp).toBe(before.rawXp);
      expect(now.level).toBe(revisedLevel);
      expect(reproduceRun(stage, seconds, before.finalKillsPerSecond, reportedRunCost, false).level).toBeLessThan(level);
    }
  });
  it('preserves the first seven costs and adds a continuous late tail instead of an arbitrary hard cap', () => {
    for (let level = 1; level <= 8; level++) expect(xpForLevel(level)).toBe(reportedRunCost(level));
    expect(xpForLevel(20)).toBe(8013); expect(xpForLevel(20)).toBeGreaterThan(reportedRunCost(20) * 2);
    for (let level = 8; level < 80; level++) expect(xpForLevel(level + 1)).toBeGreaterThan(xpForLevel(level));
  });
});
