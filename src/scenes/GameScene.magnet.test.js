import { afterEach, describe, expect, it, vi } from 'vitest';
import { GameScene } from './GameScene';
import { ECONOMY } from '../data/economy';
import { DROP_SPRITE_BUDGET, mergeLoot } from '../systems/LootBudget';
vi.mock('phaser',()=>({default:{Scene:class{},Events:{EventEmitter:class{}}}}));
vi.mock('../audio/SoundManager',()=>({sounds:{playMagnet:vi.fn(),playCoin:vi.fn()}}));
import { sounds } from '../audio/SoundManager';
afterEach(()=>{vi.restoreAllMocks();vi.clearAllMocks();});
function sprite(x=0,y=0) {
 const s={x,y,active:true,destroy:vi.fn()};for(const method of ['setScale','setDepth'])s[method]=vi.fn(()=>s);return s;
}
function fixture() {
 const g=Object.create(GameScene.prototype), explosion=vi.fn();
 Object.assign(g,{player:{x:0,y:0},combatElapsedMs:0,hp:50,maxHp:100,magnetRadius:100,drops:[],enemies:[],kills:0,
  killsText:{setText:vi.fn()},gameEvents:{emitEnemyKilled:vi.fn()},add:{sprite},addBounty:vi.fn(),awardXp:vi.fn(),
  updateHpBar:vi.fn(),showBanner:vi.fn(),getWeaponEffects:()=>({explosion}),updateBossBar:vi.fn(),bossMembers:[{dead:false}]});
 return {g,explosion};
}
describe('rare single-use loot magnet',()=>{
 it.each(['bandit','elite','boss'])('never drops a Magnet from %s, even at the lowest random roll',type=>{
  const {g}=fixture();vi.spyOn(Math,'random').mockReturnValue(0);
  const enemy={type,sprite:sprite(),xpVal:10,bountyVal:1};g.enemies=[enemy];g.killEnemy(enemy);
  expect(g.drops.some(d=>d.type==='magnet')).toBe(false);
 });
 it.each([[.019999,true],[.02,false],[.9,false]])('uses the exact configured mini-boss drop probability (%s)',(roll,expected)=>{
  const {g}=fixture();vi.spyOn(Math,'random').mockReturnValueOnce(.5).mockReturnValue(roll);
  const enemy={type:'knife_bandit',miniWave:1,sprite:sprite(),xpVal:120,bountyVal:25};g.enemies=[enemy];g.killEnemy(enemy);g.killEnemy(enemy);
  expect(g.drops.filter(d=>d.type==='badge')).toHaveLength(1);
  expect(g.drops.filter(d=>d.type==='magnet')).toHaveLength(expected?1:0);
 });
 it('flies all eligible cash, XP and recovery loot toward the player, without touching enemies or scenery',()=>{
  const {g,explosion}=fixture();
  const target={x:4000,y:4000},scenery={x:4200,y:4200};g.enemies=[{sprite:target}];
  g.drops=[{type:'magnet',sprite:sprite(),val:0,bounty:0},
   {type:'gold',sprite:sprite(4000,0),val:10,bounty:2,packets:[{val:10,bounty:2},{val:20,bounty:3}]},
   {type:'badge',sprite:sprite(-5000,0),val:120,bounty:25},
   {type:'whiskey',sprite:sprite(0,3000),val:10,bounty:1},
   {type:'moneybag',sprite:sprite(0,-6000),val:14,bounty:16}];
  g.updateDrops(16);expect(g.drops).toHaveLength(4);expect(g.drops.every(d=>d.attracted)).toBe(true);
  const start=g.drops.map(d=>Math.hypot(d.sprite.x,d.sprite.y));g.combatElapsedMs+=16;g.updateDrops(16);
  expect(g.drops.every((d,i)=>Math.hypot(d.sprite.x,d.sprite.y)<start[i])).toBe(true);
  for(let i=0;i<500&&g.drops.length;i++){g.combatElapsedMs+=16;g.updateDrops(16);}
  expect(g.drops).toHaveLength(0);expect(g.hp).toBe(62);
  expect(g.awardXp.mock.calls.reduce((sum,[amount])=>sum+amount,0)).toBe(174);
  expect(g.addBounty.mock.calls.reduce((sum,[amount])=>sum+amount,0)).toBe(47);
  expect(sounds.playMagnet).toHaveBeenCalledOnce();expect(explosion).toHaveBeenCalledExactlyOnceWith(0,0,170,'magnet');
  expect(target).toEqual({x:4000,y:4000});expect(scenery).toEqual({x:4200,y:4200});
 });
 it('conserves thousands of merged loot packets with a bounded per-frame collection workload',()=>{
  const {g}=fixture();let xp=0,cash=0;g.awardXp=amount=>{xp+=amount};g.addBounty=amount=>{cash+=amount};
  for(let i=0;i<5000;i++) {
   const incoming={type:'gold',val:10,bounty:2,x:2000,y:0};
   if(!mergeLoot(g.drops,incoming))g.drops.push({type:'gold',val:10,bounty:2,sprite:sprite(2000,0)});
  }
  expect(g.drops).toHaveLength(DROP_SPRITE_BUDGET);
  g.drops.push({type:'magnet',val:0,bounty:0,sprite:sprite()});
  for(let frame=0;frame<1000&&g.drops.length;frame++) {
   const before=cash;g.combatElapsedMs+=16;g.updateDrops(16);
   expect(cash-before).toBeLessThanOrEqual(ECONOMY.loot.collectionBudget*2);
  }
  expect(g.drops).toHaveLength(0);expect(xp).toBe(50000);expect(cash).toBe(10000);
 });
 it('adds the rare money-bag cash without changing enemy XP',()=>{
  const {g}=fixture();vi.spyOn(Math,'random').mockReturnValue(.025);
  const enemy={type:'bandit',sprite:sprite(),xpVal:10,bountyVal:1};g.enemies=[enemy];g.killEnemy(enemy);
  expect(g.drops[0]).toMatchObject({type:'moneybag',val:10,bounty:16});
 });
});
