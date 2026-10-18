export interface CharacterData {
  id: 'steve' | 'billy' | 'bob' | 'cormano';
  name: string;
  title: string;
  subtitle: string;
  quote: string;
  starterWeapon: string;
  portraitX: number; // 0, 1, 2, 3 index in character select texture
  primaryColor: string;
  accentColor: string;
  stats: {
    maxHp: number;
    moveSpeed: number;
    damageMultiplier: number;
    fireRateMultiplier: number;
    magnetRadius: number;
    critChance: number;
    armor: number;
  };
  specialBonus: string;
}

export const CHARACTERS: Record<string, CharacterData> = {
  steve: {
    id: 'steve',
    name: 'STEVE',
    title: 'THE QUICKDRAW GAMBLER',
    subtitle: 'Dual Colt .45 Revolvers',
    quote: '"Draw fast or kiss the prairie dust!"',
    starterWeapon: 'revolver',
    portraitX: 0,
    primaryColor: '#ffe600',
    accentColor: '#ff2a85',
    stats: {
      maxHp: 100,
      moveSpeed: 190,
      damageMultiplier: 1.0,
      fireRateMultiplier: 1.25,
      magnetRadius: 100,
      critChance: 0.15,
      armor: 0,
    },
    specialBonus: '+25% Fire Rate & +15% Movement Speed',
  },

  billy: {
    id: 'billy',
    name: 'BILLY',
    title: 'THE LAWMAN TRACKER',
    subtitle: 'Twin Peacemakers',
    quote: '"Justice rides with me across the frontier."',
    starterWeapon: 'peacemaker',
    portraitX: 1,
    primaryColor: '#0066ff',
    accentColor: '#00f0ff',
    stats: {
      maxHp: 110,
      moveSpeed: 175,
      damageMultiplier: 1.15,
      fireRateMultiplier: 1.1,
      magnetRadius: 130,
      critChance: 0.25,
      armor: 1,
    },
    specialBonus: '+25% Critical Hit Chance & Piercing Bullets',
  },

  bob: {
    id: 'bob',
    name: 'BOB',
    title: 'THE FRONTIER SHARPSHOOTER',
    subtitle: 'Winchester Repeater 1873',
    quote: '"One shot, one less vulture on the tracks."',
    starterWeapon: 'rifle',
    portraitX: 2,
    primaryColor: '#10b981',
    accentColor: '#f59e0b',
    stats: {
      maxHp: 120,
      moveSpeed: 160,
      damageMultiplier: 1.4,
      fireRateMultiplier: 0.9,
      magnetRadius: 110,
      critChance: 0.1,
      armor: 2,
    },
    specialBonus: '+40% Bullet Damage & Penetrates 3 Targets',
  },

  cormano: {
    id: 'cormano',
    name: 'CORMANO',
    title: 'THE AVENGING VIGILANTE',
    subtitle: 'Double-Barrel Sawed-Off Shotgun',
    quote: '"¡Adios, amigo! Esta va por mi pueblo."',
    starterWeapon: 'shotgun',
    portraitX: 3,
    primaryColor: '#e11d74',
    accentColor: '#8b5cf6',
    stats: {
      maxHp: 150,
      moveSpeed: 165,
      damageMultiplier: 1.2,
      fireRateMultiplier: 0.95,
      magnetRadius: 120,
      critChance: 0.15,
      armor: 3,
    },
    specialBonus: '+50 Max HP & 5-Spread Buckshot with Heavy Knockback',
  },
};
