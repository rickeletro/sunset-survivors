import { describe, it, expect } from 'vitest';
import { WEAPONS } from './weapons';
import { PASSIVES } from './passives';
import { CHARACTERS } from './characters';

describe('Game Data & Progression Rules', () => {
  describe('Weapons', () => {
    it('todas as armas base possuem 5 níveis com configurações válidas', () => {
      const baseWeapons = ['revolver', 'peacemaker', 'shotgun', 'rifle', 'dynamite', 'molotov', 'lasso'];
      for (const id of baseWeapons) {
        const weapon = WEAPONS[id];
        expect(weapon, `Arma ${id} deve existir`).toBeDefined();
        expect(weapon.levels).toHaveLength(5);
        weapon.levels.forEach((lvl, idx) => {
          expect(lvl.level).toBe(idx + 1);
          expect(lvl.damage).toBeGreaterThan(0);
          expect(lvl.cooldownMs).toBeGreaterThan(0);
          expect(lvl.projectileCount).toBeGreaterThan(0);
          expect(lvl.description).toBeTruthy();
        });
      }
    });

    it('as 5 armas evoluídas existem e possuem dano avassalador', () => {
      const evolvedWeapons = ['desperado_fury', 'blunderbuss_doom', 'golden_repeater', 'hellfire_keg', 'cyclone_whip'];
      for (const id of evolvedWeapons) {
        const weapon = WEAPONS[id];
        expect(weapon, `Arma evoluída ${id} deve existir`).toBeDefined();
        expect(weapon.levels.length).toBeGreaterThanOrEqual(1);
        expect(weapon.levels[0].damage).toBeGreaterThan(50);
      }
    });
  });

  describe('Passives', () => {
    it('todos os passivos possuem 5 níveis com descrições e efeitos consistentes', () => {
      const passiveKeys = ['badge', 'spurs', 'whiskey', 'bandolier', 'magnet'];
      for (const id of passiveKeys) {
        const passive = PASSIVES[id];
        expect(passive, `Passivo ${id} deve existir`).toBeDefined();
        expect(passive.levels).toHaveLength(5);
        passive.levels.forEach((lvl, idx) => {
          expect(lvl.level).toBe(idx + 1);
          expect(lvl.effect).toBeDefined();
          expect(Object.keys(lvl.effect).length).toBeGreaterThan(0);
          expect(lvl.description).toBeTruthy();
        });
      }
    });
  });

  describe('Protagonistas (Os Quatro)', () => {
    it('os quatro heróis canônicos existem com suas armas iniciais corretas', () => {
      const heroKeys = Object.keys(CHARACTERS);
      expect(heroKeys).toHaveLength(4);

      expect(CHARACTERS.steve.starterWeapon).toBe('revolver');
      expect(CHARACTERS.billy.starterWeapon).toBe('peacemaker');
      expect(CHARACTERS.bob.starterWeapon).toBe('rifle');
      expect(CHARACTERS.cormano.starterWeapon).toBe('shotgun');
    });
  });

  describe('HUD Western Pulp 98 Arcade Specifications', () => {
    it('formata o bounty/dinheiro no padrao arcade de 6 digitos', () => {
      const formatGold = (gold: number) => `$${String(gold).padStart(6, '0')}`;
      expect(formatGold(0)).toBe('$000000');
      expect(formatGold(45)).toBe('$000045');
      expect(formatGold(1234)).toBe('$001234');
      expect(formatGold(999999)).toBe('$999999');
    });

    it('formata o contador de caveiras/kills no padrao arcade de 4 digitos', () => {
      const formatKills = (kills: number) => String(kills).padStart(4, '0');
      expect(formatKills(0)).toBe('0000');
      expect(formatKills(7)).toBe('0007');
      expect(formatKills(89)).toBe('0089');
      expect(formatKills(1250)).toBe('1250');
    });

    it('formata a barra de vida com HP atual e maximo limpo', () => {
      const formatHp = (hp: number, maxHp: number) => `${Math.max(0, Math.round(hp))} / ${maxHp}`;
      expect(formatHp(100, 100)).toBe('100 / 100');
      expect(formatHp(45.2, 120)).toBe('45 / 120');
      expect(formatHp(-5, 100)).toBe('0 / 100');
    });

    it('todos os 4 herois possuem identificadores mapeaveis para hud_avatar', () => {
      const heroIds = Object.keys(CHARACTERS);
      for (const id of heroIds) {
        expect(['steve', 'billy', 'bob', 'cormano']).toContain(id);
      }
    });
  });
});

