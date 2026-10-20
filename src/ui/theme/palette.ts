/** Foundation tokens: proprietary WESTERN PULP '98 palette. */
export const PALETTE = {
  burntRed: '#A51E16', actionRed: '#E52B20', sunset: '#FF791C', gold: '#FFC52A',
  parchment: '#F2D49A', wood: '#603719', darkWood: '#321B10', charcoal: '#120B08', mountain: '#572449',
} as const;

export function colorNumber(hex: string): number { return Number.parseInt(hex.replace('#', ''), 16); }
