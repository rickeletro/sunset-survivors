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
  private enabled = false;
  private hover = false;
  constructor(scene: Phaser.Scene, readonly portal: BuildingPortal, label: string, enter: () => void) {
    const f = portal.facade, z = worldDepth(f.y);
    this.facade = scene.add.image(f.x, f.y, f.texture).setOrigin(0.5, 1).setDepth(z + 0.03)
      .setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
      .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 64 });
    this.light = scene.add.image(portal.aperture.x, portal.aperture.y, 'wm_glow').setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.65).setDepth(z + 0.05).setVisible(false);
    const style = { fontFamily: THEME.typography.pixelFont, fontSize: '10px', color: '#ffc52a',
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
    this.name.setVisible(distance < 800);
    this.facade.setVisible(ready).setAlpha((this.hover ? 0.30 : 0.13) + Math.sin(time * 0.007) * 0.05)
      .setScale(1 + Math.sin(time * 0.007) * 0.006);
    this.light.setVisible(ready).setAlpha(0.45 + Math.sin(time * 0.009) * 0.15);
    this.caption.setVisible(distance < 240 && !blocked).setText(used ? 'VISITA ENCERRADA' : ready
      ? 'CLIQUE / TOQUE NO PREDIO\nENTRAR  •  [E] TAMBEM FUNCIONA' : 'APROXIME-SE DA PORTA');
  }
  destroy(): void {
    this.facade.destroy(); this.light.destroy(); this.caption.destroy(); this.name.destroy();
  }
}
