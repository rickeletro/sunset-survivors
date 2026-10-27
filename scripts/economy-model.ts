import { simulateProgression, PROFILES } from './balance-model';
import { ECONOMY, bankReward, servicePrice, stageClearBonus, type RunServiceId } from '../src/data/economy';
import type { DifficultyId } from '../src/data/difficulty';
export const ECONOMIC_RUNS = {
  short: {seconds:120,victory:false,objectives:0,captains:0,shopping:['saloon_rest'] as RunServiceId[]},
  medium: {seconds:300,victory:false,objectives:.5,captains:1,shopping:['saloon_rest','gun_oil','gallery'] as RunServiceId[]},
  long: {seconds:570,victory:true,objectives:2/3,captains:4,shopping:['saloon_rest','special_rounds','gun_oil','gallery','saloon_rest'] as RunServiceId[]},
} as const;
/** Expected cash/throughput envelope, not a combat or player-behavior simulation. */
export function economicRun(length:keyof typeof ECONOMIC_RUNS, profile:keyof typeof PROFILES='steady', mode:DifficultyId='normal', stage=1) {
 const scenario=ECONOMIC_RUNS[length];
 const base=simulateProgression(stage,profile,undefined,1,{seconds:scenario.seconds,rareCash:true,objectiveFraction:scenario.objectives});
 let cash=base.bounty;
 for(let wave=1;wave<=scenario.captains;wave++)cash+=(ECONOMY.sources.captainBase+(wave-1)*ECONOMY.sources.captainPerWave)*PROFILES[profile].collection;
 if(scenario.victory)cash+=ECONOMY.sources.bossBase+stage*ECONOMY.sources.bossPerStage+stageClearBonus(stage);
 const gross=Math.floor(cash);cash=gross;let spent=0,galleryPaid=false;
 for(const id of scenario.shopping) {
  const price=servicePrice(id,stage);
  if(cash<price)continue;
  cash-=price;spent+=price;if(id==='gallery')galleryPaid=true;
 }
 // A non-perfect eight-hit round: no free admission, no assumed gambling windfall.
 const galleryGross=galleryPaid?8*ECONOMY.gallery.perHit:0;cash+=galleryGross;
 const banked=cash+bankReward(0,scenario.seconds,scenario.victory,mode);
 let bank=0,bob=0,cormano=0;
 for(let run=1;run<=10000;run++) {
  bank+=banked;
  if(!bob&&bank>=ECONOMY.characters.bob){bank-=ECONOMY.characters.bob;bob=run;}
  if(bob&&!cormano&&bank>=ECONOMY.characters.cormano){cormano=run;break;}
 }
 return {length,profile,mode,seconds:scenario.seconds,kills:base.kills,gross,galleryGross,spent,remaining:cash,banked,bobRuns:bob,cormanoTotalRuns:cormano};
}
