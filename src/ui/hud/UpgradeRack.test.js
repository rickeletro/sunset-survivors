import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { UpgradeRack } from './UpgradeRack';
import { upgradeEmblems, upgradeRackLayout, UPGRADE_HUD_ASSETS } from '../../data/upgradeHud';
import { WEAPONS } from '../../data/weapons';
import { PASSIVES } from '../../data/passives';
import { CATALOG } from '../../assets/registry';

function fixture() {
  const objects = [];
  function node(x = 0, y = 0, text = '') {
    const n = { x, y, text, list: [], active: true, alpha: 1 };
    n.setPosition = vi.fn((x, y) => { Object.assign(n, { x, y }); return n; });
    n.setText = vi.fn(text => { n.text = text; return n; });
    n.setAlpha = vi.fn(alpha => { n.alpha = alpha; return n; });
    n.add = added => { for (const child of Array.isArray(added) ? added : [added]) { n.list.push(child); child.parent = n; } return n; };
    n.destroy = vi.fn(() => {
      n.active = false; for (const child of [...n.list]) child.destroy(); n.list = [];
      if (n.parent) n.parent.list = n.parent.list.filter(child => child !== n);
    });
    for (const method of ['setDepth','setScrollFactor','setOrigin','setScale','fillStyle','fillRect','lineStyle','strokeRect']) n[method] = vi.fn(() => n);
    objects.push(n); return n;
  }
  const scene = { add: { container: node, graphics: node, image: node, text: node },
    textures: { exists: () => true }, tweens: { add: vi.fn(), killTweensOf: vi.fn() },
    scale: Object.assign(new EventEmitter(), { width: 1920, height: 1080 }), events: new EventEmitter() };
  const rack = new UpgradeRack(scene);
  return { rack, scene, objects };
}
describe('owned equipment insignias', () => {
  it('updates existing ranks without duplicates, distinguishes categories and replaces evolved bases', () => {
    const { rack, scene, objects } = fixture(), weapons = new Map([['revolver', 1]]), passives = new Map();
    rack.sync(weapons, passives);
    const starter = rack.root.list[0], allocated = objects.length;
    weapons.set('revolver', 3); rack.sync(weapons, passives, 'revolver');
    expect(rack.root.list).toEqual([starter]); expect(objects.length).toBe(allocated);
    expect(starter.list.some(n => n.text === 'LV.3')).toBe(true);
    expect(scene.tweens.add).toHaveBeenCalledOnce();
    rack.sync(weapons, passives, 'revolver'); expect(scene.tweens.add).toHaveBeenCalledOnce();
    for (let i = 0; i < 100; i++) rack.sync(weapons, passives);
    expect(objects.length).toBe(allocated); expect(scene.tweens.add).toHaveBeenCalledOnce();
    passives.set('badge', 2); rack.sync(weapons, passives, 'badge');
    expect(rack.root.list[1].list.some(n => n.text === 'P')).toBe(true);
    weapons.delete('revolver'); weapons.set('desperado_fury', 1); rack.sync(weapons, passives, 'desperado_fury');
    expect(starter.destroy).toHaveBeenCalledOnce(); expect(rack.root.list).toHaveLength(2);
    expect(rack.root.list.some(n => n.list.some(child => child.text === '★'))).toBe(true);
    expect(upgradeEmblems(new Map([['revolver',5],['desperado_fury',1]]), passives).map(e => e.id)).toEqual(['desperado_fury','badge']);
    scene.events.emit('shutdown');
    expect(scene.scale.listenerCount('resize')).toBe(0);
    expect(objects.every(o => o.destroy.mock.calls.length === 1)).toBe(true);
  });
  it.each([[320,360],[390,844],[640,360],[1280,720],[1920,1080]])('fits every owned item into %s x %s without distorting art', (width, height) => {
    const { rack, scene } = fixture();
    scene.scale.width = width; scene.scale.height = height;
    const weapons = new Map(Object.keys(WEAPONS).slice(0,6).map(id => [id,5]));
    const passives = new Map(Object.keys(PASSIVES).map(id => [id,5]));
    rack.sync(weapons, passives);
    expect(rack.root.list).toHaveLength(11);
    for (const badge of rack.root.list) {
      const x = rack.root.x + badge.x, y = rack.root.y + badge.y;
      expect(x - 25).toBeGreaterThanOrEqual(0); expect(x + 25).toBeLessThanOrEqual(width);
      expect(y - 27).toBeGreaterThanOrEqual(0); expect(y + 29).toBeLessThanOrEqual(height);
    }
    const count = rack.root.list.length; scene.scale.width += 100; scene.scale.emit('resize');
    expect(rack.root.list).toHaveLength(count);
    expect(upgradeRackLayout(width,height,count).rows).toBeGreaterThanOrEqual(1);
  });
  it('reuses registered tiny illustrations for every available weapon, passive and evolution', () => {
    expect(UPGRADE_HUD_ASSETS).toHaveLength(17);
    expect(UPGRADE_HUD_ASSETS.every(key => CATALOG.images[key])).toBe(true);
    expect(upgradeEmblems(new Map([['unknown',1]]), new Map())).toEqual([]);
  });
});
