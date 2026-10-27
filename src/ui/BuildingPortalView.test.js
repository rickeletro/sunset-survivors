import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { BuildingPortalView } from './BuildingPortalView';
import { saloonDoors } from '../data/saloon';
vi.mock('phaser', () => ({ default: { BlendModes: { ADD: 1 }, Geom: { Rectangle: class {
  constructor(x, y, width, height) { Object.assign(this, { x, y, width, height }); }
  static Contains(rect, x, y) { return x >= rect.x && y >= rect.y && x <= rect.x + rect.width && y <= rect.y + rect.height; }
} } } }));
function fixture() {
  const objects = [], enter = vi.fn();
  const node = (x, y, texture, requestedFrame) => {
    const n = Object.assign(new EventEmitter(), { x, y, texture, requestedFrame, input: {} });
    for (const method of ['setOrigin', 'setDepth', 'setBlendMode', 'setVisible', 'setInteractive', 'setScale', 'setAlpha', 'setPosition', 'fillStyle', 'fillRect']) n[method] = vi.fn(() => n);
    n.destroy = vi.fn(); objects.push(n); return n;
  };
  const ctx = { drawImage: vi.fn(), fillRect: vi.fn() }, textures = new Map();
  const scene = { add: { image: node, text: node, graphics: node }, textures: {
    exists: key => textures.has(key), get: () => ({ getSourceImage: () => ({ width: 256, height: 256 }) }),
    createCanvas: vi.fn((key, width, height) => {
      const texture = { width, height, getContext: () => ctx, refresh: vi.fn() }; textures.set(key, texture); return texture;
    }),
  } }, portal = saloonDoors('canyon')[0].portal;
  const view = new BuildingPortalView(scene, portal, 'SALOON', enter);
  return { view, portal, outline: objects[0], facade: objects[1], hand: objects[4], objects, enter, scene, ctx };
}
describe('world facade interaction', () => {
  it('accepts explicit facade and pointing-hand clicks only while available nearby', () => {
    const { view, facade, hand, portal, enter } = fixture();
    expect(facade.x).toBe(portal.facade.x); expect(facade.y).toBe(portal.facade.y);
    expect(facade.requestedFrame).toBe('__BASE');
    expect(facade.setInteractive).toHaveBeenCalledWith({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 64 });
    const event = { stopPropagation: vi.fn() };
    facade.emit('pointerdown', {}, 0, 0, event); expect(enter).not.toHaveBeenCalled();
    view.update(120, true, false, 100); expect(enter).not.toHaveBeenCalled();
    for (const target of [facade, hand]) target.emit('pointerdown', { wasTouch: true }, 0, 0, event);
    expect(enter).toHaveBeenCalledTimes(2); expect(event.stopPropagation).toHaveBeenCalledTimes(2);
    for (const [used, blocked] of [[true, false], [false, true]]) {
      view.update(100, true, used, 200, blocked);
      facade.emit('pointerdown', {}, 0, 0, event); hand.emit('pointerdown', {}, 0, 0, event);
    }
    expect(enter).toHaveBeenCalledTimes(2);
  });
  it('replaces the floor circle with a pulsing exterior outline and animated glove', () => {
    const { view, objects, outline, facade, hand, portal } = fixture();
    expect(objects.some(o => o.texture === 'stage_activity')).toBe(false);
    view.update(500, false, false, 0);
    expect(outline.setVisible).toHaveBeenLastCalledWith(false); expect(hand.setVisible).toHaveBeenLastCalledWith(false);
    view.update(120, true, false, 0);
    const alpha = outline.setAlpha.mock.calls.at(-1)[0], pos = hand.setPosition.mock.calls.at(-1);
    expect(outline.setVisible).toHaveBeenLastCalledWith(true); expect(hand.setVisible).toHaveBeenLastCalledWith(true);
    view.update(120, true, false, 200);
    expect(outline.setAlpha.mock.calls.at(-1)[0]).not.toBe(alpha);
    expect(hand.setPosition.mock.calls.at(-1)).not.toEqual(pos);
    expect(facade.setScale).toHaveBeenCalledExactlyOnceWith(portal.facade.scale);
    view.update(100, false, true, 500); expect(hand.setVisible).toHaveBeenLastCalledWith(false);
    view.update(100, true, false, 500, true); expect(outline.setVisible).toHaveBeenLastCalledWith(false);
    view.destroy(); expect(objects.every(o => o.destroy.mock.calls.length === 1)).toBe(true);
  });
  it('caches the exterior silhouette so frames and repeated facades allocate no textures', () => {
    const { scene, ctx, view, portal } = fixture();
    expect(ctx.drawImage).toHaveBeenCalledTimes(9); // Eight offsets, then erase the original interior.
    expect(ctx.globalCompositeOperation).toBe('source-over');
    new BuildingPortalView(scene, portal, 'SALOON', vi.fn());
    for (let i = 0; i < 100; i++) view.update(100, true, false, i * 16);
    expect(scene.textures.createCanvas).toHaveBeenCalledOnce();
    expect(ctx.drawImage).toHaveBeenCalledTimes(9);
  });
});
