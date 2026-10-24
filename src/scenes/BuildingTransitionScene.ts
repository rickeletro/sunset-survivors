import Phaser from 'phaser';
import type { BuildingPortal } from '../data/buildingPortal';
import { buildingMotion, buildingZoom, BUILDING_FADE_MS } from '../systems/BuildingMotion';
import type { PortalPoint } from '../systems/BuildingPath';
import { pickDirection, pixellabAnimKey } from '../systems/PixellabHeroes';
import { worldDepth } from '../data/scenery';
import { sounds } from '../audio/SoundManager';

export interface BuildingTransitionData {
  mode: 'enter' | 'exit';
  path: PortalPoint[];
  portal: BuildingPortal;
  camera: { scrollX: number; scrollY: number; zoom: number };
  actor: { texture: string; frame: string | number; scaleX: number; scaleY: number; hero: string; pixellab: boolean };
  onZoom?: (zoom: number) => void;
  onPosition: (p: PortalPoint, dx: number, dy: number) => void;
  onComplete: () => void;
  onCancel: () => void;
}

/** Presentation-only scene: its clock runs while the complete gameplay scene is frozen. */
export class BuildingTransitionScene extends Phaser.Scene {
  private config!: BuildingTransitionData;
  private age = 0;
  private finished = false;
  private fading = false;
  private actor!: Phaser.GameObjects.Sprite;
  private glow!: Phaser.GameObjects.Image;
  private leaves: Phaser.GameObjects.Image[] = [];
  private doorway!: Phaser.GameObjects.Graphics;
  private dust: Phaser.GameObjects.Graphics[] = [];
  constructor() { super('BuildingTransitionScene'); }
  init(data: BuildingTransitionData) { this.config = data; this.age = 0; this.finished = false; this.fading = false; this.dust = []; this.leaves = []; }
  create() {
    const d = this.config, f = d.portal.facade, aperture = d.portal.aperture;
    this.cameras.main.setScroll(d.camera.scrollX, d.camera.scrollY).setZoom(d.camera.zoom);
    // A copy of the existing facade correctly occludes the walking double behind it.
    this.add.image(f.x, f.y, f.texture, '__BASE').setOrigin(0.5, 1).setScale(f.scale ?? 1).setDepth(worldDepth(f.y));
    this.glow = this.add.image(aperture.x, aperture.y, 'wm_glow').setBlendMode(Phaser.BlendModes.ADD).setDepth(20).setScale(1.2);
    this.doorway = this.add.graphics().fillStyle(0x120b08).setDepth(worldDepth(f.y) + 0.01);
    const texture = this.textures.get(f.texture);
    d.portal.leaves?.forEach((cut, i) => {
      const name = `portal-leaf-${i}-${cut.x}-${cut.y}-${cut.width}-${cut.height}`;
      if (!texture.has(name)) texture.add(name, 0, cut.x, cut.y, cut.width, cut.height);
      const x = f.x - f.width / 2 + cut.x, y = f.y - f.height + cut.y;
      this.doorway.fillRect(x, y, cut.width, cut.height);
      this.leaves.push(this.add.image(x + (i ? cut.width : 0), y, f.texture, name).setOrigin(i ? 1 : 0, 0).setDepth(22));
    });
    // Adding leaf frames changes Phaser's default frame; this texture is a facade, not an atlas.
    texture.firstFrame = '__BASE';
    const first = d.path[0];
    this.actor = this.add.sprite(first.x, first.y, d.actor.texture, d.actor.frame);
    for (let i = 0; i < 10; i++) {
      const mote = this.add.graphics().fillStyle(i % 2 ? 0xf2d49a : 0xffc52a).fillRect(-1, -1, 2, 2).setDepth(23);
      this.dust.push(mote);
    }
    if (d.mode === 'exit') this.cameras.main.fadeIn(BUILDING_FADE_MS, 18, 11, 8);
    sounds.playReload();
    this.events.once('shutdown', () => { if (!this.finished) { this.finished = true; d.onZoom?.(d.camera.zoom); d.onCancel(); } });
    this.update(0, 0);
  }
  update(_time: number, delta: number): void {
    if (this.finished || !this.actor) return;
    this.age += delta;
    const d = this.config, frame = buildingMotion(d.path, d.portal.aperture, d.mode, this.age);
    const zoom = d.camera.zoom * buildingZoom(this.age, frame.totalMs);
    this.cameras.main.setZoom(zoom); d.onZoom?.(zoom);
    this.actor.setPosition(frame.visual.x, frame.visual.y).setAlpha(frame.alpha)
      .setScale(d.actor.scaleX * frame.scale, d.actor.scaleY * frame.scale).setDepth(worldDepth(frame.physical.y) + 0.02);
    if (d.actor.pixellab) {
      const choice = pickDirection(d.actor.hero, frame.visual.dx, frame.visual.dy);
      this.actor.setFlipX(choice.flipX).play(pixellabAnimKey(d.actor.hero, choice.dir), true);
    } else this.actor.setFlipX(frame.visual.dx < 0);
    d.onPosition(frame.physical, frame.visual.dx, frame.visual.dy);
    this.leaves.forEach(leaf => leaf.setScale(1 - frame.doorOpen * 0.85, 1));
    this.doorway.setAlpha(frame.doorOpen);
    this.glow.setAlpha(0.3 + frame.doorOpen * 0.5 + Math.sin(this.age * 0.015) * 0.08);
    this.dust.forEach((mote, i) => {
      const life = (this.age + i * 83) % 650 / 650;
      mote.setPosition(d.portal.threshold.x + Math.sin(i * 2.4) * (10 + life * 24), d.portal.threshold.y - life * (8 + i * 2))
        .setAlpha((1 - life) * 0.65);
    });
    if (frame.fading && !this.fading) {
      this.fading = true;
      this.cameras.main.fadeOut(Math.max(1, frame.totalMs - this.age), 18, 11, 8);
    }
    if (frame.done) {
      this.finished = true;
      this.scene.stop('BuildingTransitionScene');
      d.onComplete();
    }
  }
}
