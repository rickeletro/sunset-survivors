import { ECONOMY } from './economy';
import type { UpgradeChoice } from '../scenes/LevelUpScene';

export type ChestRewardRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ChestRewardKind = 'upgrade' | 'bounty' | 'xp' | 'heal';

export interface RarityVisualStyle {
  rarity: ChestRewardRarity;
  badgeText: string;
  headline: 'YOU WON!' | 'JACKPOT!';
  borderColor: number;
  glowColor: number;
  textColor: string;
  burstParticles: number;
}

export const CHEST_RARITY_STYLES: Record<ChestRewardRarity, RarityVisualStyle> = {
  common: {
    rarity: 'common',
    badgeText: 'COMMON REWARD',
    headline: 'YOU WON!',
    borderColor: 0xf2d49a,
    glowColor: 0xffc52a,
    textColor: '#f2d49a',
    burstParticles: 16,
  },
  rare: {
    rarity: 'rare',
    badgeText: 'RARE REWARD',
    headline: 'YOU WON!',
    borderColor: 0xffc52a,
    glowColor: 0xff791c,
    textColor: '#ffc52a',
    burstParticles: 24,
  },
  epic: {
    rarity: 'epic',
    badgeText: 'EPIC PRIZE',
    headline: 'JACKPOT!',
    borderColor: 0xff791c,
    glowColor: 0xe52b20,
    textColor: '#ff791c',
    burstParticles: 32,
  },
  legendary: {
    rarity: 'legendary',
    badgeText: 'LEGENDARY JACKPOT',
    headline: 'JACKPOT!',
    borderColor: 0xe52b20,
    glowColor: 0xffc52a,
    textColor: '#ffc52a',
    burstParticles: 42,
  },
};

export interface ChestWheelSegment {
  index: number;
  id: string;
  kind: ChestRewardKind;
  rarity: ChestRewardRarity;
  weight: number;
  label: string;
  subtitle: string;
  description: string;
  iconKey: string;
  cardKey: string;
  sliceColor: number;
  accentColor: string;
  choice?: UpgradeChoice;
  bountyAmount?: number;
  xpAmount?: number;
  healAmount?: number;
}

export interface ChestRewardRoll {
  segments: readonly ChestWheelSegment[];
  winnerIndex: number;
  winner: ChestWheelSegment;
  targetAngleDeg: number;
  fullSpins: number;
}

const WHEEL_SLICE_COLORS = [
  0xa51e16, // Burnt Crimson
  0x265c42, // Saloon Felt Green
  0x2b4570, // Frontier Indigo
  0xc97b16, // Gold Rush Ochre
  0x572449, // Canyon Purple
  0x603719, // Aged Oak Brown
] as const;

function upgradeRarity(choice: UpgradeChoice): ChestRewardRarity {
  if (choice.type === 'evolution') return 'legendary';
  if (choice.nextLevel >= 4) return 'epic';
  if (choice.type === 'weapon' || choice.nextLevel >= 2) return 'rare';
  return 'common';
}

function upgradeWeight(rarity: ChestRewardRarity, contract: boolean): number {
  switch (rarity) {
    case 'legendary':
      return contract ? 14 : 9;
    case 'epic':
      return contract ? 20 : 15;
    case 'rare':
      return 22;
    default:
      return 26;
  }
}

function upgradeSubtitle(choice: UpgradeChoice, rarity: ChestRewardRarity): string {
  if (choice.type === 'evolution') return 'LEGENDARY EVOLUTION';
  const kindLabel = choice.type === 'weapon' ? 'WEAPON' : 'PERK';
  return `${rarity.toUpperCase()} ${kindLabel} · LV.${choice.nextLevel}`;
}

/**
 * Builds the 6 segments of the Western Pulp '98 prize wheel using real upgrades and stage-scaled economy rewards.
 */
export function buildChestWheelSegments(
  choices: readonly UpgradeChoice[],
  stage: number,
  contract = false,
): ChestWheelSegment[] {
  const safeStage = Math.max(1, Math.floor(stage || 1));
  const raw: Omit<ChestWheelSegment, 'index' | 'sliceColor'>[] = [];

  for (const choice of choices.slice(0, 3)) {
    if (choice.type === 'reward') continue;
    const rarity = upgradeRarity(choice);
    const style = CHEST_RARITY_STYLES[rarity];
    raw.push({
      id: `upgrade:${choice.id}`,
      kind: 'upgrade',
      rarity,
      weight: upgradeWeight(rarity, contract),
      label: choice.name.toUpperCase(),
      subtitle: upgradeSubtitle(choice, rarity),
      description: choice.description,
      iconKey: `hud_upgrade_${choice.id}`,
      cardKey: `card_${choice.id}`,
      accentColor: style.textColor,
      choice,
    });
  }

  const fallbackPool: Omit<ChestWheelSegment, 'index' | 'sliceColor'>[] = [
    {
      id: 'bounty_jackpot',
      kind: 'bounty',
      rarity: contract ? 'legendary' : 'epic',
      weight: contract ? 14 : 11,
      label: 'GOLD MOTHERLODE',
      subtitle: contract ? 'LEGENDARY BOUNTY' : 'EPIC BOUNTY SACK',
      description: `Collect $${ECONOMY.sources.purse + safeStage * ECONOMY.sources.supplyPerStage * 2} in pure frontier gold!`,
      iconKey: 'drop_moneybag',
      cardKey: 'drop_moneybag',
      accentColor: '#ffc52a',
      bountyAmount: ECONOMY.sources.purse + safeStage * ECONOMY.sources.supplyPerStage * 2,
    },
    {
      id: 'sheriff_xp_cache',
      kind: 'xp',
      rarity: 'rare',
      weight: 22,
      label: 'MARSHAL STAR CACHE',
      subtitle: 'RARE VALOR BONUS',
      description: `Gain +${90 + safeStage * 35} XP toward your next level up!`,
      iconKey: 'drop_badge',
      cardKey: 'drop_badge',
      accentColor: '#ffc52a',
      xpAmount: 90 + safeStage * 35,
    },
    {
      id: 'frontier_gold_pouch',
      kind: 'bounty',
      rarity: 'common',
      weight: 28,
      label: 'BOUNTY COIN POUCH',
      subtitle: 'COMMON GOLD PRIZE',
      description: `Pocket $${ECONOMY.sources.supplyBase + safeStage * ECONOMY.sources.supplyPerStage} in silver and gold coins.`,
      iconKey: 'drop_gold',
      cardKey: 'drop_gold',
      accentColor: '#f2d49a',
      bountyAmount: ECONOMY.sources.supplyBase + safeStage * ECONOMY.sources.supplyPerStage,
    },
    {
      id: 'saloon_reserve_whiskey',
      kind: 'heal',
      rarity: 'common',
      weight: 24,
      label: 'AGED RYE WHISKEY',
      subtitle: 'COMMON TONIC',
      description: 'Restore +35 HP and steady your aim in the dust.',
      iconKey: 'drop_whiskey',
      cardKey: 'drop_whiskey',
      accentColor: '#f2d49a',
      healAmount: 35,
    },
    {
      id: 'outlaw_treasure_vault',
      kind: 'bounty',
      rarity: 'legendary',
      weight: contract ? 12 : 8,
      label: 'RAILROAD PAYCHEST',
      subtitle: 'LEGENDARY TREASURE',
      description: `Seize $${ECONOMY.sources.purse * 2 + safeStage * 12} from the express strongbox!`,
      iconKey: 'drop_moneybag',
      cardKey: 'drop_moneybag',
      accentColor: '#ffc52a',
      bountyAmount: ECONOMY.sources.purse * 2 + safeStage * 12,
    },
    {
      id: 'veteran_bounty_star',
      kind: 'xp',
      rarity: 'epic',
      weight: 15,
      label: 'RANGER COMMENDATION',
      subtitle: 'EPIC XP BOUNTY',
      description: `Gain +${140 + safeStage * 45} XP from high-command dispatches!`,
      iconKey: 'drop_badge',
      cardKey: 'drop_badge',
      accentColor: '#ff791c',
      xpAmount: 140 + safeStage * 45,
    },
  ];

  for (const item of fallbackPool) {
    if (raw.length >= 6) break;
    raw.push(item);
  }

  return raw.slice(0, 6).map((seg, index) => ({
    ...seg,
    index,
    sliceColor: WHEEL_SLICE_COLORS[index % WHEEL_SLICE_COLORS.length],
  }));
}

/**
 * Returns which segment index (0..segmentCount-1) is directly under the fixed top pointer (0 deg)
 * when the wheel is rotated clockwise by `angleDeg` degrees.
 */
export function segmentAtWheelAngle(angleDeg: number, segmentCount = 6): number {
  const sliceDeg = 360 / segmentCount;
  const localTopDeg = ((-angleDeg % 360) + 360) % 360;
  return Math.round(localTopDeg / sliceDeg) % segmentCount;
}

/**
 * Computes the exact clockwise target rotation in degrees so that `winnerIndex` stops centered
 * under the top pointer after `fullSpins` complete turns.
 */
export function wheelTargetAngleForSegment(
  winnerIndex: number,
  segmentCount = 6,
  fullSpins = 5,
): number {
  const sliceDeg = 360 / segmentCount;
  const normalizedIndex = ((winnerIndex % segmentCount) + segmentCount) % segmentCount;
  const stopDeg = (360 - ((normalizedIndex * sliceDeg) % 360)) % 360;
  return Math.max(1, Math.floor(fullSpins)) * 360 + stopDeg;
}

/**
 * Pre-determines the winning chest reward using weighted probabilities before the wheel animation begins.
 */
export function rollChestReward(
  choices: readonly UpgradeChoice[],
  stage: number,
  contract = false,
  rng: () => number = Math.random,
): ChestRewardRoll {
  const segments = buildChestWheelSegments(choices, stage, contract);
  const totalWeight = segments.reduce((sum, seg) => sum + Math.max(0, seg.weight), 0);
  const sample = Math.max(0, Math.min(0.999999, rng())) * (totalWeight || 1);

  let cursor = 0;
  let winnerIndex = 0;
  for (let i = 0; i < segments.length; i++) {
    cursor += Math.max(0, segments[i].weight);
    if (sample < cursor) {
      winnerIndex = i;
      break;
    }
  }

  const fullSpins = 5;
  const targetAngleDeg = wheelTargetAngleForSegment(winnerIndex, segments.length, fullSpins);
  return {
    segments,
    winnerIndex,
    winner: segments[winnerIndex],
    targetAngleDeg,
    fullSpins,
  };
}

