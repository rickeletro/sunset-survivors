import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
import { MAIN_BOSS_AT } from '../data/waves';
import { getStage } from '../data/stages';
import { getBossCombat } from '../data/bossCombat';

vi.mock('phaser', () => ({ default: {
  Scene: class {}, Events: { EventEmitter: class {} },
  Math: { Clamp: (v, min, max) => Math.max(min, Math.min(max, v)) },
} }));
vi.mock('../audio/SoundManager', () => ({ sounds: {
  playRicochet: vi.fn(), playExplosion: vi.fn(), playBossWarning: vi.fn(), playBossDefeatedScream: vi.fn(), playRevolver: vi.fn(), playRifle: vi.fn(),
} }));

function sprite(x = 0, y = 0) {
  const s = { x, y, active: true, anims: {}, destroy: vi.fn(), play: vi.fn() };
  for (const method of ['setScale', 'setDepth', 'setTintFill', 'setTint', 'clearTint', 'setFlipX', 'setRotation', 'setOrigin', 'setScrollFactor']) s[method] = () => s;
  return s;
}
function bossHarness(stage) {
  const game = Object.create(GameScene.prototype);
  Object.assign(game, {
    stage, stageConfig: getStage(stage), bossMembers: [], enemies: [], player: sprite(4000, 4000),
    worldMap: { spawnPointAround: () => ({ x: 4500, y: 4000 }), resolve: (x, y) => ({ x, y }) },
    scale: { width: 1280, height: 720 }, cameras: { main: { shake: vi.fn() } },
    add: { text: () => sprite(), sprite }, textures: { exists: () => false },
    anims: { exists: () => true }, tweens: { add: vi.fn() }, bossBarContainer: { setVisible: vi.fn() },
    updateBossBar: vi.fn(), drops: [], kills: 0, killsText: { setText: vi.fn() },
    addBounty: vi.fn(), gameEvents: { emitEnemyKilled: vi.fn() }, victory: vi.fn(),
  });
  return game;
}

describe('campaign scene integration without rendering', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8])('spawns the correct boss sprites and stats for stage %i', stage => {
    const game = bossHarness(stage);
    game.spawnStageBoss();
    const profile = getBossCombat(stage);
    expect(game.bossSpawned).toBe(true);
    expect(game.bossMembers.length).toBe(profile.slugs.length);
    expect(game.bossMembers.map(e => e.bossSlug ?? 'greedwell')).toEqual(profile.slugs);
    expect(game.bossMembers.every(e => e.hp === profile.hp)).toBe(true);
  });
  it('does not clear the saloon when just one Smith brother dies', () => {
    const game = bossHarness(4);
    game.spawnStageBoss();
    game.killEnemy(game.bossMembers[0]);
    expect(game.victory).not.toHaveBeenCalled();
    expect(game.bossMembers.filter(enemy => !enemy.dead)).toEqual([game.bossMembers[1]]);
    game.killEnemy(game.bossMembers[1]);
    expect(game.victory).toHaveBeenCalledTimes(1);
    game.killEnemy(game.bossMembers[1]);
    expect(game.victory).toHaveBeenCalledTimes(1);
  });
  it.each([1, 8])('never lets a kill count skip the timer in stage %i', stage => {
    const game = bossHarness(stage);
    Object.assign(game, {
      isGameOver: false, bossDefeated: false, bossSpawned: false, kills: 50000, gameTimeSeconds: 88,
      hpRegen: 0, timeText: { setText: vi.fn() }, encounters: { tick: vi.fn() },
      director: { tick: () => [] }, runSpawnOrders: vi.fn(), updateStageStatus: vi.fn(), spawnStageBoss: vi.fn(),
    });
    game.onSecondTick(); expect(game.spawnStageBoss).not.toHaveBeenCalled();
    game.gameTimeSeconds = MAIN_BOSS_AT - 1;
    game.onSecondTick(); expect(game.spawnStageBoss).toHaveBeenCalledTimes(1);
  });
  it('uses different attack families instead of replaying Simon for every boss', () => {
    for (let stage = 2; stage <= 8; stage++) {
      const game = bossHarness(stage);
      Object.assign(game, {
        fireHostileBullet: vi.fn(), startCharge: vi.fn(), enemyThrowDynamite: vi.fn(), bossRevolverBarrage: vi.fn(),
        encounters: { warn: vi.fn() }, showBanner: vi.fn(), runSpawnOrders: vi.fn(),
        time: { now: 10000, delayedCall: (_delay, callback) => callback() },
      });
      const enemy = { sprite: sprite(3900, 4000), hp: 100, maxHp: 1000, attackCount: 4 };
      game.stageBossAttack(enemy);
      expect(game.bossRevolverBarrage).not.toHaveBeenCalled();
      if (stage === 3) expect(game.startCharge).toHaveBeenCalled();
      if (stage === 4) expect(game.enemyThrowDynamite).toHaveBeenCalledTimes(3);
      if (stage === 5) expect(enemy.vulnerableUntil).toBe(11300);
      if (stage === 7) expect(game.fireHostileBullet).toHaveBeenCalledTimes(10);
      if (stage === 8) expect(game.runSpawnOrders).toHaveBeenCalled();
    }
  });
  it('telegraphs a bull charge and keeps its direction locked when the player changes course', () => {
    const game = bossHarness(1);
    const line = { setDepth: () => line, lineStyle: () => line, lineBetween: () => line, destroy: vi.fn() };
    game.add.graphics = () => line;
    game.time = { delayedCall: vi.fn() };
    const bull = { type: 'longhorn', sprite: sprite(), chargeCooldown: 0, dirX: 1, dirY: 0 };
    game.updateEnemyTactics(bull, 300, 0, 300, 16);
    expect(bull.chargeWindup).toBeGreaterThan(0);
    expect(bull.chargeRemaining).toBeUndefined();
    game.updateEnemyTactics(bull, 0, 300, 300, 600);
    game.updateEnemyTactics(bull, 0, 300, 300, 500);
    expect(bull.chargeRemaining).toBeGreaterThan(0);
    expect(bull.dirX).toBe(1); expect(bull.dirY).toBe(0);
  });

  it('keeps Simon original firing cooldown even at low health', () => {
    const game = bossHarness(1);
    const enemy = { sprite: sprite(3500, 4000), type: 'boss', hp: 1, maxHp: 2000, speed: 105, throwCooldown: 0 };
    game.enemies = [enemy];
    game.enemyHash = { rebuild: vi.fn() };
    game.bossRevolverBarrage = vi.fn();
    game.updateEnemies(16);
    expect(enemy.throwCooldown).toBe(1800);
    expect(game.bossRevolverBarrage).toHaveBeenCalledTimes(1);
  });

});

it('pays the final boss cash once before victory and removes it from the unreachable drop', () => {
  const game = bossHarness(1); game.spawnStageBoss();
  const boss = game.bossMembers[0];
  game.killEnemy(boss); game.killEnemy(boss);
  expect(game.addBounty).toHaveBeenCalledExactlyOnceWith(250);
  expect(game.drops[0]).toMatchObject({ type: 'badge', val: 300, bounty: 0 });
  expect(game.victory).toHaveBeenCalledTimes(1);
});

it.each(['easy', 'normal', 'hardcore'])('uses the %s boss HP preset exactly once for every stage/member', mode => {
  const factor = { easy: 0.75, normal: 1, hardcore: 1.15 }[mode];
  for (let stage = 1; stage <= 8; stage++) {
    const game = bossHarness(stage); game.difficulty = mode; game.spawnStageBoss();
    for (const member of game.bossMembers) {
      expect(member.hp).toBe(Math.round(getBossCombat(stage).hp * factor));
      expect(member.damage).toBe(getBossCombat(stage).damage);
      expect(member.throwCooldown).toBeGreaterThanOrEqual(1800);
    }
  }
});

it('doubles boss projectile, area and TNT damage at their source without affecting regular TNT', () => {
  for (let stage = 2; stage <= 8; stage++) {
    const game = bossHarness(stage);
    Object.assign(game, { fireHostileBullet: vi.fn(), startCharge: vi.fn(), enemyThrowDynamite: vi.fn(),
      encounters: { warn: vi.fn() }, showBanner: vi.fn(), runSpawnOrders: vi.fn(), time: { now: 1000, delayedCall: (_ms, fn) => fn() } });
    game.stageBossAttack({ sprite: sprite(3900, 4000), hp: 1000, maxHp: 1000, attackCount: 1 });
    const bulletDamage = { 2: 40, 3: 40, 6: 50, 7: 36, 8: 50 }[stage];
    if (bulletDamage) for (const call of game.fireHostileBullet.mock.calls) expect(call[3]).toBe(bulletDamage);
    if (stage === 4) for (const call of game.enemyThrowDynamite.mock.calls) expect(call[4]).toBe(50);
    if (stage === 5) expect(game.encounters.warn.mock.calls[0][3]).toBe(60);
    if (stage === 6) expect(game.encounters.warn.mock.calls[0][3]).toBe(50);
  }
  const game = bossHarness(1), barrage = vi.fn(); game.getProjectileSystem = () => ({ simonBarrage: barrage });
  game.bossRevolverBarrage(10, 20); expect(barrage).toHaveBeenCalledExactlyOnceWith(10, 20, 36);
});

it.each([[undefined, 25], [50, 50]])('keeps normal TNT at 25 and executes explicit boss TNT damage once (%s)', (amount, expected) => {
  const game = bossHarness(4), graphics = {};
  for (const method of ['setDepth', 'lineStyle', 'strokeCircle', 'fillStyle', 'fillCircle', 'destroy']) graphics[method] = () => graphics;
  game.add.graphics = () => graphics; game.damagePlayer = vi.fn();
  game.enemyThrowDynamite(3900, 4000, 0, 0, amount);
  game.tweens.add.mock.calls[0][0].onComplete();
  expect(game.damagePlayer).toHaveBeenCalledExactlyOnceWith(expected);
});

describe('ten-minute waves and player-size captains',()=>{
  function miniHarness(stage=1){const g=bossHarness(stage);g.gameTimeSeconds=0;g.character={id:'billy'};
    g.enemyPool={acquire:(x,y,_texture,scale)=>{const s=sprite(x,y);s.scaleX=scale;s.scaleY=scale;s.setPosition=(x,y)=>{s.x=x;s.y=y;return s;};return s;},release:vi.fn()};
    g.showBanner=vi.fn();return g;
  }
  it('delivers five captains, one main boss and a hard timeout at exact active seconds',async()=>{
    const {WaveTimeline}=await import('../data/waves');const g=miniHarness();
    Object.assign(g,{waveTimeline:new WaveTimeline(),isGameOver:false,bossDefeated:false,hpRegen:0,timeText:{setText:vi.fn()},encounters:{tick:vi.fn()},director:{tick:()=>[]},runSpawnOrders:vi.fn(),updateStageStatus:vi.fn(),gameOver:vi.fn(()=>{g.isGameOver=true;})});
    const minis=[];g.spawnMiniBoss=vi.fn(w=>minis.push([g.gameTimeSeconds,w]));g.spawnStageBoss=vi.fn(()=>{g.bossSpawned=true;});
    g.saloonOpen=true;g.onSecondTick();expect(g.gameTimeSeconds).toBe(0);g.saloonOpen=false;
    for(let i=0;i<600;i++)g.onSecondTick();
    expect(minis).toEqual([[105,1],[225,2],[345,3],[465,4],[585,5]]);expect(g.spawnStageBoss).toHaveBeenCalledTimes(1);expect(g.gameOver).toHaveBeenCalledExactlyOnceWith(false);expect(g.gameTimeSeconds).toBe(600);
  });
  it('reserves enough room for all captains and both Smith brothers without erasing the horde',()=>{
    const g=miniHarness(4);g.enemies=Array.from({length:233},()=>({hp:50}));const old=g.enemies[0];
    for(let i=1;i<=4;i++)expect(g.spawnMiniBoss(i)).toBeDefined();g.spawnStageBoss();expect(g.spawnMiniBoss(5)).toBeDefined();
    expect(g.enemies).toHaveLength(240);expect(g.enemies[0]).toBe(old);expect(old.hp).toBe(50);expect(g.spawnEnemy('bandit',0,0)).toBeUndefined();
  });
  it('mini-boss death drops its earned loot once and never clears the stage',()=>{
    const g=miniHarness();const mini=g.spawnMiniBoss(1);g.killEnemy(mini);g.killEnemy(mini);
    expect(g.kills).toBe(1);expect(g.drops).toHaveLength(1);expect(g.drops[0]).toMatchObject({type:'badge',val:120,bounty:25});expect(g.victory).not.toHaveBeenCalled();
  });
  it('locks a quickdraw aim during warning and fires one straight shot only after windup',()=>{
    const g=miniHarness();g.encounters={warn:vi.fn()};g.fireHostileBullet=vi.fn();const e=g.spawnMiniBoss(2);e.miniCooldown=0;
    g.updateMiniBoss(e,300,0,300,16);expect(g.fireHostileBullet).not.toHaveBeenCalled();g.updateMiniBoss(e,0,300,300,649);expect(g.fireHostileBullet).not.toHaveBeenCalled();
    g.updateMiniBoss(e,0,300,300,1);expect(g.fireHostileBullet).toHaveBeenCalledWith(e.sprite.x,e.sprite.y,0,e.damage,850);
  });
  it('creates two bounded telegraphed traps for Powder Jack and gives Flint a melee opening',()=>{
    const g=miniHarness();g.encounters={warn:vi.fn()};g.damagePlayer=vi.fn();const bomber=g.spawnMiniBoss(3);bomber.miniCooldown=0;
    g.updateMiniBoss(bomber,300,0,300,16);expect(g.encounters.warn).toHaveBeenCalledTimes(2);expect(g.encounters.warn.mock.calls[0].slice(1)).toEqual([1000,2200,30]);
    const guard=g.spawnMiniBoss(4);guard.miniCooldown=0;g.player.x=guard.sprite.x+65;g.player.y=guard.sprite.y;
    g.updateMiniBoss(guard,65,0,65,16);expect(guard.miniWindup).toBe(850);g.updateMiniBoss(guard,65,0,65,850);expect(g.damagePlayer).toHaveBeenCalledWith(Math.round(guard.damage*1.35));
  });
});

it('applies Flint armor only to frontal ordinary bullets, with an opening during windup',()=>{
  const g=bossHarness(1);g.critChance=0;g.time={delayedCall:vi.fn()};g.showDamageText=vi.fn();
  const enemy={sprite:sprite(0,0),type:'rifle_guard',miniWave:4,hp:1000,maxHp:1000,dirX:1,dirY:0};
  g.damageEnemy(enemy,100,{x:100,y:0});expect(enemy.hp).toBe(975);
  g.damageEnemy(enemy,100,{x:-100,y:0});expect(enemy.hp).toBe(875);
  g.damageEnemy(enemy,100,{x:100,y:0,bypassShield:true});expect(enemy.hp).toBe(775);
  enemy.miniWindup=500;g.damageEnemy(enemy,100,{x:100,y:0});expect(enemy.hp).toBe(675);
});
