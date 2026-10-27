import { WEAPONS } from './weapons';
import { PASSIVES } from './passives';
import { WEAPON_EVOLUTIONS } from './evolutions';

export type UpgradeCategory = 'weapon' | 'passive' | 'evolution';
export interface UpgradeEmblem { id: string; name: string; level: number; category: UpgradeCategory; texture: string; }
export const EMBLEM_COLORS = { weapon: 0xc49a55, passive: 0x8bdd78, evolution: 0xffc52a } as const;
export const UPGRADE_HUD_ASSETS = [...Object.keys(WEAPONS), ...Object.keys(PASSIVES)].map(id => `hud_upgrade_${id}`);
/** Inventory is the source of truth: evolution replaces its base, consumable rewards are not equipment. */
export function upgradeEmblems(weapons: ReadonlyMap<string, number>, passives: ReadonlyMap<string, number>): UpgradeEmblem[] {
  const evolved = WEAPON_EVOLUTIONS.filter(e => weapons.has(e.evolvedWeaponId));
  const result: UpgradeEmblem[] = [...weapons].filter(([id, level]) => level > 0 && WEAPONS[id] && !evolved.some(e => e.baseWeaponId === id)).map(([id, level]) => ({
    id, level, name: WEAPONS[id].name, texture: `hud_upgrade_${id}`, category: evolved.some(e => e.evolvedWeaponId === id) ? 'evolution' as const : 'weapon' as const,
  }));
  return result.concat([...passives].filter(([id, level]) => level > 0 && PASSIVES[id]).map(([id, level]) => ({
    id, level, name: PASSIVES[id].name, texture: `hud_upgrade_${id}`, category: 'passive' as UpgradeCategory,
  })));
}
export function upgradeRackLayout(width: number, height: number, count: number) {
  const columns = Math.max(1, Math.min(Math.max(1, count), Math.floor((width - 16) / 54)));
  const rows = Math.ceil(count / columns);
  return { columns, x: (width - columns * 54) / 2 + 27, y: Math.max(30, height - rows * 60 + 24 - 10), rows };
}
