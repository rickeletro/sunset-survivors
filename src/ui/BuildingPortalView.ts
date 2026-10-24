import { portalPulse } from '../data/stageAtmosphere';
import Phaser from 'phaser';
import type { BuildingPortal } from '../data/buildingPortal';
import { THEME } from './theme/tokens';
import { worldDepth } from '../data/scenery';

/** World-space, pixel-perfect facade input; Phaser performs camera/zoom pointer conversion. */
export class BuildingPortalView {
  private facade: Phaser.GameObjects.Image;
  private light: Phaser.GameObjects.Image;
  private caption: Phaser.GameObjects.Text;
  private name: Phaser.GameObjects.Text;
  private activity: Phaser.GameObjects.Image;
  private enabled = false;
  private hover = false;
  constructor(scene: Phaser.Scene, readonly portal: BuildingPortal, label: string, enter: () => void) {
    this.activity = scene.add.image(portal.threshold.x, portal.threshold.y + 35, 'stage_activity')
      .setDepth(2).setBlendMode(Phaser.BlendModes.ADD);
    const f = portal.facade, z = worldDepth(f.y);
    this.facade = scene.add.image(f.x, f.y, f.texture, '__BASE').setOrigin(0.5, 1).setScale(f.scale ?? 1).setDepth(z + 0.03)
      .setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
      .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 64 });
    this.light = scene.add.image(portal.aperture.x, portal.aperture.y, 'wm_glow').setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.65).setDepth(z + 0.05).setVisible(false);
    const style = { fontFamily: THEME.typography.pixelFont, fontSize: '14px', color: '#ffc52a',
      stroke: '#120b08', strokeThickness: 4, align: 'center', lineSpacing: 5 };
    this.name = scene.add.text(f.x, f.y - f.height - 16, label, style).setOrigin(0.5).setDepth(18).setVisible(false);
    // Keep the callout beside the facade, clear of the actor's feet at the door.
    this.caption = scene.add.text(f.x + f.width / 2 + 150, f.y - 90, '', style).setOrigin(0.5).setDepth(18).setVisible(false);
    this.facade.on('pointerover', () => { this.hover = true; });
    this.facade.on('pointerout', () => { this.hover = false; });
    this.facade.on('pointerdown', (_p: unknown, _x: unknown, _y: unknown, event: Phaser.Types.Input.EventData) => {
      if (!this.enabled) return;
      event.stopPropagation(); enter();
    });
  }
  update(distance: number, ready: boolean, used: boolean, time: number, blocked = false): void {
    this.enabled = ready;
    const pulse = portalPulse(time);
    this.activity.setVisible(!used && !blocked && distance < 1000).setAlpha(pulse.alpha + (ready ? 0.30 : 0.16)).setScale(pulse.scale);
    this.name.setVisible(distance < 800);
    this.facade.setVisible(ready).setAlpha((this.hover ? 0.30 : 0.13) + Math.sin(time * 0.007) * 0.05)
      .setScale((this.portal.facade.scale ?? 1) * (1 + Math.sin(time * 0.007) * 0.006));
    this.light.setVisible(ready).setAlpha(0.45 + Math.sin(time * 0.009) * 0.15);
    this.caption.setVisible(distance < 240 && !blocked).setText(used ? 'VISIT COMPLETE' : ready
      ? 'CLICK / TAP THE BUILDING\nENTER  •  OR PRESS [E]' : 'APPROACH THE DOOR');
  }
  destroy(): void {
    this.activity.destroy(); this.facade.destroy(); this.light.destroy(); this.caption.destroy(); this.name.destroy();
  }
}
