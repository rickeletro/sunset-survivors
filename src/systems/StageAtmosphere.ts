import { ambientSpawn, brushSpawn } from '../data/atmosphereEmission';
import { GroundShadow } from './GroundShadow';
import type Phaser from 'phaser';
import { atmosphereFor } from '../data/stageAtmosphere';
import type { StageTheme } from '../data/stages';

/** One bounded emitter, following the camera area; no fullscreen postprocessing. */
export class StageAtmosphere {
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private tumbleweeds?: Phaser.GameObjects.Particles.ParticleEmitter;
  private shadow: GroundShadow;
  constructor(scene: Phaser.Scene, theme: StageTheme, actor: Phaser.GameObjects.Sprite) {
    const look = atmosphereFor(theme);
    this.emitter = scene.add.particles(0, 0, look.embers ? 'stage_ember' : 'stage_dust', {
      frequency: look.frequency, lifespan: { min: 2400, max: 4600 },
      maxParticles: look.maxParticles, quantity: 1,
      emitZone: { source: { getRandomPoint: point => ambientSpawn(point, 1500, 860) } },
      speedX: { min: look.wind * 0.5, max: look.wind * 1.6 },
      speedY: look.embers ? { min: -38, max: -16 } : { min: -9, max: 3 },
      scale: { start: look.embers ? 1.25 : 1, end: 0.4 },
      alpha: { start: look.alpha, end: 0 }, tint: look.tint,
    }).setDepth(18);
    this.emitter.startFollow(actor);
    this.emitter.emitParticle(look.indoor ? 4 : 16);
    if (!look.indoor && scene.textures.exists('decor_sagebrush')) {
      this.tumbleweeds = scene.add.particles(0, 0, 'decor_sagebrush', {
        emitZone: { source: { getRandomPoint: point => brushSpawn(point) } }, frequency: 4500, lifespan: 13000,
        maxParticles: 3, quantity: 1, speedX: { min: 65, max: 90 }, speedY: 6,
        rotate: { start: 0, end: 720 }, scale: 1, alpha: { start: 0.9, end: 0.15 },
      }).setDepth(2);
      this.tumbleweeds.startFollow(actor);
      this.tumbleweeds.emitParticle(1);
    }
    this.shadow = new GroundShadow(scene, actor, look.indoor);
    scene.events.once('shutdown', () => { this.emitter.destroy(); this.tumbleweeds?.destroy(); this.shadow.destroy(); });
  }
  update(): void {
    this.shadow.update();
  }
}
