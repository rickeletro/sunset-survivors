export interface PassiveLevelInfo {
  level: number;
  description: string;
  effect: {
    xpBonus?: number;
    speedBonus?: number;
    hpRegen?: number;
    cooldownReduction?: number;
    magnetRadius?: number;
    armorBonus?: number;
    maxHpBonus?: number;
  };
}

export interface PassiveDef {
  id: string;
  name: string;
  icon: string;
  levels: PassiveLevelInfo[];
}

export const PASSIVES: Record<string, PassiveDef> = {
  badge: {
    id: 'badge',
    name: "Sheriff's Star",
    icon: 'sheriff_badge',
    levels: [
      { level: 1, description: '+20% XP gained from all dropped gold and badges', effect: { xpBonus: 0.2 } },
      { level: 2, description: '+40% XP gained from all dropped items', effect: { xpBonus: 0.4 } },
      { level: 3, description: '+65% XP gained - level up at lightning speed', effect: { xpBonus: 0.65 } },
      { level: 4, description: '+90% XP gained & lawman authority', effect: { xpBonus: 0.9 } },
      { level: 5, description: '+120% XP gained - earn maximum bounty per kill!', effect: { xpBonus: 1.2 } },
    ],
  },

  spurs: {
    id: 'spurs',
    name: 'Silver Spurs',
    icon: 'spurs',
    levels: [
      { level: 1, description: '+15% Character Movement Speed', effect: { speedBonus: 0.15 } },
      { level: 2, description: '+28% Character Movement Speed', effect: { speedBonus: 0.28 } },
      { level: 3, description: '+40% Movement Speed - outrun any bandit horse', effect: { speedBonus: 0.4 } },
      { level: 4, description: '+52% Movement Speed & agile dodging', effect: { speedBonus: 0.52 } },
      { level: 5, description: '+65% Movement Speed - glide like a desert wind!', effect: { speedBonus: 0.65 } },
    ],
  },

  whiskey: {
    id: 'whiskey',
    name: 'Frontier Whiskey',
    icon: 'whiskey',
    levels: [
      { level: 1, description: 'Regenerates +1 HP every second', effect: { hpRegen: 1 } },
      { level: 2, description: 'Regenerates +2 HP every second', effect: { hpRegen: 2 } },
      { level: 3, description: 'Regenerates +3.5 HP per second & +20 Max HP', effect: { hpRegen: 3.5, maxHpBonus: 20 } },
      { level: 4, description: 'Regenerates +5 HP per second & +40 Max HP', effect: { hpRegen: 5, maxHpBonus: 40 } },
      { level: 5, description: 'Regenerates +7.5 HP per second - unbreakable grit!', effect: { hpRegen: 7.5, maxHpBonus: 60 } },
    ],
  },

  bandolier: {
    id: 'bandolier',
    name: 'Ammo Bandolier',
    icon: 'bandolier',
    levels: [
      { level: 1, description: '-12% Weapon Cooldown (Fires 12% faster)', effect: { cooldownReduction: 0.12 } },
      { level: 2, description: '-22% Weapon Cooldown', effect: { cooldownReduction: 0.22 } },
      { level: 3, description: '-30% Weapon Cooldown', effect: { cooldownReduction: 0.3 } },
      { level: 4, description: '-38% Weapon Cooldown - non-stop hail of bullets', effect: { cooldownReduction: 0.38 } },
      { level: 5, description: '-48% Weapon Cooldown - near continuous barrage!', effect: { cooldownReduction: 0.48 } },
    ],
  },

  magnet: {
    id: 'magnet',
    name: 'Horseshoe Magnet',
    icon: 'gold_nugget',
    levels: [
      { level: 1, description: '+50% Gold & XP magnet pull distance', effect: { magnetRadius: 50 } },
      { level: 2, description: '+100% Gold & XP magnet pull distance', effect: { magnetRadius: 100 } },
      { level: 3, description: '+160% Magnet pull distance - vacuum the screen', effect: { magnetRadius: 160 } },
      { level: 4, description: '+230% Magnet pull distance', effect: { magnetRadius: 230 } },
      { level: 5, description: '+320% Magnet pull - every nugget flies straight to you!', effect: { magnetRadius: 320 } },
    ],
  },
};
