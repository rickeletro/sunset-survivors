import { expect, it } from 'vitest';
import { CATALOG } from '../assets/registry';
import { WEAPONS } from './weapons';
import { PASSIVES } from './passives';
import { WEAPON_EVOLUTIONS } from './evolutions';

it('provides registered artwork and a description at every weapon and passive level', () => {
  for (const [id, item] of Object.entries({ ...WEAPONS, ...PASSIVES })) {
    expect(`card_${id}` in CATALOG.images, `${id} poster`).toBe(true);
    for (const level of item.levels) expect(level.description.trim().length, `${id} level ${level.level} description`).toBeGreaterThan(10);
  }
});
it('preloads every evolution poster through the same catalog key used by level up', () => {
  for (const evolution of WEAPON_EVOLUTIONS) {
    expect(`card_${evolution.evolvedWeaponId}` in CATALOG.images, evolution.name).toBe(true);
    expect(evolution.description.trim()).not.toBe('');
    expect(WEAPONS[evolution.evolvedWeaponId].name).toBe(evolution.name);
  }
});
