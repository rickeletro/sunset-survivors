import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
import { xpForLevel } from '../data/economy';
import { WEAPONS } from '../data/weapons';
import { PASSIVES } from '../data/passives';
vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} }, Utils: { Array: { Shuffle: a => a } } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playCoin: vi.fn(), playRicochet: vi.fn() } }));
function fixture() {
  const game = Object.create(GameScene.prototype);
  Object.assign(game, { currentXp: 0, level: 1, xpToNextLevel: xpForLevel(1), choosingUpgrade: false,
    isGameOver: false, activeWeapons: new Map([['revolver', 1]]), activePassives: new Map(), gameTimeSeconds: 0,
    levelText: { setText: vi.fn() }, bountyText: { setText: vi.fn() }, updateXpBar: vi.fn(), updateHpBar: vi.fn(),
    scene: { pause: vi.fn(), resume: vi.fn(), launch: vi.fn() }, character: { stats: { maxHp: 100, fireRateMultiplier: 1.25 } },
    hp: 100, maxHp: 100, bounty: 0, kills: 0 });
  return game;
}
describe('campaign economy integration', () => {
  it('queues large XP rewards one modal at a time without losing surplus XP', () => {
    const g = fixture(); g.addXp(125);
    expect(g.level).toBe(2); expect(g.currentXp).toBe(75); expect(g.scene.launch).toHaveBeenCalledTimes(1);
    g.addXp(200); expect(g.level).toBe(2);
    const selected = () => g.scene.launch.mock.calls.at(-1)[1].onSelect({ type: 'reward', id: 'gold_purse' });
    selected(); g.addXp(0); expect(g.level).toBe(3); expect(g.currentXp).toBe(195);
    selected(); g.addXp(0); expect(g.level).toBe(4); expect(g.currentXp).toBe(35);
    selected(); g.addXp(0); expect(g.level).toBe(4); expect(g.bounty).toBe(75);
  });
  it('applies the stated total health bonus rather than accumulating every rank bonus', () => {
    const g = fixture();
    for (let i = 0; i < 5; i++) g.applyUpgrade({ type: 'passive', id: 'whiskey' });
    expect(g.maxHp).toBe(160); expect(g.hp).toBe(160); expect(g.hpRegen).toBe(1);
    for (let i = 0; i < 5; i++) g.applyUpgrade({ type: 'passive', id: 'bandolier' });
    expect(650 / g.fireRateMultiplier).toBeCloseTo(650 * 0.52 / 1.25);
  });
  it('never reoffers an evolved base and provides useful rewards after maxing a build', () => {
    const g = fixture(); g.activeWeapons = new Map([['desperado_fury', 1]]);
    expect(g.generateUpgradeChoices().some(c => c.id === 'revolver')).toBe(false);
    g.activeWeapons = new Map(Object.values(WEAPONS).map(w => [w.id, w.levels.length]));
    g.activePassives = new Map(Object.values(PASSIVES).map(p => [p.id, p.levels.length]));
    expect(g.generateUpgradeChoices().map(c => c.type)).toEqual(['reward', 'reward']);
  });
  it('conserves ground-fire damage across slow frames and releases expired fire', () => {
    const g = fixture(), enemy = { sprite: { x: 0, y: 0 } }, graphics = { destroy: vi.fn() };
    g.enemies = [enemy]; g.fireZones = [{ x: 0, y: 0, radius: 50, life: 1200, tickTimer: 0, damage: 10, graphics }];
    g.time = { now: 0 }; g.getWeaponEffects = () => ({ drawFire: vi.fn() }); g.damageEnemy = vi.fn();
    g.updateFireZones(950); expect(g.damageEnemy).toHaveBeenLastCalledWith(enemy, 20);
    g.updateFireZones(500); expect(g.damageEnemy).toHaveBeenLastCalledWith(enemy, 10);
    expect(g.fireZones).toHaveLength(0); expect(graphics.destroy).toHaveBeenCalledOnce();
  });
  it('collects loot at the exact player position without NaN coordinates or lost XP', () => {
    const g = fixture(), sprite = { x: 0, y: 0, destroy: vi.fn() };
    g.player = { x: 0, y: 0 }; g.magnetRadius = 100; g.xpBonus = 1;
    g.drops = [{ type: 'gold', val: 5, bounty: 1, sprite }]; g.addXp = vi.fn();
    g.updateDrops(16);
    expect(sprite.x).toBe(0); expect(sprite.y).toBe(0); expect(g.bounty).toBe(1);
    expect(g.addXp).toHaveBeenCalledWith(5); expect(g.drops).toHaveLength(0);
  });
});

describe('throwable upgrades', () => {
  it.each(['molotov', 'dynamite'])('launches the upgraded count plus bonus projectiles for %s', id => {
    const g = fixture();
    g.player = { x: 50, y: 50 }; g.extraProjectiles = 1; g.getNearestEnemies = () => [];
    const sprite = { setDepth: vi.fn(), setTint: vi.fn(), setScale: vi.fn() };
    sprite.setDepth.mockReturnValue(sprite); g.add = { sprite: () => sprite };
    g.getWeaponEffects = () => ({ bottleTexture: () => 'bottle' }); g.lobProjectile = vi.fn();
    const definition = WEAPONS[id], level = definition.levels.at(-1);
    g.fireWeapon(definition, level);
    expect(g.lobProjectile).toHaveBeenCalledTimes(level.projectileCount + 1);
  });
  it('applies impact only on landing and cancels damage after the run ends', () => {
    const g = fixture(), land = vi.fn(), sprite = { destroy: vi.fn(), setPosition: vi.fn(), setRotation: vi.fn() };
    sprite.setPosition.mockReturnValue(sprite); g.player = { x: 0, y: 0 };
    g.tweens = { add: vi.fn() }; g.lobProjectile(sprite, 100, 50, 500, land);
    expect(land).not.toHaveBeenCalled(); const tween = g.tweens.add.mock.calls[0][0];
    tween.targets.progress = 0.5; tween.onUpdate(); expect(sprite.setPosition.mock.calls[0][1]).toBeLessThan(0);
    tween.onComplete(); expect(land).toHaveBeenCalledOnce();
    g.isGameOver = true; tween.onComplete(); expect(land).toHaveBeenCalledOnce();
  });
});

it('ignores duplicate or stale level-up callbacks rather than granting free upgrades', () => {
  const g = fixture(); g.addXp(xpForLevel(1));
  const select = g.scene.launch.mock.calls.at(-1)[1].onSelect;
  select({ type: 'weapon', id: 'revolver' }); select({ type: 'weapon', id: 'revolver' });
  expect(g.activeWeapons.get('revolver')).toBe(2);
  expect(g.scene.resume).toHaveBeenCalledTimes(1);
});

it('uses the badge total once at each rank rather than compounding previous bonuses', () => {
  const g = fixture();
  for (const expected of [1.2, 1.4, 1.65, 1.9, 2.2]) {
    g.applyUpgrade({ type: 'passive', id: 'badge' }); expect(g.xpBonus).toBe(expected);
  }
});
