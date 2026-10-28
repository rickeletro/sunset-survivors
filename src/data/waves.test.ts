import { it,expect } from 'vitest';
import { WAVES,WaveTimeline,waveAt,waveRate,waveEnemyStats,wavePressure,wavePool,ENEMY_CAP,HORDE_CAP } from './waves';
import { ENEMY_DEFS } from './enemies';
import { MINI_BOSSES,MINI_HERO_HEIGHTS,miniBossProfile,miniBossScale,shieldMultiplier } from './miniBosses';
import bounds from '../assets/enemyFrameBounds.json';
it('uses exact 120-second boundaries, five independent mini-boss windows, and a 9-minute final boss',()=>{
  const timeline=new WaveTimeline(),mini:number[]=[],changes:number[]=[],boss:number[]=[];
  for(let t=0;t<=600;t++){const beat=timeline.advance(t);if(beat.changed)changes.push(t);mini.push(...beat.miniBosses.map(()=>t));if(beat.finalBoss)boss.push(t);expect(beat.expired).toBe(t===600);expect(timeline.advance(t).miniBosses).toEqual([]);}
  expect(changes).toEqual([0,120,240,360,480]);expect(mini).toEqual([105,225,345,465,585]);expect(boss).toEqual([540]);
  expect([119.99,120,239.99,240,599.99,600].map(t=>waveAt(t).id)).toEqual([1,2,2,3,5,5]);
});
it('does not backfill expired captains or reset progression while old enemies remain',()=>{
  const timeline=new WaveTimeline();expect(timeline.advance(540).miniBosses).toEqual([]);expect(timeline.advance(585).miniBosses).toEqual([5]);expect(timeline.advance(600).expired).toBe(true);
  expect(ENEMY_CAP-HORDE_CAP).toBe(7);
});
it('raises wave-2+ pressure mainly through admissions and composition, with modest stat increases',()=>{
  expect(waveRate(140)/waveRate(0)).toBeCloseTo(1.65);
  expect(waveEnemyStats(ENEMY_DEFS.bandit,140).hp).toBe(39);
  const previous=[2,2.6,3.8,5.2,6.8];
  for(let i=1;i<WAVES.length;i++) {
    expect(WAVES[i].spawnRate).toBeGreaterThan(previous[i]*1.2);
    for(const key of ['spawnRate','hp','damage','speed','target'] as const)expect(WAVES[i][key]).toBeGreaterThan(WAVES[i-1][key]);
  }
  expect(waveEnemyStats(ENEMY_DEFS.bandit,590,'hardcore').hp).toBe(Math.round(30*2.85*1.15));
  expect(wavePool(140,{}).find(e=>e.kind==='coyote')!.weight).toBe(30);
  expect(wavePool(500,{}).filter(e=>['rifle_guard','dynamiter','heavy','elite'].includes(e.kind)).reduce((s,e)=>s+e.weight,0)).toBe(63);
  expect(wavePool(500,{}).filter(e=>['drifter','bow_scout','outlaw_woman'].includes(e.kind)).reduce((s,e)=>s+e.weight,0)).toBe(21);
});
it('blends new stats, density, spawn rates and roster over 20 active seconds without a boundary spike',()=>{
  for(const at of [120,240,360,480]) {
    expect(wavePressure(at).spawnRate).toBe(wavePressure(at-.001).spawnRate);
    expect(wavePressure(at).hp).toBe(wavePressure(at-.001).hp);
    const mid=wavePressure(at+10),end=wavePressure(at+20),start=wavePressure(at);
    for(const key of ['spawnRate','hp','damage','speed','target'] as const) {
      expect(mid[key]).toBeCloseTo((start[key]+end[key])/2);
      expect(wavePressure(at+20.1)[key]).toBe(end[key]);
    }
  }
  expect(wavePool(120,{}).map(e=>e.kind)).toEqual(['bandit','knife_bandit','thief']);
  expect(wavePool(130,{}).find(e=>e.kind==='coyote')!.weight).toBe(15);
});
it('uses human-scale approved frames for every mini-boss and every playable hero',()=>{
  for(const mini of MINI_BOSSES)for(const height of Object.values(MINI_HERO_HEIGHTS)) {
    const b=bounds[mini.kind].frames.south[0].bounds;
    expect((b[3]-b[1])*miniBossScale(mini.kind,height)).toBeCloseTo(height);
    expect(miniBossProfile(mini.wave,8,'hardcore').hp).toBeGreaterThan(mini.hp);
  }
});
it('lets piercing rounds and flanking bypass frontal armor',()=>{
  expect(shieldMultiplier(1,0,100,0)).toBe(.25);expect(shieldMultiplier(1,0,-100,0)).toBe(1);expect(shieldMultiplier(1,0,0,100)).toBe(1);expect(shieldMultiplier(1,0,100,0,true)).toBe(1);
});
