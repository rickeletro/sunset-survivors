import { describe, expect, it } from 'vitest';
import { colorNumber, PALETTE } from './palette';
import { THEME } from './tokens';
import { BUTTON_STYLES } from './buttons';

describe('Western Pulp design system', () => {
  it('exposes all nine canonical foundation colors and semantic roles', () => {
    expect(Object.values(PALETTE)).toEqual(['#A51E16', '#E52B20', '#FF791C', '#FFC52A', '#F2D49A', '#603719', '#321B10', '#120B08', '#572449']);
    expect(THEME.colors.gold.base).toBe(PALETTE.gold);
    expect(THEME.colors.parchment.base).toBe(PALETTE.parchment);
    expect(colorNumber(PALETTE.gold)).toBe(0xffc52a);
  });
  it('gives every shared button variant explicit idle and hover styles', () => {
    expect(Object.keys(BUTTON_STYLES)).toEqual(['gold', 'danger', 'parchment', 'wood']);
    for (const variant of Object.values(BUTTON_STYLES)) {
      for (const state of Object.values(variant)) {
        expect(state.background).toBeGreaterThanOrEqual(0);
        expect(state.background).toBeLessThanOrEqual(0xffffff);
        expect(state.text).toMatch(/^#[0-9a-f]{6}$/i);
      }
    }
  });
});
