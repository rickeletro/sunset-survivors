import Phaser from 'phaser';
import type { BuildingPortal } from '../data/buildingPortal';
import { THEME } from './theme/tokens';
import { worldDepth } from '../data/scenery';
import { buildingOutline } from './buildingOutline';

// Arcade glove, pointing down. Drawn once in whole pixels, animated as a single object.
const GLOVE = [
  '    #####    ',
  '   #.....#   ',
  '  #......### ',
  ' ##.........#',
  '#...........#',
  '#...........#',
  ' #..........#',
  '  ###.......#',
  '     #..#####',
  '     #..#    ',
  '     #..#    ',
  '     #..#    ',
  '     #..#    ',
  '      ##     ',
];

/** Proximity enables explicit facade/hand clicks, never automatic entry. */
export class BuildingPortalView {
  private facade: Phaser.GameObjects.Image;
  private outline: Phaser.GameObjects.Image;
  private light: Phaser.GameObjects.Image;
  private hand: Phaser.GameObjects.Graphics;
  private name: Phaser.GameObjects.Text;
  private enabled = false;
  private hover = false;
  constructor(scene: Phaser.Scene, readonly portal: BuildingPortal, label: string, enter: () => void) {
    const f = portal.facade, z = worldDepth(f.y), scale = f.scale ?? 1;
    const edge = buildingOutline(scene, f.texture, scale);
    this.outline = scene.add.image(f.x, f.y + edge.padding, edge.key).setOrigin(0.5, 1).setScale(scale)
      .setDepth(z + 0.02).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
    this.facade = scene.add.image(f.x, f.y, f.texture, '__BASE').setOrigin(0.5, 1).setScale(scale).setDepth(z + 0.03)
      .setBlendMode(Phaser.BlendModes.ADD).setVisible(false)
      .setInteractive({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 64 });
    this.light = scene.add.image(portal.aperture.x, portal.aperture.y, 'wm_glow').setBlendMode(Phaser.BlendModes.ADD)
      .setScale(0.65).setDepth(z + 0.05).setVisible(false);
    const style = { fontFamily: THEME.typography.pixelFont, fontSize: '14px', color: '#ffc52a',
      stroke: '#120b08', strokeThickness: 4, align: 'center', lineSpacing: 5 };
    this.name = scene.add.text(f.x, f.y - f.height - 16, label, style).setOrigin(0.5).setDepth(18).setVisible(false);
    this.hand = scene.add.graphics().setDepth(19).setVisible(false);
    GLOVE.forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel !== ' ') this.hand.fillStyle(pixel === '#' ? 0x120b08 : 0xf2d49a).fillRect((x - 6.5) * 3, (y - 14) * 3, 3, 3);
    }));
    this.hand.setInteractive(new Phaser.Geom.Rectangle(-25, -48, 50, 56), Phaser.Geom.Rectangle.Contains);
    this.hand.input!.cursor = 'pointer';
    const click = (_p: unknown, _x: unknown, _y: unknown, event: Phaser.Types.Input.EventData) => {
      if (!this.enabled) return;
      event.stopPropagation(); enter();
    };
    for (const target of [this.facade, this.hand]) {
      target.on('pointerover', () => { this.hover = true; });
      target.on('pointerout', () => { this.hover = false; });
      target.on('pointerdown', click);
    }
  }
  update(distance: number, ready: boolean, used: boolean, time: number, blocked = false): void {
    this.enabled = ready && !used && !blocked;
    const pulse = (Math.sin(time * 0.007) + 1) / 2;
    this.name.setVisible(distance < 800 && !blocked);
    this.outline.setVisible(this.enabled).setAlpha(this.hover ? 1 : 0.55 + pulse * 0.4);
    // Keep the original facade stationary and preserve its proportions.
    this.facade.setVisible(this.enabled).setAlpha(this.hover ? 0.12 : 0.04);
    this.light.setVisible(this.enabled).setAlpha(0.3 + pulse * 0.15);
    this.hand.setVisible(this.enabled).setPosition(this.portal.aperture.x,
      this.portal.aperture.y - 16 - Math.round(pulse * 12));
  }
  destroy(): void {
    this.outline.destroy(); this.facade.destroy(); this.light.destroy(); this.hand.destroy(); this.name.destroy();
  }
}
