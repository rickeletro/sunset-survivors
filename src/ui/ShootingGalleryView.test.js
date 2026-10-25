import { EventEmitter } from 'node:events';
import { expect, it, vi } from 'vitest';
import { ShootingGalleryView, GALLERY_AIM_AREA } from './ShootingGalleryView';
import { gallerySlot } from '../data/shootingGallery';
const h = vi.hoisted(() => ({ buttons: [], keys: {}, labels: [], plates: [] }));
vi.mock('../audio/SoundManager', () => ({ sounds: { playReload: vi.fn(), playRevolver: vi.fn(), playCoin: vi.fn(), playRicochet: vi.fn() } }));
vi.mock('./components/BossTargetPlate', () => ({ BossTargetPlate: class {
  constructor() { h.plates.push(this); } setBoss = vi.fn(); pose = vi.fn();
} }));
vi.mock('./layout/pulpSceneKit', () => ({
  pulpWood: vi.fn(),
  pulpText: (_s, _r, _x, _y, text) => { const n = { text, setText(t) { this.text = t; return this; } }; h.labels.push(n); return n; },
  pulpButton: (_s, _r, _x, _y, text, click) => { const n = { text, click, setText(t) { this.text = t; return this; } }; h.buttons.push(n); return n; },
  bindPulpKeys: (_s, keys) => { h.keys = keys; },
}));
function fixture(stage = 1) {
  h.buttons = []; h.labels = []; h.plates = []; const nodes = [], tweens = [];
  const node = () => {
    const n = { handlers: {}, on(k, f) { this.handlers[k] = f; return this; } };
    for (const k of ['add', 'fillStyle', 'fillRect', 'fillCircle', 'fillEllipse', 'fillTriangle', 'lineStyle', 'strokeCircle', 'setPosition', 'setInteractive', 'lineBetween', 'setVisible', 'destroy']) n[k] = () => n;
    nodes.push(n); return n;
  };
  const scene = { cameras: { main: { flash: vi.fn() } }, add: { container: node, graphics: node, zone: node }, events: new EventEmitter(), tweens: { add: t => tweens.push(t) } };
  const exit = vi.fn(), view = new ShootingGalleryView(scene, node(), exit, stage);
  return { scene, view, exit, tweens, board: nodes.find(n => n.handlers.pointerdown) };
}
const click = (board, x, y) => board.handlers.pointerdown(null, x + GALLERY_AIM_AREA.width / 2 - GALLERY_AIM_AREA.x, y + GALLERY_AIM_AREA.height / 2 - GALLERY_AIM_AREA.y);
it('shows the boss boards, maps scaled local aim coordinates, retracts a hit and settles once', () => {
  const { scene, view, board, exit } = fixture();
  expect(h.plates).toHaveLength(8); h.plates.forEach((p, i) => expect(p.setBoss).toHaveBeenCalledWith(i + 1));
  view.round.random = () => 0;
  click(board, 0, 0); expect(view.round.shots).toBe(0);
  h.buttons.find(b => b.text === 'START SHOWDOWN').click();
  scene.events.emit('update', 0, 1000);
  const p = view.round.plates[0], slot = gallerySlot(p.slot);
  click(board, slot.x, slot.y - 80); expect(view.round.hits.size).toBe(1);
  scene.events.emit('update', 1000, 230); expect(h.plates[p.slot].pose).toHaveBeenLastCalledWith(0, expect.any(Number), true);
  h.keys.ESC(); h.keys.ESC(); expect(exit).toHaveBeenCalledExactlyOnceWith({ bounty: 3, xp: 5 });
  scene.events.emit('shutdown'); expect(scene.events.listenerCount('update')).toBe(0);
});
it('immediately ends the UI on a miss and blocks further shooting', () => {
  const { scene, board, view } = fixture(); h.keys.ENTER(); scene.events.emit('update', 0, 700);
  click(board, 620, -280); expect(h.labels.some(n => n.text.includes('MISSED SHOT'))).toBe(true);
  click(board, 0, 0); expect(view.round.shots).toBe(1); expect(h.buttons.some(b => b.text === 'ROUND LOST')).toBe(true);
});

it('shows the stage-specific identity, target count and longer round clock', () => {
  const { view } = fixture(8);
  expect(view.round.profile.targets).toBe(24);
  expect(h.labels.some(n => n.text === 'MIDNIGHT MARSHAL SALOON')).toBe(true);
  expect(h.labels.some(n => n.text.includes('24 BOSS BOARDS'))).toBe(true);
  expect(h.labels.some(n => n.text.includes('70s'))).toBe(true);
});
