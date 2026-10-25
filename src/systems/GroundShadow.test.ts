import { expect, it, vi } from 'vitest';
import { GroundShadow } from './GroundShadow';

it('reads alpha once per frame, follows movement and flip, and redraws only when the shape changes', () => {
  const drawImage = vi.fn(), getImageData = vi.fn(() => {
    const data = new Uint8ClampedArray(16 * 16 * 4);
    for (let y = 3; y < 12; y++) for (let x = 2; x < 6; x++) data[(y * 16 + x) * 4 + 3] = 255;
    return { data };
  });
  vi.stubGlobal('document', { createElement: () => ({ getContext: () => ({ canvas: {}, drawImage, getImageData }) }) });
  const graphic: any = {};
  for (const method of ['setDepth', 'setPosition', 'setVisible', 'clear', 'fillStyle', 'fillPoints', 'destroy']) graphic[method] = vi.fn(() => graphic);
  const scene: any = { add: { graphics: () => graphic } };
  const actor: any = { x: 100, y: 200, originX: 0.5, originY: 0.5, scaleX: 0.5, scaleY: 0.5, flipX: false,
    texture: { key: 'hero' }, frame: { name: 0, realWidth: 16, realHeight: 16, cutWidth: 16, cutHeight: 16, cutX: 0, cutY: 0, x: 0, y: 0, source: { image: {} } } };
  const shadow = new GroundShadow(scene, actor);
  expect(graphic.setPosition).toHaveBeenLastCalledWith(98, 201.5);
  const drawings = graphic.clear.mock.calls.length;
  actor.x += 10; shadow.update();
  expect(graphic.setPosition).toHaveBeenLastCalledWith(108, 201.5);
  expect(graphic.clear).toHaveBeenCalledTimes(drawings);
  actor.flipX = true; shadow.update();
  expect(graphic.setPosition).toHaveBeenLastCalledWith(112, 201.5);
  expect(graphic.clear).toHaveBeenCalledTimes(drawings + 1);
  expect(getImageData).toHaveBeenCalledOnce();
  expect(drawImage).toHaveBeenCalledOnce();
  const other = new GroundShadow(scene, { ...actor, x: 500 });
  expect(getImageData).toHaveBeenCalledOnce(); // Shared frame remains cached across instances.
  shadow.destroy(); other.destroy();
  expect(graphic.destroy).toHaveBeenCalledTimes(2);
  vi.unstubAllGlobals();
});
