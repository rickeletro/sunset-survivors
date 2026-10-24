import { EVOLUTION_UNLOCK_SECONDS } from './economy';
export interface WeaponEvolution {
  baseWeaponId: string;
  requiredPassiveId: string;
  evolvedWeaponId: string;
  name: string;
  icon: string;
  description: string;
}

export const WEAPON_EVOLUTIONS: WeaponEvolution[] = [
  {
    baseWeaponId: 'revolver',
    requiredPassiveId: 'bandolier',
    evolvedWeaponId: 'desperado_fury',
    name: 'Desperado Fury',
    icon: 'revolver',
    description: 'EVOLUTION: Six piercing shots explode at the end of their flight!'
  },
  {
    baseWeaponId: 'shotgun',
    requiredPassiveId: 'spurs',
    evolvedWeaponId: 'blunderbuss_doom',
    name: 'Doom Blunderbuss',
    icon: 'shotgun',
    description: 'EVOLUTION: Twelve incendiary pellets with devastating knockback!'
  },
  {
    baseWeaponId: 'rifle',
    requiredPassiveId: 'badge',
    evolvedWeaponId: 'golden_repeater',
    name: 'Golden Marshal',
    icon: 'rifle',
    description: 'EVOLUTION: Three unlimited-piercing sniper shots ricochet off the screen edges!'
  },
  {
    baseWeaponId: 'dynamite',
    requiredPassiveId: 'whiskey',
    evolvedWeaponId: 'hellfire_keg',
    name: 'Hellfire Keg',
    icon: 'dynamite',
    description: 'EVOLUTION: Explosive barrels leave a vast pool of fire!'
  },
  {
    baseWeaponId: 'lasso',
    requiredPassiveId: 'magnet',
    evolvedWeaponId: 'cyclone_whip',
    name: 'Cyclone Whip',
    icon: 'lasso',
    description: 'EVOLUTION: Four golden whips sweep both flanks with extreme reach!'
  }
];

export function getEligibleEvolution(
  activeWeapons: Map<string, number>,
  activePassives: Map<string, number>,
  elapsedSeconds = 0
): WeaponEvolution | null {
  if (elapsedSeconds < EVOLUTION_UNLOCK_SECONDS) return null;
  for (const evo of WEAPON_EVOLUTIONS) {
    const wepLvl = activeWeapons.get(evo.baseWeaponId) || 0;
    const passLvl = activePassives.get(evo.requiredPassiveId) || 0;
    // Precisa arma no nível 5 (MAX) e passivo ao menos nível 1, e ainda não ter evoluído
    const alreadyEvolved = activeWeapons.has(evo.evolvedWeaponId);
    if (wepLvl >= 5 && passLvl >= 1 && !alreadyEvolved) {
      return evo;
    }
  }
  return null;
}
