import { describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
import { WEAPONS } from '../data/weapons';
import { dynamiteRadius } from '../data/weaponPresentation';
vi.mock('phaser', () => ({ default: { Scene: class {}, Events: { EventEmitter: class {} } } }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playExplosion: vi.fn(), playRicochet: vi.fn(), playPlayerGunshot: vi.fn(), playShotgun: vi.fn(), playRifle: vi.fn(), playWhip: vi.fn() } }));
function fixture() {
  const g = Object.create(GameScene.prototype), effects = { explosion: vi.fn(), throwMarker: vi.fn(() => ({ progress:0,done:false })),
    dressBullet: vi.fn(), whip: vi.fn(), bottleTexture: () => 'bottle' };
  Object.assign(g, { player: { x:1250, y:460 }, runId:'active-run', isGameOver:false, bossDefeated:false,
    damageMultiplier:1.2, areaMultiplier:1, extraProjectiles:0, enemies:[], projectiles:[], fireZones:[],
    activeWeapons:new Map(), getWeaponEffects:()=>effects, getNearestEnemies:()=>[], damageEnemy:vi.fn(),
    cameras:{main:{shake:vi.fn(),flash:vi.fn()}}, tweens:{add:vi.fn()} });
  const sprites = [];
  g.add = { graphics:()=>({setDepth(){return this;},destroy:vi.fn()}), sprite:(x,y,key)=>{
    const sprite={x,y,key,destroy:vi.fn()};
    for(const method of ['setDepth','setTint','setScale','setPosition','setRotation'])sprite[method]=vi.fn(()=>sprite);
    sprites.push(sprite);return sprite;
  }};
  return {g,effects,sprites};
}
describe('localized TNT gameplay and presentation',()=>{
  it.each([false,true])('uses the exact visual radius for a single hit per living target (keg=%s)',isKeg=>{
    const {g,effects}=fixture(), x=1250,y=460,radius=dynamiteRadius(1.4,isKeg);g.areaMultiplier=1.4;
    const enemies=[{sprite:{x,y}},{sprite:{x:x+radius,y}},{sprite:{x:x+radius+.01,y}},{sprite:{x,y:y+radius+.01}},{dead:true,sprite:{x,y}}];
    g.enemies=enemies;g.explodeDynamite(x,y,70,isKeg);
    expect(effects.explosion).toHaveBeenCalledExactlyOnceWith(x,y,radius,isKeg?'hellfire':'tnt');
    expect(g.damageEnemy.mock.calls).toEqual([[enemies[0],84],[enemies[1],84]]);
    expect(g.cameras.main.shake).not.toHaveBeenCalled();expect(g.cameras.main.flash).not.toHaveBeenCalled();
    expect(g.fireZones).toHaveLength(isKeg?1:0);
    if(isKeg) {expect(g.fireZones[0].radius).toBe(radius*.9);expect(g.fireZones[0].life).toBe(5000);}
  });
  it.each(WEAPONS.dynamite.levels)('preserves level $level count, damage and radius, hitting only after the arc lands',level=>{
    const {g,effects,sprites}=fixture();g.activeWeapons.set('dynamite',level.level);
    const target={sprite:{x:1450,y:510}};g.getNearestEnemies=()=>[target];g.enemies=[target];
    g.fireWeapon(WEAPONS.dynamite,level);
    expect(sprites).toHaveLength(level.projectileCount);expect(g.damageEnemy).not.toHaveBeenCalled();
    const flight=g.tweens.add.mock.calls[0][0],marker=effects.throwMarker.mock.results[0].value;
    expect(flight.duration).toBe(650);flight.targets.progress=.5;flight.onUpdate();
    expect(sprites[0].setPosition).toHaveBeenLastCalledWith(1350,415);
    expect(Math.abs(sprites[0].setRotation.mock.calls.at(-1)[0])).toBeLessThan(1);
    expect(marker.progress).toBe(.5);
    flight.onComplete();flight.onComplete();
    expect(marker.done).toBe(true);expect(g.damageEnemy).toHaveBeenCalledExactlyOnceWith(target,Math.round(level.damage*1.2));
    expect(effects.explosion).toHaveBeenCalledExactlyOnceWith(1450,510,90,'tnt');
    expect(g.cameras.main.shake).not.toHaveBeenCalled();
  });
  it.each(['death','victory','new-run'])('cancels pending landing damage after %s',reason=>{
    const {g,effects}=fixture();g.fireWeapon(WEAPONS.dynamite,WEAPONS.dynamite.levels[0]);
    if(reason==='death')g.isGameOver=true;else if(reason==='victory')g.bossDefeated=true;else g.runId='new-run';
    g.tweens.add.mock.calls[0][0].onComplete();
    expect(effects.explosion).not.toHaveBeenCalled();expect(g.damageEnemy).not.toHaveBeenCalled();
  });
  it.each(Object.values(WEAPONS))('$id fires every rank without shaking or flashing the whole screen',weapon=>{
    for(const level of weapon.levels) {
      const {g}=fixture();g.activeWeapons.set(weapon.id,level.level);g.fireWeapon(weapon,level);
      expect(g.cameras.main.shake).not.toHaveBeenCalled();expect(g.cameras.main.flash).not.toHaveBeenCalled();
    }
  });
  it('bounds evolved fire zones and disposes the oldest graphic without changing damage',()=>{
    const {g}=fixture(),destroy=vi.fn();g.fireZones=Array.from({length:64},()=>({graphics:{destroy}}));
    g.explodeDynamite(0,0,400,true);expect(g.fireZones).toHaveLength(64);expect(destroy).toHaveBeenCalledOnce();
  });
});
