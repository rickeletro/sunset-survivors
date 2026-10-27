export interface LootPacket { val: number; bounty: number; }
export interface BudgetedDrop extends LootPacket {
  type: string; sprite: { x: number; y: number }; packets?: LootPacket[];
}
export const DROP_SPRITE_BUDGET = 700;
/** Merge distant loot visually without losing a single original reward packet. */
export function mergeLoot(drops: BudgetedDrop[], incoming: LootPacket & { type: string; x: number; y: number }): boolean {
  if (drops.length < DROP_SPRITE_BUDGET) return false;
  let nearest: BudgetedDrop | undefined; let distance = Infinity;
  for (const drop of drops) {
    if (drop.type !== incoming.type) continue;
    const d = Math.hypot(drop.sprite.x - incoming.x, drop.sprite.y - incoming.y);
    if (d < distance) { nearest = drop; distance = d; }
  }
  if (!nearest) return false; // At most one extra sprite for each previously absent loot type.
  nearest.packets ??= [{ val: nearest.val, bounty: nearest.bounty }];
  nearest.packets.push({ val: incoming.val, bounty: incoming.bounty });
  return true;
}
/** One original pickup packet at a time preserves the existing XP/level-up calculation. */
export function takeLootPacket(drop: BudgetedDrop): { packet: LootPacket; exhausted: boolean } {
  if (!drop.packets) return { packet: { val: drop.val, bounty: drop.bounty }, exhausted: true };
  const packet = drop.packets.shift()!;
  return { packet, exhausted: drop.packets.length === 0 };
}
