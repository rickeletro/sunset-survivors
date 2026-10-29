import type { ImageKey } from '../assets/registry';

export type ConsumableId =
  | 'golden_magnet'
  | 'omni_shot'
  | 'mega_dynamite'
  | 'silver_bullet'
  | 'seven_league_boots'
  | 'miracle_elixir';

export interface ConsumableItem {
  id: ConsumableId;
  name: string;
  subtitle: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  durationSeconds: number; // 0 = instant
  cardTexture: ImageKey;
  hudTexture: ImageKey;
  hotkey: string;
  color: string;
}

export const CONSUMABLE_ITEMS: Record<ConsumableId, ConsumableItem> = {
  golden_magnet: {
    id: 'golden_magnet',
    name: 'DESERT MAGNET',
    subtitle: 'INSTANT FIELD REAP',
    description: 'Instantly pulls all XP, gold bags and loot drops from the entire territory straight to you.',
    rarity: 'common',
    price: 350,
    durationSeconds: 0,
    cardTexture: 'card_magnet',
    hudTexture: 'hud_upgrade_magnet',
    hotkey: '1',
    color: '#ffc52a',
  },
  seven_league_boots: {
    id: 'seven_league_boots',
    name: 'SEVEN-LEAGUE BOOTS',
    subtitle: '+80% SWIFT SPURS SPEED',
    description: 'Grants Level 5 hyper-speed (+80% velocity) for 30 seconds to outrun any ambush.',
    rarity: 'rare',
    price: 520,
    durationSeconds: 30,
    cardTexture: 'card_spurs',
    hudTexture: 'hud_upgrade_spurs',
    hotkey: '2',
    color: '#ff791c',
  },
  miracle_elixir: {
    id: 'miracle_elixir',
    name: 'MIRACLE TONIC',
    subtitle: 'FULL HEAL & 6s INVULN',
    description: 'Instantly restores 100% of maximum health and grants 6 seconds of iron invulnerability.',
    rarity: 'rare',
    price: 650,
    durationSeconds: 6,
    cardTexture: 'card_whiskey',
    hudTexture: 'hud_upgrade_whiskey',
    hotkey: '3',
    color: '#f2d49a',
  },
  mega_dynamite: {
    id: 'mega_dynamite',
    name: 'NITRO DYNAMITE',
    subtitle: 'MASSIVE BLASTS / 30s',
    description: 'Hurls clusters of high-yield nitroglycerin dynamite with huge blast radius for 30 seconds.',
    rarity: 'epic',
    price: 780,
    durationSeconds: 30,
    cardTexture: 'card_dynamite',
    hudTexture: 'hud_upgrade_dynamite',
    hotkey: '4',
    color: '#e52b20',
  },
  omni_shot: {
    id: 'omni_shot',
    name: 'HIGH NOON 360°',
    subtitle: 'FULL-CIRCLE LEAD BARRAGE',
    description: 'Unleashes a rapid 360-degree bullet storm in all directions around you for 30 seconds.',
    rarity: 'epic',
    price: 850,
    durationSeconds: 30,
    cardTexture: 'card_desperado_fury',
    hudTexture: 'hud_upgrade_desperado_fury',
    hotkey: '5',
    color: '#e52b20',
  },
  silver_bullet: {
    id: 'silver_bullet',
    name: 'SILVER BULLETS',
    subtitle: '400% DAMAGE & 100% CRIT',
    description: 'Infuses firearms with pure silver: 400% damage, 100% critical hit rate and shield-pierce for 30 seconds.',
    rarity: 'legendary',
    price: 1100,
    durationSeconds: 30,
    cardTexture: 'card_golden_repeater',
    hudTexture: 'hud_upgrade_golden_repeater',
    hotkey: '6',
    color: '#ffffff',
  },
};

export const CONSUMABLE_ORDER: ConsumableId[] = [
  'golden_magnet',
  'seven_league_boots',
  'miracle_elixir',
  'mega_dynamite',
  'omni_shot',
  'silver_bullet',
];
