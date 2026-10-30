import { en } from './locales/en';
import { pt } from './locales/pt';
import type { Locale, TranslationDictionary, TranslationKey } from './types';

const STORAGE_KEY = 'sunset_survivors_locale_v1';
const DEFAULT_LOCALE: Locale = 'pt';

interface StorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const dictionaries: Record<Locale, TranslationDictionary> = {
  pt,
  en,
};

class I18nManager {
  private currentLocale: Locale;
  private listeners: Set<(locale: Locale) => void> = new Set();
  private storage: () => StorageProvider;

  constructor(storage: () => StorageProvider = () => globalThis.localStorage) {
    this.storage = storage;
    this.currentLocale = this.loadLocale();
  }

  private loadLocale(): Locale {
    try {
      const saved = this.storage()?.getItem?.(STORAGE_KEY);
      if (saved === 'en' || saved === 'pt') {
        return saved;
      }
    } catch {
      // Fallback for private browsing or environments without localStorage
    }
    return DEFAULT_LOCALE;
  }

  public getLocale(): Locale {
    return this.currentLocale;
  }

  public setLocale(locale: Locale): void {
    if (locale !== 'pt' && locale !== 'en') return;
    if (this.currentLocale === locale) return;
    this.currentLocale = locale;

    try {
      this.storage()?.setItem?.(STORAGE_KEY, locale);
    } catch {
      // Safe fallback
    }

    for (const listener of this.listeners) {
      try {
        listener(locale);
      } catch {
        // Listener error safety
      }
    }
  }

  public toggleLocale(): Locale {
    const next: Locale = this.currentLocale === 'pt' ? 'en' : 'pt';
    this.setLocale(next);
    return next;
  }

  public onLocaleChange(listener: (locale: Locale) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public t(key: TranslationKey, params?: Record<string, string | number>): string {
    const dict = dictionaries[this.currentLocale] ?? dictionaries[DEFAULT_LOCALE];
    const path = key.split('.');

    let current: unknown = dict;
    for (const segment of path) {
      if (current && typeof current === 'object' && segment in current) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        // Fallback to English dictionary if key missing in current
        current = undefined;
        break;
      }
    }

    if (current === undefined) {
      let fallbackCurrent: unknown = dictionaries.en;
      for (const segment of path) {
        if (fallbackCurrent && typeof fallbackCurrent === 'object' && segment in fallbackCurrent) {
          fallbackCurrent = (fallbackCurrent as Record<string, unknown>)[segment];
        } else {
          fallbackCurrent = key;
          break;
        }
      }
      current = fallbackCurrent;
    }

    let text = typeof current === 'string' ? current : key;

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replaceAll(`{${k}}`, String(v));
      }
    }

    return text;
  }
}

export const i18n = new I18nManager();
export const t = (key: TranslationKey, params?: Record<string, string | number>) => i18n.t(key, params);
export const getLocale = () => i18n.getLocale();
export const setLocale = (locale: Locale) => i18n.setLocale(locale);
export const toggleLocale = () => i18n.toggleLocale();
export const onLocaleChange = (listener: (locale: Locale) => void) => i18n.onLocaleChange(listener);

export function getStageTitle(stageId: number, fallback = ''): string {
  const key = `stages.stage${stageId}Title` as TranslationKey;
  const res = t(key);
  return res === key ? fallback : res;
}

export function getStageHazard(stageId: number, fallback = ''): string {
  const key = `stages.stage${stageId}Hazard` as TranslationKey;
  const res = t(key);
  return res === key ? fallback : res;
}

export function getStageObjective(stageId: number, fallback = ''): string {
  const key = `stages.stage${stageId}Objective` as TranslationKey;
  const res = t(key);
  return res === key ? fallback : res;
}

export function getConsumableCopy(id: string): { name: string; desc: string; banner: string } {
  const nameKey = `consumables.${id}Name` as TranslationKey;
  const descKey = `consumables.${id}Desc` as TranslationKey;
  const bannerKey = `consumables.${id}Banner` as TranslationKey;
  return {
    name: t(nameKey),
    desc: t(descKey),
    banner: t(bannerKey),
  };
}

export function getCharacterCopy(charKey: string): {
  name: string;
  title: string;
  bio: string;
  quote: string;
  specialBonus: string;
  styleName: string;
  styleDesc: string;
} {
  return {
    name: t(`characterSelect.${charKey}Name` as TranslationKey),
    title: t(`characterSelect.${charKey}Title` as TranslationKey),
    bio: t(`characterSelect.${charKey}Bio` as TranslationKey),
    quote: t(`characterSelect.${charKey}Quote` as TranslationKey),
    specialBonus: t(`characterSelect.${charKey}Bonus` as TranslationKey),
    styleName: t(`characterSelect.${charKey}StyleName` as TranslationKey),
    styleDesc: t(`characterSelect.${charKey}StyleDesc` as TranslationKey),
  };
}

export function getUpgradeName(id: string, fallback = ''): string {
  const key = `upgrades.${id}Name` as TranslationKey;
  const res = t(key);
  return res === key ? fallback : res;
}

export function getUpgradeDesc(id: string, fallback = ''): string {
  const cap = id.charAt(0).toUpperCase() + id.slice(1);
  const key = `upgrades.desc${cap}` as TranslationKey;
  const res = t(key);
  return res === key ? fallback : res;
}

export function getServiceName(id: string, fallback = ''): string {
  switch (id) {
    case 'hospitality_rest':
      return t('saloon.serviceRoomRest');
    case 'saloon_rest':
      return t('saloon.serviceSaloonTonic');
    case 'special_rounds':
      return t('saloon.serviceSpecialRounds');
    case 'gun_oil':
      return t('saloon.serviceGunOil');
    case 'gallery':
      return t('saloon.serviceGallery');
    default:
      return fallback || id;
  }
}
