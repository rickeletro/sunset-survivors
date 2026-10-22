import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playExplosion: vi.fn() } }));

function fixture() {
  const g = Object.create(GameScene.prototype);
  Object.assign(g, { fireWeapon: vi.fn(), activeWeapons: new Map([['revolver', 5]]), weaponTimers: new Map([['revolver', 0]]),
    fireRateMultiplier: 1.25 / 0.52 });
  return g;
}
describe('combat arithmetic audit', () => {
  it.each([16, 160])('preserves volley rate and remainder at %s ms frames', step => {
    const g = fixture();
    for (let t = 0; t < 9600; t += step) g.handleWeaponsAutoFire(step);
    const cooldown = 380 / g.fireRateMultiplier;
    expect(g.fireWeapon).toHaveBeenCalledTimes(Math.floor(9600 / cooldown));
    expect(g.weaponTimers.get('revolver')).toBeCloseTo(9600 % cooldown);
  });
  it('does not release an unbounded catch-up burst after an extreme frame stall', () => {
    const g = fixture(); g.handleWeaponsAutoFire(10000);
    expect(g.fireWeapon).toHaveBeenCalledTimes(4);
    expect(g.weaponTimers.get('revolver')).toBeLessThan(380 / g.fireRateMultiplier);
  });
  it.each([1, 1.2, 1.4])('applies the character damage multiplier once to TNT and explosive bullet residue (%s)', multiplier => {
    const g = fixture(), graphic = {};
    for (const method of ['setDepth', 'fillStyle', 'fillCircle']) graphic[method] = () => graphic;
    Object.assign(g, { damageMultiplier: multiplier, areaMultiplier: 1,
      cameras: { main: { shake: vi.fn() } }, add: { graphics: () => graphic }, tweens: { add: vi.fn() },
      enemies: [{ sprite: { x: 0, y: 0 } }], damageEnemy: vi.fn() });
    g.explodeDynamite(0, 0, 70);
    expect(g.damageEnemy).toHaveBeenLastCalledWith(g.enemies[0], Math.round(70 * multiplier));
    const residue = Math.round(Math.round(85 * multiplier) * 0.5);
    g.explodeDynamite(0, 0, residue, false, true);
    expect(g.damageEnemy).toHaveBeenLastCalledWith(g.enemies[0], residue);
  });
});

it('preserves the boss vulnerability window across wall-clock pauses and closes it after active time', () => {
  const g = fixture(), enemy = { type: 'boss', hp: 1000, maxHp: 1000, vulnerableUntil: 1300,
    sprite: { x: 0, y: 0, setTintFill: vi.fn() } };
  Object.assign(g, { stage: 5, combatElapsedMs: 1000, time: { now: 1000000, delayedCall: vi.fn() },
    critChance: 0, critMultiplier: 2, showDamageText: vi.fn(), updateBossBar: vi.fn() });
  g.damageEnemy(enemy, 100); expect(enemy.hp).toBe(900);
  g.combatElapsedMs = 1301; g.damageEnemy(enemy, 100); expect(enemy.hp).toBe(855);
});
