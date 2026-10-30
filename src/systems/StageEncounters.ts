import { FRONTIER_FEEL } from '../data/gunslingerStyle';
import {
  compassRoseStarPoints,
  ISOMETRIC_PLANE,
  isometricEllipse,
  supplyCampDiorama,
} from '../data/isometricWorld';
import { waveAt, wavePool, MAIN_BOSS_AT } from '../data/waves';
import { sceneryKey, worldDepth } from '../data/scenery';
import { THEME } from '../ui/theme/tokens';
import type Phaser from 'phaser';
import { objectiveProgress, safeEventPoint, StageConfig } from '../data/stages';
import type { EnemyKind } from '../data/enemies';
import { t } from '../i18n';

export interface HazardShape { x: number; y: number; radius: number; width?: number; height?: number; }
export function insideHazard(shape: HazardShape, x: number, y: number): boolean {
  return shape.width !== undefined && shape.height !== undefined
    ? Math.abs(x - shape.x) <= shape.width / 2 && Math.abs(y - shape.y) <= shape.height / 2
    : Math.hypot(x - shape.x, y - shape.y) <= shape.radius;
}
interface Hazard extends HazardShape { age: number; warning: number; duration: number; damage: number; graphic: Phaser.GameObjects.Graphics; train?: Phaser.GameObjects.Image; }
interface Supply { contract?:boolean; deadline?:number; x: number; y: number; progress: number; age: number; ring: Phaser.GameObjects.Graphics; marker: Phaser.GameObjects.Image; bannerIcon?: Phaser.GameObjects.Image; diorama?: Phaser.GameObjects.Image[]; text: Phaser.GameObjects.Text; }
interface EncounterHooks {
  position: () => { x: number; y: number };
  damage: (amount: number) => void;
  spawn: (kind: EnemyKind, x: number, y: number) => void;
  reward: (contract?:boolean) => void;
  banner: (message: string, color: string) => void;
  contested: (x: number, y: number) => boolean;
  clearPoint: (x: number, y: number) => { x: number; y: number };
}

/** Scene-clock driven hazards and optional supply objectives; paused with gameplay. */
export class StageEncounters {
  private hazards: Hazard[] = [];
  private supply?: Supply;
  private nextHazard = 55;
  private nextSupply = 90;
  private eventIndex = 0;
  private midWaveEventFired = false;
  private highStakesUsed=false;
  constructor(private scene: Phaser.Scene, private stage: StageConfig, private hooks: EncounterHooks) {}
  tick(elapsed: number, bossActive: boolean): void {
    if (!bossActive && elapsed >= this.nextSupply && elapsed < MAIN_BOSS_AT - 45) {
      this.nextSupply = elapsed + 150;
      this.createSupply(elapsed);
    }
    if (!bossActive && !this.midWaveEventFired && elapsed >= 420 && elapsed < 480) {
      this.midWaveEventFired = true;
      this.environmentalEvent();
      this.nextHazard = elapsed + this.stage.hazardEvery;
    }
    if (!bossActive && waveAt(elapsed).id >= 3 && elapsed >= this.nextHazard) {
      this.nextHazard = elapsed + this.stage.hazardEvery;
      this.environmentalEvent();
    }
    if (bossActive) this.clearSupply();
  }
  private createSupply(elapsed: number): void {
    this.clearSupply();
    const p = this.hooks.position();
    const point = safeEventPoint(p.x, p.y, this.eventIndex++ * 2.4, 380);
    const clear = this.hooks.clearPoint(point.x, point.y);
    const ring = this.scene.add.graphics().setDepth(4);
    const chestKey = this.scene.textures?.exists?.('chest_closed') ? 'chest_closed' : 'wm_supply';
    const marker = this.scene.add.image(clear.x, clear.y - 6, chestKey).setDepth(worldDepth(clear.y));
    const diorama: Phaser.GameObjects.Image[] = [];
    let bannerIcon: Phaser.GameObjects.Image | undefined;
    if (this.scene.textures?.exists?.('iso_barrel_lantern')) {
      for (const prop of supplyCampDiorama(clear.x, clear.y)) {
        if (!this.scene.textures.exists(prop.key)) continue;
        const img = this.scene.add
          .image(prop.x, prop.y, prop.key)
          .setOrigin(0.5, 0.92)
          .setScale(prop.scale)
          .setFlipX(!!prop.flipX)
          .setDepth(worldDepth(prop.y));
        diorama.push(img);
        if (prop.lit && this.scene.textures.exists('wm_glow')) {
          const halo = this.scene.add
            .image(prop.x, prop.y - 42 * prop.scale, 'wm_glow')
            .setScale(1.25)
            .setDepth(17);
          diorama.push(halo);
        }
      }
      if (this.scene.textures.exists('chest_closed')) {
        bannerIcon = this.scene.add
          .image(clear.x - 96, clear.y - 78, 'chest_closed')
          .setScale(0.45)
          .setDepth(20);
      }
    }
    const text = this.scene.add.text(clear.x + (bannerIcon ? 14 : 0), clear.y - 78, 'SUPPLIES\nSTAY IN THE CIRCLE', { fontFamily: THEME.typography.pixelFont, fontSize: '9px', color: '#ffc52a', stroke: '#120b08', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setDepth(20);
    this.supply = { ...clear, progress: 0, age: 0, ring, marker, bannerIcon, diorama, text };
    marker.setInteractive({useHandCursor:true}).on('pointerdown',()=>this.acceptContract());
    this.hooks.banner(this.stage.objective, '#ffc52a');
    // Guarded objective: enter the camp, clear its guards, hold for 8 seconds.
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      const guard = wavePool(elapsed, this.stage.enemies).some(e => e.kind === this.stage.signature) ? this.stage.signature : 'bandit';
      this.hooks.spawn(guard, clear.x + Math.cos(a) * 160, clear.y + Math.sin(a) * 160);
    }
  }
  /** Optional, once per phase: more guards and a 25s deadline buy an extra upgrade choice. */
  acceptContract():boolean {
    const s=this.supply,p=this.hooks.position();
    if(!s||s.contract||this.highStakesUsed||s.progress>=8||Math.hypot(s.x-p.x,s.y-p.y)>FRONTIER_FEEL.contract.range)return false;
    this.highStakesUsed=true;s.contract=true;s.progress=0;s.deadline=s.age+FRONTIER_FEEL.contract.duration;
    for(let i=0;i<FRONTIER_FEEL.contract.extraGuards;i++){
      const angle=i*Math.PI*2/FRONTIER_FEEL.contract.extraGuards;
      this.hooks.spawn('knife_bandit',s.x+Math.cos(angle)*130,s.y+Math.sin(angle)*130);
    }
    this.hooks.banner('HIGH STAKES: CLEAR + HOLD IN 25s · EXTRA UPGRADE', '#ff791c');
    return true;
  }
  private environmentalEvent(): void {
    const p = this.hooks.position();
    const index = this.eventIndex++;
    this.hooks.banner(this.stage.hazardLabel, '#ff791c');
    switch (this.stage.hazard) {
      case 'stampede': {
        // Leave both ends open; charging animals can also be killed for XP.
        for (let i = 0; i < 5; i++) this.hooks.spawn('longhorn', Math.max(80, p.x - 560), Math.max(80, Math.min(7920, p.y - 160 + i * 80)));
        break;
      }
      case 'train':
        this.warn({ x: p.x, y: 4000 + Math.round((p.y - 4000) / 640) * 640, radius: 0, width: 1200, height: 80 }, 2400, 1300, 35); break;
      case 'crossfire':
      case 'volley':
        this.warn({ x: p.x, y: p.y, radius: 0, width: index % 2 ? 90 : 1100, height: index % 2 ? 1100 : 90 }, 2200, 500, 24); break;
      default: {
        const count = this.stage.hazard === 'powder' ? 4 : this.stage.hazard === 'artillery' ? 6 : 5;
        for (let i = 0; i < count; i++) {
          const angle = i * 2.399;
          const point = safeEventPoint(p.x, p.y, angle, i === 0 ? 0 : 110 + i * 45);
          this.warn({ ...point, radius: this.stage.hazard === 'rockfall' ? 48 : 62 }, 1800 + i * 180, this.stage.hazard === 'fire' ? 6500 : 750, 22);
        }
      }
    }
  }
  warn(shape: HazardShape, warning: number, duration: number, damage: number): void {
    if (this.hazards.length >= 36) return;
    this.hazards.push({ ...shape, warning, duration, damage, age: 0, graphic: this.scene.add.graphics().setDepth(2) });
  }
  update(delta: number): void {
    const p = this.hooks.position();
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.age += delta;
      if (h.age >= h.warning + h.duration) { h.train?.destroy(); h.graphic.destroy(); this.hazards.splice(i, 1); continue; }
      const active = h.age >= h.warning;
      h.graphic.clear().lineStyle(active ? 3 : 2, active ? 0xe52b20 : 0xffc52a, 0.95);
      h.graphic.fillStyle(active ? 0xe52b20 : 0xff791c, active ? 0.65 : 0.12 + Math.sin(h.age * 0.015) * 0.07);
      if (h.width !== undefined && h.height !== undefined) {
        h.graphic.fillRect(h.x - h.width / 2, h.y - h.height / 2, h.width, h.height);
        h.graphic.strokeRect(h.x - h.width / 2, h.y - h.height / 2, h.width, h.height);
        if (active && this.stage.hazard === 'train') {
          const trainX = h.x - 650 + (h.age - h.warning) / h.duration * 1300;
          if (!h.train && this.scene.textures?.exists(sceneryKey('locomotive'))) {
            h.train = this.scene.add.image(trainX, h.y + 48, sceneryKey('locomotive')).setOrigin(0.5, 1).setDepth(worldDepth(h.y + 40));
          }
          h.train?.setPosition(trainX, h.y + 48);
        }
        // Railroad sleepers make the danger lane readable before the train passes.
        for (let x = -h.width / 2; x < h.width / 2; x += 48) h.graphic.fillRect(h.x + x, h.y - h.height / 2, 8, h.height);
      } else {
        const outer = isometricEllipse(h.radius);
        const progR = h.radius * (active ? 1 : Math.min(1, h.age / h.warning));
        const inner = isometricEllipse(progR);
        h.graphic.fillEllipse(h.x, h.y, outer.width, outer.height);
        h.graphic.strokeEllipse(h.x, h.y, inner.width, inner.height);
      }
      const hitShape = this.stage.hazard === 'train' && h.width !== undefined ? {
        x: h.x - 650 + (h.age - h.warning) / h.duration * 1300, y: h.y, radius: 0, width: 280, height: 80,
      } : h;
      if (active && insideHazard(hitShape, p.x, p.y)) this.hooks.damage(h.damage);
    }
    const s = this.supply;
    if (s) {
      s.age += delta;
      const inside = Math.hypot(p.x - s.x, p.y - s.y) <= 80;
      const contested = this.hooks.contested(s.x, s.y);
      const charging = inside && !contested;
      s.progress = objectiveProgress(s.progress, charging, delta / 1000);
      const ratio = Math.min(1, s.progress / 8);
      const ell = isometricEllipse(80);
      const innerEll = isometricEllipse(73);
      s.ring.clear()
        .lineStyle(charging ? 4 : 2.5, charging ? 0xffc52a : (contested ? 0xe52b20 : 0xff791c), charging ? 0.98 : 0.72)
        .fillStyle(charging ? 0xffc52a : 0xff791c, charging ? 0.18 + ratio * 0.18 : 0.09)
        .fillEllipse(s.x, s.y, ell.width, ell.height)
        .strokeEllipse(s.x, s.y, ell.width, ell.height)
        .lineStyle(1.5, 0xffc52a, charging ? 0.75 : 0.4)
        .strokeEllipse(s.x, s.y, innerEll.width, innerEll.height);

      // Isometric 8-Point Compass Rose etched in gold on the floorboards inside the circle
      const rosePoints = compassRoseStarPoints(s.x, s.y + 4, 46, 17);
      s.ring.fillStyle(0xffc52a, charging ? 0.38 + ratio * 0.25 : 0.22);
      s.ring.lineStyle(1.5, 0xffc52a, charging ? 0.85 : 0.48);
      s.ring.beginPath().moveTo(rosePoints[0].x, rosePoints[0].y);
      for (let idx = 1; idx < rosePoints.length; idx++) {
        s.ring.lineTo(rosePoints[idx].x, rosePoints[idx].y);
      }
      s.ring.closePath().fillPath().strokePath();
      s.ring.fillStyle(0xff791c, charging ? 0.5 : 0.28).fillEllipse(s.x, s.y + 4, 24, 14);

      // Chamfered dark-wood & gold floating banner plaque above the chest
      s.ring.fillStyle(0x120b08, 0.92).fillRoundedRect(s.x - 126, s.y - 104, 252, 52, 6);
      s.ring.lineStyle(2, 0xffc52a, 0.92).strokeRoundedRect(s.x - 124, s.y - 102, 248, 48, 5);

      if (ratio > 0) {
        s.ring.lineStyle(4, 0xffc52a, 0.98).beginPath();
        const steps = Math.max(4, Math.ceil(ratio * 28));
        for (let step = 0; step <= steps; step++) {
          const a = -Math.PI / 2 + (step / steps) * ratio * Math.PI * 2;
          const pxArc = s.x + Math.cos(a) * 76;
          const pyArc = s.y + Math.sin(a) * 76 * ISOMETRIC_PLANE.ellipseRatio;
          if (step === 0) s.ring.moveTo(pxArc, pyArc);
          else s.ring.lineTo(pxArc, pyArc);
        }
        s.ring.strokePath();
      }
      if (charging) {
        s.ring.fillStyle(0xffc52a, 0.92);
        for (let k = 0; k < 6; k++) {
          const sparkAngle = s.age * 0.004 + k * (Math.PI / 3);
          const sparkDist = 24 + ((s.age * 0.04 + k * 11) % 44);
          s.ring.fillCircle(
            s.x + Math.cos(sparkAngle) * sparkDist,
            s.y + Math.sin(sparkAngle) * sparkDist * ISOMETRIC_PLANE.ellipseRatio - ratio * 12,
            2.5,
          );
        }
        s.marker.setAngle(Math.sin(s.age / 35) * (2.5 + ratio * 5)).setScale(1 + Math.sin(s.age / 55) * (0.04 + ratio * 0.06));
      } else {
        s.marker.setAngle(0).setScale(1);
      }
      s.marker.setAlpha(.86+Math.sin(s.age/300)*.14);
      const header = contested ? 'CLEAR THE AREA' : (charging ? 'STAY IN THE CIRCLE TO OPEN THE CHEST!' : 'SUPPLIES');
      s.text.setText(s.contract?`HIGH STAKES · ${Math.max(0,Math.ceil(((s.deadline??0)-s.age)/1000))}s\n${contested?'CLEAR THE AREA':`${Math.floor(s.progress)} / 8s`}`:`${header}\n${Math.floor(s.progress)} / 8s${!this.highStakesUsed?'\n[F] / CLICK: +4 GUARDS · 25s\nWIN: EXTRA UPGRADE':''}`);
      if(s.contract&&s.age>(s.deadline??0)){this.clearSupply();this.hooks.banner('CONTRACT LOST · THE SUPPLIES ARE GONE', '#e52b20');}
      else if (s.progress >= 8) { const contract=s.contract;this.clearSupply();if(contract)this.hooks.reward(true);else this.hooks.reward(); this.hooks.banner(contract?'CONTRACT WON · EXTRA UPGRADE!':'SUPPLIES: XP + GOLD + HEAL!', '#ffc52a'); }
      else if (s.age >= 80000) { this.clearSupply(); this.hooks.banner('THE WAGON HAS LEFT — ANOTHER CHANCE SOON', '#f2d49a'); }
    }
  }
  get objectivePoint():Readonly<Pick<Supply,'x'|'y'|'contract'>>|undefined{return this.supply;}
  objectiveHint(): string {
    if (!this.supply) return t('combat.optionalSupplies');
    const p = this.hooks.position(); const s = this.supply;
    const dx = s.x - p.x; const dy = s.y - p.y;
    const dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'EAST' : 'WEST' : dy > 0 ? 'SOUTH' : 'NORTH';
    const remaining=s.contract?Math.max(0,Math.ceil(((s.deadline??0)-s.age)/1000)):Math.max(0,80-Math.floor(s.age/1000));
    const dist = Math.round(Math.hypot(dx, dy));
    return s.contract
      ? t('combat.contractHint', { dir, dist, remaining })
      : t('combat.suppliesHint', { dir, dist, remaining });
  }
  private clearSupply(): void {
    this.supply?.ring.destroy();
    this.supply?.marker.destroy();
    this.supply?.bannerIcon?.destroy();
    this.supply?.diorama?.forEach(img => img.destroy());
    this.supply?.text.destroy();
    this.supply = undefined;
  }
  destroy(): void { this.clearSupply(); this.hazards.forEach(h => { h.train?.destroy(); h.graphic.destroy(); }); this.hazards = []; }
}
