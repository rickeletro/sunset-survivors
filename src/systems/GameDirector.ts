import type { EnemyKind } from '../data/enemies';
import { getStage, type StageConfig } from '../data/stages';
import { HORDE_CAP, STAGE_SECONDS, waveAt, wavePool, waveRate, wavePressure } from '../data/waves';
import type { GameEvents } from './GameEvents';
export type SpawnPattern='ring'|'cluster'|'encircle';
export interface SpawnOrder {kind:EnemyKind;count:number;pattern:SpawnPattern;}
export { ENEMY_CAP as MAX_ALIVE } from '../data/waves';
/** Token-budgeted waves: capped room never accumulates a later spawn avalanche. */
export class GameDirector {
  private lastSpawnAt?:number;private budget=0;private lastWave=0;private announcedWave=0;
  constructor(private events:GameEvents,private stage:StageConfig=getStage(1),private random=Math.random){}
  reset(){this.lastSpawnAt=undefined;this.budget=0;this.lastWave=0;this.announcedWave=0;}
  targetCount(t:number):number{return Math.min(HORDE_CAP,Math.round(wavePressure(t).target*(1+(this.stage.id-1)*.02)));}
  intensity(t:number):number{return Math.max(0,Math.min(t/STAGE_SECONDS,1));}
  waveOrders(t:number,alive:number):SpawnOrder[]{
    const wave=waveAt(t),dt=this.lastSpawnAt===undefined?.85:Math.max(0,Math.min(1.7,t-this.lastSpawnAt));this.lastSpawnAt=t;
    if(wave.id!==this.lastWave){this.budget=0;this.lastWave=wave.id;}
    const room=Math.min(HORDE_CAP-alive,this.targetCount(t)-alive);
    if(t>=STAGE_SECONDS||room<=0){this.budget=0;return [];}
    this.budget+=waveRate(t,this.stage.id)*dt;
    const wanted=Math.floor(this.budget+1e-9),count=Math.min(room,wanted);this.budget=wanted>room?0:Math.max(0,this.budget-count);
    const pool=wavePool(t,this.stage.enemies),total=pool.reduce((sum,e)=>sum+e.weight,0),counts=new Map<EnemyKind,number>();
    for(let i=0;i<count;i++){let draw=this.random()*total,pick=pool[pool.length-1].kind;for(const item of pool){draw-=item.weight;if(draw<=0){pick=item.kind;break;}}counts.set(pick,(counts.get(pick)??0)+1);}
    return [...counts].map(([kind,count])=>({kind,count,pattern:'ring'}));
  }
  tick(t:number,_alive:number):SpawnOrder[]{
    const wave=waveAt(t);if(t<STAGE_SECONDS&&wave.id!==this.announcedWave){this.announcedWave=wave.id;this.events.emitSpecialWave({label:`WAVE ${wave.id}/5 — ${wave.name}`});}
    return [];
  }
}
