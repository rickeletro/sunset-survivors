import type { EnemyKind, EnemyDef } from './enemies';
import { difficultyProfile, type DifficultyId } from './difficulty';
export const WAVE_SECONDS=120, STAGE_SECONDS=600, MAIN_BOSS_AT=540;
export const ENEMY_CAP=240, HORDE_CAP=233; // Reserve five captains and the two Smith brothers.
export const WAVE_RAMP_SECONDS = 20;
export const WAVES=[
  {id:1,name:'DUST ON THE TRAIL',spawnRate:2,hp:1,damage:1,speed:.78,target:55,weights:{bandit:52,knife_bandit:36,thief:12}},
  {id:2,name:'RUNNING WITH COYOTES',spawnRate:3.3,hp:1.3,damage:1.12,speed:.94,target:100,weights:{bandit:20,knife_bandit:25,coyote:30,snake:8,thief:7,drifter:10}},
  {id:3,name:'POWDER AND LEAD',spawnRate:4.8,hp:1.7,damage:1.3,speed:1.04,target:145,weights:{bandit:10,knife_bandit:12,coyote:16,rifle_guard:23,dynamiter:16,drifter:10,bow_scout:13}},
  {id:4,name:'NO SAFE GROUND',spawnRate:6.4,hp:2.2,damage:1.52,speed:1.14,target:195,weights:{bandit:6,knife_bandit:10,coyote:14,rifle_guard:19,dynamiter:17,heavy:12,drifter:8,bow_scout:7,outlaw_woman:7}},
  {id:5,name:'THE LAST SHOWDOWN',spawnRate:8.2,hp:2.85,damage:1.8,speed:1.23,target:233,weights:{knife_bandit:7,coyote:9,rifle_guard:20,dynamiter:18,heavy:15,elite:10,drifter:6,bow_scout:7,outlaw_woman:8}},
] as const;
export function waveAt(seconds:number) { return WAVES[Math.min(4,Math.max(0,Math.floor((Number.isFinite(seconds)?seconds:0)/WAVE_SECONDS)))]; }
/** Ease new pressure in over 20 active seconds; established enemies never gain stats retroactively. */
export function wavePressure(seconds: number) {
  seconds = Number.isFinite(seconds) ? seconds : 0;
  const current = waveAt(seconds), previous = WAVES[Math.max(0, current.id - 2)];
  const progress = current.id === 1 ? 1 : Math.max(0, Math.min(1, (seconds - (current.id - 1) * WAVE_SECONDS) / WAVE_RAMP_SECONDS));
  const blend = (key: 'spawnRate' | 'hp' | 'damage' | 'speed' | 'target') => previous[key] + (current[key] - previous[key]) * progress;
  return { progress, spawnRate: blend('spawnRate'), hp: blend('hp'), damage: blend('damage'), speed: blend('speed'), target: blend('target') };
}
export function waveRate(seconds:number,stage=1):number {return wavePressure(seconds).spawnRate*(1+Math.max(0,Math.min(7,stage-1))*.06);}
export function waveEnemyStats(def:EnemyDef,seconds:number,mode?:DifficultyId) {
  const wave=wavePressure(seconds);
  return {hp:Math.max(1,Math.round(def.baseHp*wave.hp*difficultyProfile(mode).enemyHp)),speed:def.speed*wave.speed,damage:Math.round(def.damage*wave.damage)};
}
export function wavePool(seconds:number,roster:Partial<Record<EnemyKind,number>>) {
  const current = waveAt(seconds), previous = WAVES[Math.max(0, current.id - 2)], { progress } = wavePressure(seconds);
  const weights = new Map<EnemyKind, number>();
  for (const [wave, factor] of [[previous, 1 - progress], [current, progress]] as const) {
    for (const [kind, weight] of Object.entries(wave.weights)) weights.set(kind as EnemyKind, (weights.get(kind as EnemyKind) ?? 0) + weight * factor);
  }
  return [...weights].filter(([, weight]) => weight > 0).map(([kind, weight]) => ({ kind, weight: weight * (1 + (roster[kind] ?? 0) / 100) }));
}
/** Finite one-shot beat tracking; late updates never backfill expired mini-boss windows. */
export class WaveTimeline {
  private wave=0; private minis=new Set<number>(); private finale=false;
  advance(seconds:number) {
    const current=waveAt(seconds), changed=seconds<STAGE_SECONDS&&current.id!==this.wave; this.wave=current.id;
    const miniBosses:number[]=[];
    for(const wave of WAVES) {const at=wave.id*WAVE_SECONDS-15;if(seconds>=at&&!this.minis.has(wave.id)){this.minis.add(wave.id);if(seconds<at+15)miniBosses.push(wave.id);}}
    const finalBoss=seconds>=MAIN_BOSS_AT&&seconds<STAGE_SECONDS&&!this.finale;if(finalBoss)this.finale=true;
    return {wave:current,changed,miniBosses,finalBoss,expired:seconds>=STAGE_SECONDS};
  }
}
