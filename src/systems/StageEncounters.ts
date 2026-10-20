import type Phaser from 'phaser';
import { objectiveProgress, safeEventPoint, StageConfig, stagePhase } from '../data/stages';
import type { EnemyKind } from '../data/enemies';

export interface HazardShape { x: number; y: number; radius: number; width?: number; height?: number; }
export function insideHazard(shape: HazardShape, x: number, y: number): boolean {
  return shape.width !== undefined && shape.height !== undefined
    ? Math.abs(x - shape.x) <= shape.width / 2 && Math.abs(y - shape.y) <= shape.height / 2
    : Math.hypot(x - shape.x, y - shape.y) <= shape.radius;
}
interface Hazard extends HazardShape { age: number; warning: number; duration: number; damage: number; graphic: Phaser.GameObjects.Graphics; }
interface Supply { x: number; y: number; progress: number; age: number; marker: Phaser.GameObjects.Image; text: Phaser.GameObjects.Text; }
interface EncounterHooks {
  position: () => { x: number; y: number };
  damage: (amount: number) => void;
  spawn: (kind: EnemyKind, x: number, y: number) => void;
  reward: () => void;
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
  private lastPhase = '';
  constructor(private scene: Phaser.Scene, private stage: StageConfig, private hooks: EncounterHooks) {}
  tick(elapsed: number, bossActive: boolean): void {
    const phase = stagePhase(this.stage, elapsed);
    if (phase !== this.lastPhase) {
      this.lastPhase = phase;
      if (phase === 'respite') this.hooks.banner('RESPIRO — RECOLHA O SAQUE!', '#f2d49a');
      if (phase === 'surge') this.hooks.banner('A HORDA ESTA CHEGANDO!', '#ff791c');
      if (phase === 'last-stand') this.hooks.banner('ULTIMO MINUTO — O PROCURADO SE APROXIMA!', '#e52b20');
    }
    if (!bossActive && elapsed >= this.nextSupply && elapsed < this.stage.duration - 45) {
      this.nextSupply = elapsed + 150;
      this.createSupply();
    }
    if (!bossActive && elapsed >= this.nextHazard && phase !== 'respite') {
      this.nextHazard = elapsed + this.stage.hazardEvery;
      this.environmentalEvent();
    }
    if (bossActive) this.clearSupply();
  }
  private createSupply(): void {
    this.clearSupply();
    const p = this.hooks.position();
    const point = safeEventPoint(p.x, p.y, this.eventIndex++ * 2.4, 380);
    const clear = this.hooks.clearPoint(point.x, point.y);
    const marker = this.scene.add.image(clear.x, clear.y, 'wm_supply').setDepth(5);
    const text = this.scene.add.text(clear.x, clear.y - 55, 'PROVISOES\nFIQUE NO CIRCULO', { fontFamily: "'Press Start 2P', monospace", fontSize: '9px', color: '#ffc52a', stroke: '#120b08', strokeThickness: 3, align: 'center' }).setOrigin(0.5).setDepth(20);
    this.supply = { ...clear, progress: 0, age: 0, marker, text };
    this.hooks.banner(this.stage.objective, '#ffc52a');
    // Guarded objective: enter the camp, clear its guards, hold for 8 seconds.
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5;
      this.hooks.spawn(this.stage.signature, clear.x + Math.cos(a) * 160, clear.y + Math.sin(a) * 160);
    }
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
      if (h.age >= h.warning + h.duration) { h.graphic.destroy(); this.hazards.splice(i, 1); continue; }
      const active = h.age >= h.warning;
      h.graphic.clear().lineStyle(active ? 3 : 2, active ? 0xe52b20 : 0xffc52a, 0.95);
      h.graphic.fillStyle(active ? 0xe52b20 : 0xff791c, active ? 0.65 : 0.12 + Math.sin(h.age * 0.015) * 0.07);
      if (h.width !== undefined && h.height !== undefined) {
        h.graphic.fillRect(h.x - h.width / 2, h.y - h.height / 2, h.width, h.height);
        h.graphic.strokeRect(h.x - h.width / 2, h.y - h.height / 2, h.width, h.height);
        if (active && this.stage.hazard === 'train') {
          const trainX = h.x - 650 + (h.age - h.warning) / h.duration * 1300;
          h.graphic.fillStyle(0x120b08, 1).fillRect(trainX - 140, h.y - 34, 280, 68);
          h.graphic.fillStyle(0x603719, 1).fillRect(trainX - 130, h.y - 27, 240, 52);
          h.graphic.fillStyle(0xffc52a, 1).fillRect(trainX + 88, h.y - 20, 18, 40);
          h.graphic.fillStyle(0x88817a, 1);
          for (let wheel = -100; wheel < 110; wheel += 60) h.graphic.fillCircle(trainX + wheel, h.y + 30, 10);
        }
        // Railroad sleepers make the danger lane readable before the train passes.
        for (let x = -h.width / 2; x < h.width / 2; x += 48) h.graphic.fillRect(h.x + x, h.y - h.height / 2, 8, h.height);
      } else {
        h.graphic.fillCircle(h.x, h.y, h.radius);
        h.graphic.strokeCircle(h.x, h.y, h.radius * (active ? 1 : Math.min(1, h.age / h.warning)));
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
      s.progress = objectiveProgress(s.progress, inside && !contested, delta / 1000);
      s.text.setText(`${contested ? 'LIMPE A AREA' : 'PROVISOES'}\n${Math.floor(s.progress)} / 8s`);
      if (s.progress >= 8) { this.clearSupply(); this.hooks.reward(); this.hooks.banner('PROVISOES: XP + OURO + CURA!', '#ffc52a'); }
      else if (s.age >= 80000) { this.clearSupply(); this.hooks.banner('O COMBOIO PARTIU — NOVA CHANCE EM BREVE', '#f2d49a'); }
    }
  }
  objectiveHint(): string {
    if (!this.supply) return 'PROVISOES OPCIONAIS A CADA 2:30';
    const p = this.hooks.position(); const s = this.supply;
    const dx = s.x - p.x; const dy = s.y - p.y;
    const dir = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'LESTE' : 'OESTE' : dy > 0 ? 'SUL' : 'NORTE';
    return `PROVISOES ${dir} ${Math.round(Math.hypot(dx, dy))}m • ${Math.max(0, 80 - Math.floor(s.age / 1000))}s`;
  }
  private clearSupply(): void { this.supply?.marker.destroy(); this.supply?.text.destroy(); this.supply = undefined; }
  destroy(): void { this.clearSupply(); this.hazards.forEach(h => h.graphic.destroy()); this.hazards = []; }
}
