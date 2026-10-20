import Phaser from 'phaser';

/** Pool de sprites baseado em Phaser.GameObjects.Group (reciclagem sem destroy/create). */
export class SpritePool {
  private group: Phaser.GameObjects.Group;

  constructor(
    scene: Phaser.Scene,
    private depth: number,
  ) {
    this.group = scene.add.group({ classType: Phaser.GameObjects.Sprite, maxSize: -1 });
  }

  acquire(x: number, y: number, texture: string, scale: number): Phaser.GameObjects.Sprite {
    const s = this.group.get(x, y, texture) as Phaser.GameObjects.Sprite;
    s.setActive(true).setVisible(true);
    s.anims?.stop();
    s.setTexture(texture);
    s.setPosition(x, y);
    s.setScale(scale).setAlpha(1).setRotation(0).setFlipX(false).clearTint().setDepth(this.depth);
    return s;
  }

  release(s: Phaser.GameObjects.Sprite) {
    this.group.killAndHide(s);
  }

  get size() {
    return this.group.getLength();
  }
}
