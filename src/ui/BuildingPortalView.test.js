import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { BuildingPortalView } from './BuildingPortalView';
import { saloonDoors } from '../data/saloon';
vi.mock('phaser', () => ({ default: { BlendModes: { ADD: 1 } } }));
function fixture() {
  const objects = [], enter = vi.fn();
  const node = (x, y, texture) => {
    const n = Object.assign(new EventEmitter(), { x, y, texture });
    for (const method of ['setOrigin', 'setDepth', 'setBlendMode', 'setVisible', 'setInteractive', 'setScale', 'setAlpha', 'setText']) n[method] = vi.fn(() => n);
    n.destroy = vi.fn(); objects.push(n); return n;
  };
  const scene = { add: { image: node, text: node } }, portal = saloonDoors('canyon')[0].portal;
  const view = new BuildingPortalView(scene, portal, 'SALOON', enter);
  return { view, portal, facade: objects[0], caption: objects[3], objects, enter };
}
describe('world facade interaction', () => {
  it('registers pixel-perfect input on the actual world facade and accepts explicit touch/click only when near', () => {
    const { view, facade, portal, enter } = fixture();
    expect(facade.x).toBe(portal.facade.x); expect(facade.y).toBe(portal.facade.y); expect(facade.texture).toBe(portal.facade.texture);
    expect(facade.setOrigin).toHaveBeenCalledWith(0.5, 1);
    expect(facade.setInteractive).toHaveBeenCalledWith({ useHandCursor: true, pixelPerfect: true, alphaTolerance: 64 });
    const event = { stopPropagation: vi.fn() };
    facade.emit('pointerdown', { x: 10, y: 20, worldX: 3580, worldY: 3600 }, 0, 0, event); expect(enter).not.toHaveBeenCalled();
    view.update(120, true, false, 100); expect(enter).not.toHaveBeenCalled(); // Proximity is never automatic entry.
    facade.emit('pointerdown', { wasTouch: true, x: 10, y: 20 }, 0, 0, event);
    expect(enter).toHaveBeenCalledOnce(); expect(event.stopPropagation).toHaveBeenCalledOnce();
    view.update(120, false, true, 200); facade.emit('pointerdown', {}, 0, 0, event); expect(enter).toHaveBeenCalledOnce();
  });
  it('pulses the independent facade/light layer and cleans up every object', () => {
    const { view, facade, caption, objects } = fixture();
    view.update(120, true, false, 0); const a = facade.setAlpha.mock.calls.at(-1)[0];
    view.update(120, true, false, 100); expect(facade.setAlpha.mock.calls.at(-1)[0]).not.toBe(a);
    expect(facade.setScale.mock.calls.at(-1)[0]).toBeGreaterThan(1);
    view.update(120, false, true, 100); expect(caption.setText).toHaveBeenLastCalledWith('VISITA ENCERRADA');
    view.destroy(); expect(objects.every(o => o.destroy.mock.calls.length === 1)).toBe(true);
  });
});
