import type { CharacterData } from './characters';
import { WEAPON_EVOLUTIONS } from './evolutions';
export const FRONTIER_FEEL={dash:{distance:110,duration:180,cooldown:2400,invulnerable:90},streak:{window:5000,kills:15,duration:8000,cooldown:30000,fireRate:1.1},focus:{delay:900,damage:1.18},quickdraw:{duration:1300,fireRate:1.18},lawman:{duration:1800,crit:.15},kick:{radius:115,distance:65,cap:20},rerolls:2,contract:{duration:25000,extraGuards:4,range:240}} as const;
export const HERO_STYLE={steve:{name:'QUICKDRAW',description:'After a dodge: +18% fire rate for 1.3s.'},billy:{name:'LAWMAN',description:'After a dodge: +15% crit chance for 1.8s.'},bob:{name:'STEADY AIM',description:'Stand still for 0.9s: +18% damage. Move to reset.'},cormano:{name:'DUST KICK',description:'Dodge pushes nearby normal enemies away.'}} as const;
/** Combat-time only. No currency or permanent power. Active movement has a bounded footprint. */
export class GunslingerStyle {
  private now=0;private dashUntil=-Infinity;private readyAt=0;private dashX=1;private dashY=0;
  private stationary=0;private lastKill=-Infinity;private streak=0;private hotUntil=0;private hotReady=0;private specialUntil=0;
  constructor(readonly hero:CharacterData['id']){}
  dodge(now:number,dx:number,dy:number,blocked=false):boolean {
    if(blocked||now<this.readyAt)return false;
    const length=Math.hypot(dx,dy)||1;this.dashX=dx/length;this.dashY=dy/length;
    this.now=now;this.dashUntil=now+FRONTIER_FEEL.dash.duration;this.readyAt=now+FRONTIER_FEEL.dash.cooldown;
    this.specialUntil=now+(this.hero==='billy'?FRONTIER_FEEL.lawman.duration:FRONTIER_FEEL.quickdraw.duration);
    this.stationary=0;return true;
  }
  tick(now:number,delta:number,moving:boolean){this.now=now;this.stationary=moving||now<this.dashUntil?0:this.stationary+Math.max(0,Math.min(250,delta));if(now-this.lastKill>FRONTIER_FEEL.streak.window)this.streak=0;}
  movement(now:number,delta:number):{x:number;y:number}|undefined {
    const active=Math.max(0,Math.min(Math.max(0,delta),this.dashUntil-(now-Math.max(0,delta))));
    if(!active)return undefined;
    const distance=FRONTIER_FEEL.dash.distance*active/FRONTIER_FEEL.dash.duration;
    return{x:this.dashX*distance,y:this.dashY*distance};
  }
  kill(now:number):boolean {
    this.now=now;if(now-this.lastKill>FRONTIER_FEEL.streak.window)this.streak=0;this.lastKill=now;this.streak=Math.min(FRONTIER_FEEL.streak.kills,this.streak+1);
    if(this.streak<FRONTIER_FEEL.streak.kills||now<this.hotReady)return false;
    this.hotUntil=now+FRONTIER_FEEL.streak.duration;this.hotReady=now+FRONTIER_FEEL.streak.cooldown;this.streak=0;return true;
  }
  damaged(){this.streak=0;this.lastKill=-Infinity;this.stationary=0;}
  get damage(){return this.hero==='bob'&&this.stationary>=FRONTIER_FEEL.focus.delay?FRONTIER_FEEL.focus.damage:1;}
  get crit(){return this.hero==='billy'&&this.now<this.specialUntil?FRONTIER_FEEL.lawman.crit:0;}
  get fireRate(){return Math.min(1.3,(this.hero==='steve'&&this.now<this.specialUntil?FRONTIER_FEEL.quickdraw.fireRate:1)*(this.now<this.hotUntil?FRONTIER_FEEL.streak.fireRate:1));}
  get chain(){return this.streak;}
  get streakCooldown(){return Math.max(0,this.hotReady-this.now);}
  get hot(){return this.now<this.hotUntil;}
  get ready(){return Math.max(0,this.readyAt-this.now);}
  get dashAge(){return this.now-(this.dashUntil-FRONTIER_FEEL.dash.duration);}
  get active(){return this.now<this.dashUntil;}
  get traitActive(){return this.damage>1||this.crit>0||this.hero==='steve'&&this.now<this.specialUntil||this.hero==='cormano'&&this.active;}
}
export function evolutionTrail(weapons:ReadonlyMap<string,number>,passives:ReadonlyMap<string,number>):string {
  const route=WEAPON_EVOLUTIONS.find(e=>(weapons.get(e.baseWeaponId)??0)>0&&!weapons.has(e.evolvedWeaponId));
  if(!route)return 'BUILD YOUR FRONTIER LEGEND';
  const weapon=weapons.get(route.baseWeaponId)??0,passive=passives.get(route.requiredPassiveId)??0;
  return `${route.name.toUpperCase()} · WEAPON ${weapon}/5 + ${route.requiredPassiveId.toUpperCase()} ${passive>0?'READY':'NEEDED'} · 4:00+`;
}
