import type Phaser from 'phaser';
import { groundShadowGeometry, measureGroundSupport, projectedShadowHull, type GroundSupport } from '../data/groundShadow';

let samplingContext: CanvasRenderingContext2D | null = null;
/** A single bulk readback on first use avoids thousands of per-pixel GPU/canvas reads. */
function frameSupport(frame: Phaser.Textures.Frame): GroundSupport {
  if (!samplingContext) samplingContext = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!samplingContext) throw new Error('Ground shadow alpha sampling requires a 2D canvas');
  const context = samplingContext;
  context.canvas.width = frame.cutWidth; context.canvas.height = frame.cutHeight;
  context.drawImage(frame.source.image as CanvasImageSource, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight,
    0, 0, frame.cutWidth, frame.cutHeight);
  const pixels = context.getImageData(0, 0, frame.cutWidth, frame.cutHeight).data;
  return measureGroundSupport(frame.realWidth, frame.realHeight, (x, y) => {
    const cx = x - frame.x, cy = y - frame.y;
    return cx < 0 || cy < 0 || cx >= frame.cutWidth || cy >= frame.cutHeight ? 0 : pixels[(cy * frame.cutWidth + cx) * 4 + 3];
  });
}

const supportCache = new WeakMap<Phaser.Textures.Frame, GroundSupport>();

/** One small ground-plane graphic. Alpha is scanned once per source frame, never per tick. */
export class GroundShadow {
  private graphic: Phaser.GameObjects.Graphics;
  private signature = '';
  private lastFrame?: Phaser.Textures.Frame;
  private anchor = { x: 0, y: 0 };
  constructor(scene: Phaser.Scene, private actor: Phaser.GameObjects.Components.Transform &
    Phaser.GameObjects.Components.Origin & Phaser.GameObjects.Components.Texture & Phaser.GameObjects.Components.Flip,
    private indoor = false) {
    this.graphic = scene.add.graphics().setDepth(2);
    this.update();
  }
  update(): void {
    const a = this.actor, frame = a.frame;
    const signature = [a.scaleX, a.scaleY, a.flipX, a.originX, a.originY].join(':');
    if (frame === this.lastFrame && signature === this.signature) {
      this.graphic.setPosition(a.x + this.anchor.x, a.y + this.anchor.y);
      return;
    }
    let support = supportCache.get(frame);
    if (!support) {
      support = frameSupport(frame);
      supportCache.set(frame, support);
    }
    const shape = groundShadowGeometry(support, frame.realWidth, frame.realHeight,
      a.originX, a.originY, a.scaleX, a.scaleY, a.flipX, this.indoor);
    this.graphic.setPosition(a.x + shape.x, a.y + shape.y).setVisible(shape.visible);
    this.signature = signature; this.lastFrame = frame;
    this.anchor = { x: shape.x, y: shape.y };
    this.graphic.clear();
    const half = shape.width * 0.5;
    const base = shape.base?.length ? shape.base : [{ x: -half, y: 0 }, { x: half, y: 0 }];
    if (!this.indoor) this.graphic.fillStyle(0x120b08, 0.18).fillPoints(projectedShadowHull(base, shape.dx, shape.dy), true);
    // Contact follows the actual diagonal foundation/soles, not a detached oval.
    this.graphic.fillStyle(0x120b08, 0.30).fillPoints([
      ...base.map(p => ({ x: p.x, y: p.y - 1 })),
      ...[...base].reverse().map(p => ({ x: p.x, y: p.y + 2 })),
    ], true);
  }
  destroy(): void { this.graphic.destroy(); }
}
