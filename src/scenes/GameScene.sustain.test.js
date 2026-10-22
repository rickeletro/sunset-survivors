import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playCoin: vi.fn(), playHit: vi.fn() } }));

function fixture() {
  const g = Object.create(GameScene.prototype), sprite = { x: 0, y: 0, destroy: vi.fn() };
  sprite.setScale = () => sprite; sprite.setDepth = () => sprite;
  Object.assign(g, { hp: 50, maxHp: 100, player: { x: 0, y: 0, setAlpha: vi.fn() }, magnetRadius: 100,
    xpBonus: 1, drops: [], updateHpBar: vi.fn(), addXp: vi.fn(), addBounty: vi.fn(),
    kills: 0, killsText: { setText: vi.fn() }, gameEvents: { emitEnemyKilled: vi.fn(), emitPlayerDamaged: vi.fn() },
    add: { sprite: () => sprite }, tweens: { add: vi.fn() }, cameras: { main: { flash: vi.fn() } },
    combatElapsedMs: 1000, invulnUntil: 0, armor: 3 });
  return { g, sprite };
}
describe('recovery, damage and loot integration', () => {
  it.each([[0.019, 'whiskey'], [0.02, 'badge'], [0.2199, 'badge'], [0.22, 'gold']])('uses the revised health chance without changing XP/cash (%s)', (roll, type) => {
    const { g, sprite } = fixture(), random = vi.spyOn(Math, 'random').mockReturnValue(roll);
    const enemy = { type: 'bandit', sprite, xpVal: 10, bountyVal: 1 }; g.enemies = [enemy];
    try { g.killEnemy(enemy); } finally { random.mockRestore(); }
    expect(g.drops[0]).toMatchObject({ type, val: 10, bounty: 1 });
    g.updateDrops(0);
    expect(g.hp).toBe(type === 'whiskey' ? 62 : 50);
    expect(g.addXp).toHaveBeenCalledWith(10); expect(g.addBounty).toHaveBeenCalledWith(1);
  });
  it('keeps healing per original packet and caps full-health pickups', () => {
    const { g, sprite } = fixture();
    g.drops = [{ type: 'whiskey', sprite, val: 10, bounty: 1, packets: [{ val: 10, bounty: 1 }, { val: 10, bounty: 1 }] }];
    g.updateDrops(0); expect(g.hp).toBe(62); expect(g.drops).toHaveLength(1);
    g.updateDrops(0); expect(g.hp).toBe(74); expect(g.drops).toHaveLength(0);
    g.hp = 99; g.drops = [{ type: 'whiskey', sprite, val: 10, bounty: 1 }]; g.updateDrops(0); expect(g.hp).toBe(100);
  });
  it('preserves armor/contact damage and 600ms grace; only real hits reset the regeneration delay', () => {
    const { g } = fixture(); g.hp = 150; g.maxHp = 150;
    g.damagePlayer(12); expect(g.hp).toBe(141); expect(g.lastDamageAt).toBe(1000);
    g.combatElapsedMs = 1599; g.damagePlayer(12); expect(g.hp).toBe(141); expect(g.lastDamageAt).toBe(1000);
    g.combatElapsedMs = 1600; g.damagePlayer(12); expect(g.hp).toBe(132); expect(g.lastDamageAt).toBe(1600);
    g.saloonOpen = true; g.combatElapsedMs = 3000; g.damagePlayer(100); expect(g.hp).toBe(132); expect(g.lastDamageAt).toBe(1600);
  });
  it('regenerates only after four active seconds without damage, never by waiting in a menu', () => {
    const { g } = fixture();
    Object.assign(g, { bossSpawned: true, enemies: [], gameTimeSeconds: 0, hpRegen: 1, lastDamageAt: 0,
      combatElapsedMs: 3999, time: { now: 1000000 }, timeText: { setText: vi.fn() },
      encounters: { tick: vi.fn() }, director: { tick: () => [] }, runSpawnOrders: vi.fn(), updateStageStatus: vi.fn() });
    g.onSecondTick(); expect(g.hp).toBe(50);
    g.combatElapsedMs = 4000; g.onSecondTick(); expect(g.hp).toBe(51);
    g.saloonOpen = true; g.time.now += 300000; g.onSecondTick(); expect(g.hp).toBe(51);
  });
});
