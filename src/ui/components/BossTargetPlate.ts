import type Phaser from 'phaser';
import { BOSSES } from '../../data/bosses';
import { pulpText } from '../layout/pulpSceneKit';
import { GALLERY_PLATE } from '../../data/shootingGallery';

export const GALLERY_PORTRAIT_FRAME = '__GALLERY_PORTRAIT';
export function galleryPortraitCrop(width: number, height: number) {
  return { x: Math.floor(width * .055), y: Math.floor(height * .24), width: Math.floor(width * .89), height: Math.floor(height * .51) };
}
/** Add a non-destructive UI frame without changing a shared texture's default frame. */
export function prepareGalleryPortrait(texture: Phaser.Textures.Texture) {
  if (texture.has(GALLERY_PORTRAIT_FRAME)) return;
  const source = texture.getSourceImage() as HTMLImageElement, crop = galleryPortraitCrop(source.width, source.height);
  const first = texture.firstFrame;
  try { texture.add(GALLERY_PORTRAIT_FRAME, 0, crop.x, crop.y, crop.width, crop.height); }
  finally { texture.firstFrame = first; }
}
export class BossTargetPlate {
  readonly node: Phaser.GameObjects.Container;
  private portrait: Phaser.GameObjects.Image;
  private name: Phaser.GameObjects.Text;
  private fuse: Phaser.GameObjects.Graphics;
  private boss = 0;
  constructor(private scene: Phaser.Scene, parent: Phaser.GameObjects.Container, x: number, y: number) {
    this.node = scene.add.container(x, y).setVisible(false); parent.add(this.node);
    const g = scene.add.graphics(), w = GALLERY_PLATE.width, h = GALLERY_PLATE.height;
    // Shadow, thick carved wood, aged paper and a separate brass hinge.
    g.fillStyle(0x120b08, .7).fillRect(-w / 2 + 5, -h + 5, w, h - 7);
    g.fillStyle(0x9b622d).fillRect(-7, -18, 14, 22);
    g.lineStyle(1, 0xc89827).lineBetween(-4, -17, -4, 3);
    g.fillStyle(0x603719).fillRect(-w / 2, -h, w, h - 10);
    g.lineStyle(3, 0xc89827).strokeRect(-w / 2 + 3, -h + 3, w - 6, h - 16);
    g.fillStyle(0xf2d49a).fillRect(-w / 2 + 10, -h + 11, w - 20, h - 35);
    g.lineStyle(1, 0x321b10, .7).strokeRect(-w / 2 + 12, -h + 13, w - 24, h - 39);
    for (const sx of [-1, 1]) for (const yy of [-h + 8, -19]) {
      g.fillStyle(0x120b08).fillCircle(sx * (w / 2 - 8), yy + 1, 4);
      g.fillStyle(0xffc52a).fillCircle(sx * (w / 2 - 8), yy, 2);
    }
    this.node.add(g);
    this.portrait = scene.add.image(0, -113, 'boss_poster_1'); this.node.add(this.portrait);
    this.name = pulpText(scene, this.node, 0, -34, '', 13, '#321b10');
    this.name.setWordWrapWidth(150).setStroke('#321b10', 0);
    this.fuse = scene.add.graphics().fillStyle(0xffc52a).fillRect(0, 0, 146, 3).setPosition(-73, -16); this.node.add(this.fuse);
    this.setBoss(1);
  }
  setBoss(boss: number) {
    if (this.boss === boss) return; this.boss = boss;
    const key = `boss_poster_${boss}`; prepareGalleryPortrait(this.scene.textures.get(key));
    this.portrait.setTexture(key, GALLERY_PORTRAIT_FRAME);
    this.portrait.setScale(Math.min(148 / this.portrait.width, 126 / this.portrait.height));
    const names = ['GREEDWELL', 'HANK HATFIELD', 'DARK HORSE', 'SMITH BROTHERS', 'EL GRECO', 'CHIEF WIGWAM', 'PACO LOCO', 'RICHARD ROSE'];
    this.name.setText(names[boss - 1] ?? BOSSES[boss - 1]?.name ?? 'OUTLAW');
  }
  pose(lift: number, remaining: number, hit: boolean) {
    this.node.setVisible(lift > .012).setScale(1, Math.max(.001, lift)).setAlpha(hit ? .65 : 1);
    this.fuse.setScale(Math.max(0, remaining), 1);
  }
}
