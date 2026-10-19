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
    description: 'EVOLUÇÃO: Saraivada contínua de 8 tiros perfurantes que explodem ao final do trajeto!'
  },
  {
    baseWeaponId: 'shotgun',
    requiredPassiveId: 'spurs',
    evolvedWeaponId: 'blunderbuss_doom',
    name: 'Doom Blunderbuss',
    icon: 'shotgun',
    description: 'EVOLUÇÃO: Disparo frontal maciço de 16 estilhaços incendiários com repulsão avassaladora!'
  },
  {
    baseWeaponId: 'rifle',
    requiredPassiveId: 'badge',
    evolvedWeaponId: 'golden_repeater',
    name: 'Golden Marshal',
    icon: 'rifle',
    description: 'EVOLUÇÃO: Disparo de sniper de perfuração infinita que ricocheteia nos limites de tela!'
  },
  {
    baseWeaponId: 'dynamite',
    requiredPassiveId: 'whiskey',
    evolvedWeaponId: 'hellfire_keg',
    name: 'Hellfire Keg',
    icon: 'dynamite',
    description: 'EVOLUÇÃO: Barris explosivos que deixam um lago de fogo gigante após a detonação!'
  },
  {
    baseWeaponId: 'lasso',
    requiredPassiveId: 'magnet',
    evolvedWeaponId: 'cyclone_whip',
    name: 'Cyclone Whip',
    icon: 'lasso',
    description: 'EVOLUÇÃO: 4 chicotes de alta velocidade com área estendida que puxam XP para o centro!'
  }
];

export function getEligibleEvolution(
  activeWeapons: Map<string, number>,
  activePassives: Map<string, number>
): WeaponEvolution | null {
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
