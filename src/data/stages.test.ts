import { describe, expect, it } from 'vitest';
import { getStage, isBossDue, objectiveProgress, pressureMultiplier, safeEventPoint, STAGES, stagePhase } from './stages';
import { BOSS_COMBAT, bossRageMultiplier, getBossCombat, remainingBossHp } from './bossCombat';
import { ENEMY_DEFS } from './enemies';

describe('eight-stage survival campaign', () => {
  it('gives each stage a unique theme, hazard and boss, with bosses arriving at seven minutes', () => {
    expect(STAGES.map(s => s.duration)).toEqual(Array(8).fill(420));
    expect(new Set(STAGES.map(s => s.theme)).size).toBe(8);
    expect(new Set(STAGES.map(s => s.hazard)).size).toBe(8);
    expect(new Set(BOSS_COMBAT.flatMap(b => b.slugs)).size).toBe(9);
    for (const s of STAGES) {
      expect(isBossDue(s, 90)).toBe(false);
      expect(isBossDue(s, s.duration - 1)).toBe(false);
      expect(isBossDue(s, s.duration)).toBe(true);
      expect(s.enemies[s.signature]).toBeGreaterThan(0);
      for (const key of Object.keys(s.enemies)) expect(ENEMY_DEFS).toHaveProperty(key);
      expect(getBossCombat(s.id).stage).toBe(s.id);
    }
  });
  it('alternates horde pressure and respite before the final stand', () => {
    const stage = getStage(1);
    expect(stagePhase(stage, 10)).toBe('arrival');
    expect(stagePhase(stage, 80)).toBe('pressure');
    expect(stagePhase(stage, 120)).toBe('surge');
    expect(stagePhase(stage, 150)).toBe('respite');
    expect(pressureMultiplier('respite')).toBeLessThan(pressureMultiplier('pressure'));
    expect(stagePhase(stage, 360)).toBe('last-stand');
    expect(stagePhase(stage, 420)).toBe('boss');
  });
  it('holds supply progress inside, decays outside, and never overflows or goes negative', () => {
    expect(objectiveProgress(7, true, 2)).toBe(8);
    expect(objectiveProgress(2, false, 2)).toBe(1);
    expect(objectiveProgress(0, false, 20)).toBe(0);
    expect(objectiveProgress(3, true, 0)).toBe(3);
  });
  it('keeps optional objectives reachable inside the world even near its edges', () => {
    for (const p of [[48, 48], [7952, 7952], [4000, 4000]]) {
      const point = safeEventPoint(p[0], p[1], 4);
      expect(point.x).toBeGreaterThanOrEqual(200); expect(point.x).toBeLessThanOrEqual(7800);
      expect(point.y).toBeGreaterThanOrEqual(200); expect(point.y).toBeLessThanOrEqual(7800);
    }
  });
  it('requires both Smith brothers and raises boss HP while preserving their attacks', () => {
    expect(getBossCombat(1)).toMatchObject({ hp: 22000, speed: 105, damage: 28, cooldown: 1800 });
    expect(getBossCombat(4).slugs).toHaveLength(2);
    const brothers = [{ hp: -20, maxHp: 4000, dead: true }, { hp: 2000, maxHp: 4000 }];
    expect(remainingBossHp(brothers)).toEqual({ hp: 2000, maxHp: 8000 });
    brothers[1].hp = 0;
    expect(remainingBossHp(brothers).hp).toBe(0);
    expect(bossRageMultiplier(401, 1000)).toBe(1);
    expect(bossRageMultiplier(400, 1000)).toBe(0.72);
  });
});
