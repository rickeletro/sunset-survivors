import { framePath, SequenceKey } from '../assets/registry';
import type Phaser from 'phaser';
import { getBossCombat } from '../data/bossCombat';
import type { EnemyKind } from '../data/enemies';

export const COMBAT_DIRECTIONS = ['south', 'east', 'north', 'west'] as const;
export type CombatDirection = typeof COMBAT_DIRECTIONS[number];
export const ENEMY_ASSETS: Partial<Record<EnemyKind, string>> = {
  knife_bandit: 'knife_bandit', knife_scout: 'knife_scout', coyote: 'coyote',
  dynamiter: 'dynamite_outlaw', longhorn: 'longhorn', rifle_guard: 'rifle_guard',
};
export const BOSS_DIRECTIONS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'] as const;
const enemyKey = (kind: string, dir: string, i: number) => `enemy_pl_${kind}_${dir}_${i}`;
const bossKey = (slug: string, dir: string, i: number) => `boss_pl_${slug}_${dir}_${i}`;
export function combatDirection(dx: number, dy: number): CombatDirection {
  return Math.abs(dx) > Math.abs(dy) ? dx >= 0 ? 'east' : 'west' : dy >= 0 ? 'south' : 'north';
}
export function bossDirection(dx: number, dy: number): typeof BOSS_DIRECTIONS[number] {
  const i = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
  return (['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'] as const)[i];
}
export function preloadCombatSprites(scene: Phaser.Scene, stage: number): void {
  for (const kind of Object.keys(ENEMY_ASSETS)) {
    for (const dir of COMBAT_DIRECTIONS) for (let i = 0; i < 4; i++) {
      const key = enemyKey(kind, dir, i);
      if (!scene.textures.exists(key)) scene.load.image(key, framePath(`enemy:${kind}` as SequenceKey, dir, i));
    }
  }
  if (stage === 1) return; // Simon retains his original run/shoot/death animations.
  for (const slug of getBossCombat(stage).slugs) for (const dir of BOSS_DIRECTIONS) for (let i = 0; i < 8; i++) {
    const key = bossKey(slug, dir, i);
    if (!scene.textures.exists(key)) scene.load.image(key, framePath(`boss:${slug}` as SequenceKey, dir, i));
  }
}
function ensureAnimation(scene: Phaser.Scene, key: string, keys: string[], frameRate: number): void {
  if (scene.anims.exists(key) || !keys.every(k => scene.textures.exists(k))) return;
  scene.anims.create({ key, frames: keys.map(key => ({ key })), frameRate, repeat: -1 });
}
export function enemySpriteTexture(scene: Phaser.Scene, kind: EnemyKind): string | undefined {
  const key = enemyKey(kind, 'south', 0);
  if (!scene.textures.exists(key)) return undefined;
  for (const dir of COMBAT_DIRECTIONS) ensureAnimation(scene, `enemy_pl_${kind}_${dir}`, Array.from({ length: 4 }, (_, i) => enemyKey(kind, dir, i)), 8);
  return key;
}
export function playEnemyMovement(sprite: Phaser.GameObjects.Sprite, kind: EnemyKind, dx: number, dy: number): void {
  const key = `enemy_pl_${kind}_${combatDirection(dx, dy)}`;
  if (sprite.scene.anims.exists(key)) { sprite.setFlipX(false); sprite.play(key, true); }
}
export function bossSpriteTexture(scene: Phaser.Scene, slug: string): string {
  for (const dir of BOSS_DIRECTIONS) ensureAnimation(scene, `boss_pl_${slug}_${dir}`, Array.from({ length: 8 }, (_, i) => bossKey(slug, dir, i)), 10);
  return bossKey(slug, 'south', 0);
}
export function playBossMovement(sprite: Phaser.GameObjects.Sprite, slug: string, dx: number, dy: number): void {
  const key = `boss_pl_${slug}_${bossDirection(dx, dy)}`;
  if (sprite.scene.anims.exists(key)) { sprite.setFlipX(false); sprite.play(key, true); }
}
