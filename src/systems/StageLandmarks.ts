import { GroundShadow } from './GroundShadow';
import Phaser from 'phaser';
import { sceneryChaseTarget, entersFootprint } from './SceneryNavigation';
import type { PortalPoint } from './BuildingPath';
import type { StageTheme } from '../data/stages';
import { footprint, overlapsFootprint, resolveFootprint, SCENERY, sceneryScale, sceneryKey, stageLandmarks, worldDepth, type Footprint, type Landmark } from '../data/scenery';
import { worldScaleFor } from './WorldScale';

interface SceneryInstance {
  image: Phaser.GameObjects.Image;
  shadow?: GroundShadow;
  glow?: Phaser.GameObjects.Image;
  pole?: Phaser.GameObjects.Image;
  poleGlow?: Phaser.GameObjects.Image;
  track?: Phaser.GameObjects.TileSprite;
  smoke?: Phaser.GameObjects.Particles.ParticleEmitter;
}
function dispose(instance: SceneryInstance): void {
  instance.shadow?.destroy();
  instance.pole?.destroy();
  instance.poleGlow?.destroy();
  instance.smoke?.destroy();
  instance.track?.destroy();
  instance.glow?.destroy();
  instance.image.destroy();
}

/** Chunk-distance lifetime for independent scenery sprites; no per-prop timers or colliders. */
export class StageLandmarks {
  readonly placements: readonly Landmark[];
  private readonly boxes: readonly Footprint[];
  private active = new Map<number, SceneryInstance>();
  constructor(private scene: Phaser.Scene, private theme: StageTheme) {
    this.placements = stageLandmarks(theme);
    this.boxes = this.placements.map(footprint);
    scene.events.once('shutdown', () => this.destroy());
  }
  chaseTarget(x: number, y: number, targetX: number, targetY: number, radius: number): { x: number; y: number } {
    return sceneryChaseTarget(this.boxes, { x, y }, { x: targetX, y: targetY }, radius);
  }
  reserved(x: number, y: number, radius: number): boolean {
    return this.placements.some(prop => overlapsFootprint(footprint(prop), x, y, radius + 35));
  }
  entrySegmentClear(a: PortalPoint, b: PortalPoint, radius: number): boolean {
    return !this.boxes.some(box => entersFootprint({ ...box,
      halfWidth: box.halfWidth + radius, halfHeight: box.halfHeight + radius }, a, b));
  }
  resolve(x: number, y: number, radius: number): { x: number; y: number } {
    for (const prop of this.placements) {
      const box = footprint(prop);
      if (Math.abs(x - box.x) > box.halfWidth + radius || Math.abs(y - box.y) > box.halfHeight + radius) continue;
      ({ x, y } = resolveFootprint(box, x, y, radius));
    }
    return { x, y };
  }
  update(px: number, py: number, time: number): void {
    this.placements.forEach((prop, index) => {
      const near = Math.abs(prop.x - px) < 1800 && Math.abs(prop.y - py) < 1800;
      let entry = this.active.get(index);
      if (!near) {
        if (entry) dispose(entry);
        this.active.delete(index);
        return;
      }
      if (!entry) {
        const key = sceneryKey(prop.kind);
        if (!this.scene.textures.exists(key)) return;
        const image = this.scene.add.image(prop.x, prop.y, key, '__BASE').setOrigin(0.5, 1).setScale(worldScaleFor(this.scene, key, sceneryScale(prop.kind)));
        const shadow = new GroundShadow(this.scene, image, ['saloon', 'caboose', 'manor'].includes(this.theme));
        const glow = SCENERY[prop.kind].light
          ? this.scene.add.image(prop.x, prop.y - 52, 'wm_glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(17)
          : undefined;
        const rollingStock = ['locomotive', 'cargo-wagon', 'passenger-wagon'].includes(prop.kind);
        const track = rollingStock
          ? this.scene.add.tileSprite(prop.x, prop.y - 24, 256, 128, 'wm_rails').setDepth(-3)
          : undefined;
        const smoke = prop.kind === 'locomotive'
          ? this.scene.add.particles(prop.x + 70, prop.y - 105, 'stage_dust', {
            lifespan: 2200, frequency: 500, quantity: 1, maxParticles: 8,
            speedX: { min: -12, max: -6 }, speedY: { min: -24, max: -14 },
            scale: { start: 1.5, end: 4 }, alpha: { start: 0.45, end: 0 }, tint: 0xf2d49a,
          }).setDepth(16)
          : undefined;
        image.setDepth(worldDepth(prop.y));
        // Street lighting belongs to facades, never randomly scattered through the wilderness.
        const litFacade = ['house', 'saloon', 'sheriff', 'general-store', 'frontier-saloon', 'gallery-saloon', 'hacienda', 'manor', 'rail-station'].includes(prop.kind);
        const poleScale = 68.5 / 188; // Visible alpha bounds: one Steve tall, uniformly scaled.
        const poleX = prop.x + SCENERY[prop.kind].width * (image.scaleX ?? sceneryScale(prop.kind)) / 2 + 28;
        const poleY = prop.y - 20;
        const pole = litFacade && this.scene.textures.exists('wm_lantern')
          ? this.scene.add.image(poleX, poleY, 'wm_lantern').setOrigin(0.5, 1).setScale(poleScale).setDepth(worldDepth(poleY))
          : undefined;
        const poleGlow = pole
          ? this.scene.add.image(poleX + 6 * poleScale, poleY - 130 * poleScale, 'wm_glow').setScale(poleScale).setBlendMode(Phaser.BlendModes.ADD).setDepth(17)
          : undefined;
        entry = { image, shadow, glow, track, smoke, pole, poleGlow }; this.active.set(index, entry);
      }
      const native = SCENERY[prop.kind], scale = entry.image.scaleX ?? sceneryScale(prop.kind);
      const shape = { width: native.width * scale, height: native.height * scale };
      const behindFacade = Math.abs(px - prop.x) < shape.width / 2 && py < prop.y && py > prop.y - shape.height;
      entry.image.setAlpha(behindFacade ? 0.55 : 1);
      if (entry.pole) {
        const obscuresActor = Math.abs(px - entry.pole.x) < 30 && py < entry.pole.y && py > entry.pole.y - shape.height;
        entry.pole.setAlpha(obscuresActor ? 0.45 : 1);
      }
      entry.poleGlow?.setAlpha(0.30 + Math.sin(time * 0.004 + index * 2.7) * 0.06);
      entry.glow?.setAlpha(0.30 + Math.sin(time * 0.004 + index * 2.7) * 0.06);
    });
  }
  destroy(): void {
    for (const entry of this.active.values()) dispose(entry);
    this.active.clear();
  }
}
