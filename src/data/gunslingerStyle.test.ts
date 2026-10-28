import { describe,expect,it } from 'vitest';
import { FRONTIER_FEEL, GunslingerStyle, evolutionTrail } from './gunslingerStyle';
describe('active-time gunslinger feel',()=>{
 it('integrates the same bounded dodge distance at different frame rates and expires without residual movement',()=>{
  for(const step of [8,16,30,90,500]){
   const style=new GunslingerStyle('steve');expect(style.dashAge).toBe(Infinity);expect(style.dodge(0,3,4)).toBe(true);
   let distance=0;for(let now=step;now<1000;now+=step){const v=style.movement(now,step);if(v)distance+=Math.hypot(v.x,v.y);style.tick(now,step,true);}
   expect(distance).toBeCloseTo(FRONTIER_FEEL.dash.distance);expect(style.movement(2000,16)).toBeUndefined();
  }
 });
 it('rejects blocked/repeated activation and freezes timers while no combat time passes',()=>{
  const s=new GunslingerStyle('billy');expect(s.dodge(0,1,0,true)).toBe(false);expect(s.ready).toBe(0);
  expect(s.dodge(100,1,0)).toBe(true);s.tick(100,0,false);expect(s.ready).toBe(2400);
  expect(s.dodge(100,1,0)).toBe(false);expect(s.crit).toBe(.15);
  s.tick(1900,16,false);expect(s.crit).toBe(0);expect(s.dodge(2500,1,0)).toBe(true);
 });
 it('makes hero bonuses situational and does not turn all heroes into a permanent damage multiplier',()=>{
  const steve=new GunslingerStyle('steve');steve.dodge(0,1,0);expect(steve.fireRate).toBe(1.18);steve.tick(1300,16,true);expect(steve.fireRate).toBe(1);
  const bob=new GunslingerStyle('bob');for(let i=1;i<=9;i++)bob.tick(i*100,100,false);expect(bob.damage).toBe(1.18);
  bob.tick(916,16,true);expect(bob.damage).toBe(1);bob.damaged();expect(bob.damage).toBe(1);
  expect(new GunslingerStyle('cormano').damage).toBe(1);
 });
 it('rewards a maintained kill chain once, with a bounded buff and a cooldown, and resets the chain after damage',()=>{
  const s=new GunslingerStyle('steve');for(let i=0;i<14;i++)expect(s.kill(i*100)).toBe(false);
  expect(s.kill(1400)).toBe(true);expect(s.hot).toBe(true);expect(s.fireRate).toBeLessThanOrEqual(1.3);
  for(let i=0;i<40;i++)expect(s.kill(1500+i*100)).toBe(false);
  s.tick(9500,16,false);expect(s.hot).toBe(false);s.damaged();expect(s.chain).toBe(0);
  s.kill(10000);s.tick(15001,16,false);expect(s.chain).toBe(0);
 });
 it('reveals evolution requirements from the real inventory without replacing the existing unlock gates',()=>{
  expect(evolutionTrail(new Map([['rifle',3]]),new Map())).toContain('WEAPON 3/5 + BADGE NEEDED');
  expect(evolutionTrail(new Map([['rifle',5]]),new Map([['badge',1]]))).toContain('BADGE READY');
  expect(evolutionTrail(new Map([['golden_repeater',1]]),new Map())).toBe('BUILD YOUR FRONTIER LEGEND');
 });
});
