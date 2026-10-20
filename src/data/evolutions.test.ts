import { describe, it, expect } from 'vitest';
import { WEAPON_EVOLUTIONS, getEligibleEvolution } from './evolutions';

describe('Evolution Rules', () => {
  it('contém exatamente as 5 evoluções canônicas configuradas', () => {
    expect(WEAPON_EVOLUTIONS).toHaveLength(5);
    const expected = [
      { base: 'revolver', passive: 'bandolier', evolved: 'desperado_fury' },
      { base: 'shotgun', passive: 'spurs', evolved: 'blunderbuss_doom' },
      { base: 'rifle', passive: 'badge', evolved: 'golden_repeater' },
      { base: 'dynamite', passive: 'whiskey', evolved: 'hellfire_keg' },
      { base: 'lasso', passive: 'magnet', evolved: 'cyclone_whip' },
    ];

    expected.forEach((pair) => {
      const found = WEAPON_EVOLUTIONS.find(
        (e) => e.baseWeaponId === pair.base && e.requiredPassiveId === pair.passive
      );
      expect(found, `Evolução para ${pair.base} + ${pair.passive}`).toBeDefined();
      expect(found?.evolvedWeaponId).toBe(pair.evolved);
    });
  });

  it('não oferece evolução se a arma não estiver no nível 5', () => {
    const weapons = new Map<string, number>([['revolver', 4]]);
    const passives = new Map<string, number>([['bandolier', 1]]);
    const evo = getEligibleEvolution(weapons, passives, 240);
    expect(evo).toBeNull();
  });

  it('não oferece evolução se o passivo correspondente não estiver equipado (nível 0)', () => {
    const weapons = new Map<string, number>([['revolver', 5]]);
    const passives = new Map<string, number>();
    const evo = getEligibleEvolution(weapons, passives, 240);
    expect(evo).toBeNull();
  });

  it('oferece evolução quando arma estiver nível 5 e passivo nível >= 1', () => {
    const weapons = new Map<string, number>([['revolver', 5]]);
    const passives = new Map<string, number>([['bandolier', 1]]);
    const evo = getEligibleEvolution(weapons, passives, 240);
    expect(evo).not.toBeNull();
    expect(evo?.evolvedWeaponId).toBe('desperado_fury');
  });

  it('holds evolutions until minute four, even for a complete recipe', () => {
    expect(getEligibleEvolution(new Map([['revolver', 5]]), new Map([['bandolier', 1]]), 239)).toBeNull();
  });

  it('não oferece evolução novamente se o jogador já possui a arma evoluída', () => {
    const weapons = new Map<string, number>([
      ['revolver', 5],
      ['desperado_fury', 1],
    ]);
    const passives = new Map<string, number>([['bandolier', 3]]);
    const evo = getEligibleEvolution(weapons, passives, 240);
    expect(evo).toBeNull();
  });
});
