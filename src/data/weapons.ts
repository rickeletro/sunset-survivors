export interface WeaponLevelInfo {
  level: number;
  damage: number;
  cooldownMs: number;
  projectileCount: number;
  pierce: number;
  speed: number;
  range: number;
  description: string;
}

export interface WeaponDef {
  id: string;
  name: string;
  icon: string;
  sound: 'revolver' | 'shotgun' | 'rifle' | 'explosion';
  type: 'directional' | 'nearest' | 'spread' | 'lob' | 'orbit' | 'radial' | 'sweep';
  levels: WeaponLevelInfo[];
}

export const WEAPONS: Record<string, WeaponDef> = {
  revolver: {
    id: 'revolver',
    name: 'Dual Revolvers',
    icon: 'revolver',
    sound: 'revolver',
    type: 'nearest',
    levels: [
      { level: 1, damage: 25, cooldownMs: 650, projectileCount: 2, pierce: 1, speed: 520, range: 450, description: 'Fires 2 rapid bullets at nearest foes' },
      { level: 2, damage: 32, cooldownMs: 580, projectileCount: 2, pierce: 1, speed: 550, range: 480, description: '+28% Damage & Faster Cooldown' },
      { level: 3, damage: 40, cooldownMs: 520, projectileCount: 3, pierce: 2, speed: 580, range: 500, description: '+1 Extra Bullet & Pierce 1 Enemy' },
      { level: 4, damage: 52, cooldownMs: 450, projectileCount: 3, pierce: 2, speed: 620, range: 520, description: 'Rapid Firing & Heavy Cartridges' },
      { level: 5, damage: 68, cooldownMs: 380, projectileCount: 4, pierce: 3, speed: 650, range: 550, description: '4 Gold Bullets tear through bandit ranks!' },
    ],
  },

  peacemaker: {
    id: 'peacemaker',
    name: 'Twin Peacemakers',
    icon: 'revolver',
    sound: 'revolver',
    type: 'nearest',
    levels: [
      { level: 1, damage: 30, cooldownMs: 700, projectileCount: 2, pierce: 2, speed: 560, range: 480, description: 'Piercing silver bullets seek out targets' },
      { level: 2, damage: 42, cooldownMs: 620, projectileCount: 2, pierce: 3, speed: 600, range: 500, description: '+40% Damage & Pierce +1' },
      { level: 3, damage: 55, cooldownMs: 540, projectileCount: 3, pierce: 3, speed: 640, range: 540, description: '+1 Additional Peacemaker round' },
      { level: 4, damage: 70, cooldownMs: 460, projectileCount: 4, pierce: 4, speed: 680, range: 560, description: 'High critical strike & 4 piercing rounds' },
      { level: 5, damage: 95, cooldownMs: 360, projectileCount: 5, pierce: 5, speed: 720, range: 600, description: 'Maximum Law & Order: 5 Armor-Piercing Shots' },
    ],
  },

  shotgun: {
    id: 'shotgun',
    name: 'Sawed-Off Shotgun',
    icon: 'shotgun',
    sound: 'shotgun',
    type: 'spread',
    levels: [
      { level: 1, damage: 20, cooldownMs: 1100, projectileCount: 5, pierce: 1, speed: 440, range: 340, description: '5-Pellet wide buckshot blast with knockback' },
      { level: 2, damage: 28, cooldownMs: 980, projectileCount: 6, pierce: 1, speed: 460, range: 360, description: '+1 Pellet & +40% Knockback force' },
      { level: 3, damage: 38, cooldownMs: 880, projectileCount: 7, pierce: 2, speed: 490, range: 380, description: '7 Pellets pierce front row bandits' },
      { level: 4, damage: 50, cooldownMs: 780, projectileCount: 8, pierce: 2, speed: 520, range: 400, description: 'Devastating street-sweeper spray' },
      { level: 5, damage: 72, cooldownMs: 650, projectileCount: 10, pierce: 3, speed: 560, range: 440, description: '10 Pellets blast away entire bandit waves!' },
    ],
  },

  rifle: {
    id: 'rifle',
    name: 'Winchester Repeater',
    icon: 'rifle',
    sound: 'rifle',
    type: 'directional',
    levels: [
      { level: 1, damage: 60, cooldownMs: 1200, projectileCount: 1, pierce: 3, speed: 750, range: 650, description: 'High-caliber bullet penetrates 3 targets in a line' },
      { level: 2, damage: 85, cooldownMs: 1050, projectileCount: 1, pierce: 4, speed: 800, range: 700, description: '+40% Sniper Damage & Pierce 4 enemies' },
      { level: 3, damage: 115, cooldownMs: 920, projectileCount: 2, pierce: 5, speed: 850, range: 750, description: 'Fires 2 high-velocity penetrating shots' },
      { level: 4, damage: 155, cooldownMs: 800, projectileCount: 2, pierce: 6, speed: 900, range: 800, description: 'Massive single-target & boss damage' },
      { level: 5, damage: 220, cooldownMs: 680, projectileCount: 3, pierce: 8, speed: 950, range: 850, description: 'Triple Winchester volley obliterates all in sight' },
    ],
  },

  dynamite: {
    id: 'dynamite',
    name: 'TNT Dynamite Sticks',
    icon: 'dynamite',
    sound: 'explosion',
    type: 'lob',
    levels: [
      { level: 1, damage: 70, cooldownMs: 2200, projectileCount: 1, pierce: 99, speed: 280, range: 320, description: 'Hurls burning TNT sticks that explode in an AOE' },
      { level: 2, damage: 95, cooldownMs: 1950, projectileCount: 1, pierce: 99, speed: 300, range: 350, description: '+35% Explosion Radius & Damage' },
      { level: 3, damage: 130, cooldownMs: 1700, projectileCount: 2, pierce: 99, speed: 320, range: 380, description: 'Hurls 2 dynamite sticks simultaneously' },
      { level: 4, damage: 180, cooldownMs: 1500, projectileCount: 2, pierce: 99, speed: 340, range: 400, description: 'High explosive dynamite clears crowded areas' },
      { level: 5, damage: 260, cooldownMs: 1200, projectileCount: 3, pierce: 99, speed: 360, range: 440, description: 'Triple TNT barrage creates massive crater blasts!' },
    ],
  },

  molotov: {
    id: 'molotov',
    name: 'Whiskey Molotov',
    icon: 'molotov',
    sound: 'explosion',
    type: 'lob',
    levels: [
      { level: 1, damage: 15, cooldownMs: 2400, projectileCount: 1, pierce: 99, speed: 260, range: 280, description: 'Shatters into a lingering fire patch on ground' },
      { level: 2, damage: 22, cooldownMs: 2100, projectileCount: 1, pierce: 99, speed: 280, range: 300, description: 'Fire burns for longer and inflicts +45% DPS' },
      { level: 3, damage: 32, cooldownMs: 1800, projectileCount: 2, pierce: 99, speed: 300, range: 320, description: 'Throws 2 Molotov bottles across the battlefield' },
      { level: 4, damage: 45, cooldownMs: 1550, projectileCount: 2, pierce: 99, speed: 320, range: 350, description: 'Larger blaze radius traps pursuing bandits' },
      { level: 5, damage: 65, cooldownMs: 1300, projectileCount: 3, pierce: 99, speed: 350, range: 380, description: 'Inferno barrier turns the ground into pure wildfire!' },
    ],
  },

  lasso: {
    id: 'lasso', name: 'Frontier Whip', icon: 'lasso', sound: 'revolver', type: 'sweep',
    levels: [
      { level: 1, damage: 28, cooldownMs: 1350, projectileCount: 1, pierce: 99, speed: 3, range: 130, description: 'A leather whip lashes through all enemies ahead' },
      { level: 2, damage: 40, cooldownMs: 1200, projectileCount: 1, pierce: 99, speed: 3.5, range: 150, description: 'Longer reach, stronger lash and faster recovery' },
      { level: 3, damage: 55, cooldownMs: 1100, projectileCount: 2, pierce: 99, speed: 4, range: 175, description: 'Strikes in front and behind with two whips' },
      { level: 4, damage: 75, cooldownMs: 1000, projectileCount: 2, pierce: 99, speed: 4.5, range: 200, description: 'Heavy leather sweeps a wider corridor' },
      { level: 5, damage: 100, cooldownMs: 900, projectileCount: 3, pierce: 99, speed: 5, range: 225, description: 'Three golden-edged lashes clear both flanks' },
    ],
  },

  // Armas Evoluídas (Vampire Survivors Style)
  desperado_fury: {
    id: 'desperado_fury',
    name: 'Desperado Fury',
    icon: 'revolver',
    sound: 'revolver',
    type: 'nearest',
    levels: [
      { level: 1, damage: 85, cooldownMs: 420, projectileCount: 6, pierce: 3, speed: 750, range: 600, description: 'Saraivada de balas explosivas perfurantes contínuas' },
    ],
  },

  blunderbuss_doom: {
    id: 'blunderbuss_doom',
    name: 'Doom Blunderbuss',
    icon: 'shotgun',
    sound: 'shotgun',
    type: 'spread',
    levels: [
      { level: 1, damage: 90, cooldownMs: 650, projectileCount: 12, pierce: 4, speed: 650, range: 500, description: '12 estilhaços devastadores com raio extremo e repulsão' },
    ],
  },

  golden_repeater: {
    id: 'golden_repeater',
    name: 'Golden Marshal',
    icon: 'rifle',
    sound: 'rifle',
    type: 'directional',
    levels: [
      { level: 1, damage: 280, cooldownMs: 600, projectileCount: 3, pierce: 99, speed: 1100, range: 900, description: 'Linha tripla de snipers dourados de perfuração ilimitada' },
    ],
  },

  hellfire_keg: {
    id: 'hellfire_keg',
    name: 'Hellfire Keg',
    icon: 'dynamite',
    sound: 'explosion',
    type: 'lob',
    levels: [
      { level: 1, damage: 330, cooldownMs: 1250, projectileCount: 3, pierce: 99, speed: 420, range: 500, description: 'Barris de pólvora que geram explosão maciça e chamas persistentes' },
    ],
  },

  cyclone_whip: {
    id: 'cyclone_whip',
    name: 'Cyclone Whip',
    icon: 'lasso',
    sound: 'revolver',
    type: 'sweep',
    levels: [
      { level: 1, damage: 130, cooldownMs: 800, projectileCount: 4, pierce: 99, speed: 6.5, range: 280, description: 'Quatro chicotes dourados atingem os dois flancos com alcance extremo' },
    ],
  },
};
