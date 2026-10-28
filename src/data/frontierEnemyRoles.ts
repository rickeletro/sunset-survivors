import type { EnemyKind } from './enemies';

/**
 * Combat identities stay separate from art delivery.  The PixelLab sequences can
 * be swapped in without rebalancing a stage or changing a saved run.
 */
export type FrontierEnemyKind = Extract<EnemyKind, 'thief' | 'drifter' | 'bow_scout' | 'outlaw_woman'>;

export const FRONTIER_ENEMY_ROLES: Record<FrontierEnemyKind, {
  displayName: string;
  attack: 'melee' | 'revolver' | 'arrow' | 'double-revolver';
  range: number;
  cooldown: number;
  stopRange?: number;
}> = {
  thief: { displayName: 'COIN SNEAK', attack: 'melee', range: 22, cooldown: 0 },
  drifter: { displayName: 'DUST DRIFTER', attack: 'revolver', range: 460, cooldown: 2400, stopRange: 250 },
  bow_scout: { displayName: 'PLAINS ARCHER', attack: 'arrow', range: 540, cooldown: 2800, stopRange: 310 },
  outlaw_woman: { displayName: 'SILVER SPUR', attack: 'double-revolver', range: 500, cooldown: 2200, stopRange: 270 },
};

export function isFrontierEnemy(kind: EnemyKind): kind is FrontierEnemyKind {
  return kind in FRONTIER_ENEMY_ROLES;
}
