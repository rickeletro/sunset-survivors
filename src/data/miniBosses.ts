import { ECONOMY } from './economy';
import { difficultyProfile, type DifficultyId } from './difficulty';
import bounds from '../assets/enemyFrameBounds.json';
export const MINI_BOSSES=[
  {wave:1,name:'IRON FIST COLE',kind:'knife_bandit',hp:750,speed:100,damage:24,cooldown:2600,windup:700,color:0xffc52a},
  {wave:2,name:'QUICKDRAW QUINN',kind:'rifle_guard',hp:1500,speed:142,damage:26,cooldown:1800,windup:650,color:0xe52b20},
  {wave:3,name:'POWDER JACK',kind:'dynamiter',hp:2700,speed:95,damage:30,cooldown:3200,windup:1000,color:0xff791c},
  {wave:4,name:'MARSHAL FLINT',kind:'rifle_guard',hp:4200,speed:100,damage:36,cooldown:2400,windup:850,color:0x8bdd78},
  {wave:5,name:'BLACK SPUR',kind:'rifle_guard',hp:6000,speed:150,damage:40,cooldown:1500,windup:500,color:0xc49ac5},
] as const;
export type MiniBossDef=typeof MINI_BOSSES[number];
export function miniBossProfile(wave:number,stage:number,mode?:DifficultyId) {
  const def=MINI_BOSSES[Math.max(0,Math.min(4,wave-1))];
  return {...def,hp:Math.round(def.hp*(1+Math.max(0,stage-1)*.12)*difficultyProfile(mode).enemyHp),xp:120+(def.wave-1)*60,bounty:ECONOMY.sources.captainBase+(def.wave-1)*ECONOMY.sources.captainPerWave};
}
export function miniBossScale(kind:MiniBossDef['kind'],height=68.5):number {
  const frame=bounds[kind].frames.south[0];return height/(frame.bounds[3]-frame.bounds[1]);
}
export function shieldMultiplier(facingX:number,facingY:number,fromX:number,fromY:number,piercing=false):number {
  if(piercing)return 1;
  const length=Math.hypot(fromX,fromY)*Math.hypot(facingX,facingY);
  return length>0&&(facingX*fromX+facingY*fromY)/length>=.45?.25:1;
}

export const MINI_HERO_HEIGHTS: Record<string,number> = {"steve": 68.5, "billy": 74.5, "bob": 75.0, "cormano": 73.0};

export function miniBossFootOffset(kind:MiniBossDef['kind'],height:number):number { return bounds[kind].footOffset*miniBossScale(kind,height); }
