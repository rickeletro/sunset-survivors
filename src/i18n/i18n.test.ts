import { beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from './locales/en';
import { pt } from './locales/pt';
import { getLocale, onLocaleChange, setLocale, t, toggleLocale, getServiceName } from './index';

describe('i18n internationalization manager', () => {
  beforeEach(() => {
    setLocale('pt');
  });

  it('defaults to Portuguese', () => {
    expect(getLocale()).toBe('pt');
    expect(t('common.start')).toBe('JOGAR');
    expect(t('common.menu')).toBe('MENU');
    expect(t('tutorial.howToMove')).toBe('COMO SE MOVER');
  });

  it('switches to English and returns translated copy', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('common.start')).toBe('PLAY');
    expect(t('tutorial.howToMove')).toBe('HOW TO MOVE');
  });

  it('toggles locale between pt and en seamlessly', () => {
    expect(getLocale()).toBe('pt');
    const next = toggleLocale();
    expect(next).toBe('en');
    expect(getLocale()).toBe('en');
    expect(t('common.start')).toBe('PLAY');

    const back = toggleLocale();
    expect(back).toBe('pt');
    expect(getLocale()).toBe('pt');
    expect(t('common.start')).toBe('JOGAR');
  });

  it('notifies subscribers upon locale changes', () => {
    const listener = vi.fn();
    const unsubscribe = onLocaleChange(listener);

    setLocale('en');
    expect(listener).toHaveBeenCalledWith('en');

    setLocale('pt');
    expect(listener).toHaveBeenCalledWith('pt');

    unsubscribe();
    setLocale('en');
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('supports variable interpolation in strings', () => {
    setLocale('pt');
    expect(t('combat.stageBanner', { stage: 1, title: 'Cânion Seco' })).toBe('FASE 1 — Cânion Seco');

    setLocale('en');
    expect(t('combat.stageBanner', { stage: 1, title: 'Dusty Gulch' })).toBe('STAGE 1 — Dusty Gulch');
  });

  it('translates hospitality and saloon service names and building signs', () => {
    setLocale('pt');
    expect(getServiceName('hospitality_rest')).toBe('QUARTO & DESCANSO');
    expect(getServiceName('special_rounds')).toBe('MUNIÇÃO ESPECIAL');
    expect(getServiceName('gun_oil')).toBe('ÓLEO DE ARMA');
    expect(t('saloon.walletBalance', { bounty: '$100' })).toBe('CARTEIRA $100 • SALVO ENTRE PARTIDAS');
    expect(t('saloon.portalHospitality')).toBe('HOSPITALIDADE • DESCANSO & SUPRIMENTOS');

    setLocale('en');
    expect(getServiceName('hospitality_rest')).toBe('ROOM & REST');
    expect(getServiceName('special_rounds')).toBe('SPECIAL ROUNDS');
    expect(getServiceName('gun_oil')).toBe('GUN OIL');
    expect(t('saloon.walletBalance', { bounty: '$100' })).toBe('WALLET $100 • SAVED BETWEEN RUNS');
    expect(t('saloon.portalHospitality')).toBe('HOSPITALITY • PAID REST & SUPPLIES');
  });

  it('has 100% key parity between PT and EN dictionaries', () => {
    function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      let keys: string[] = [];
      for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (typeof v === 'object' && v !== null) {
          keys = keys.concat(collectKeys(v as Record<string, unknown>, fullKey));
        } else {
          keys.push(fullKey);
        }
      }
      return keys.sort();
    }

    const ptKeys = collectKeys(pt as unknown as Record<string, unknown>);
    const enKeys = collectKeys(en as unknown as Record<string, unknown>);

    expect(ptKeys).toEqual(enKeys);
    expect(ptKeys.length).toBeGreaterThan(30);
  });
});
