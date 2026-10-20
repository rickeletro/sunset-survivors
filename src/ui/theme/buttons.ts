import { colorNumber, PALETTE } from './palette';

export type ButtonVariant = 'gold' | 'wood' | 'parchment' | 'danger';
const n = colorNumber;
/** Component tokens derive from foundation colors; state behavior lives in the button. */
export const BUTTON_STYLES = {
  gold: { idle: { background: 0xcc7711, border: n(PALETTE.gold), text: PALETTE.charcoal }, hover: { background: 0xffa01a, border: n(PALETTE.gold), text: PALETTE.charcoal } },
  danger: { idle: { background: n(PALETTE.burntRed), border: 0xff6659, text: '#ffffff' }, hover: { background: n(PALETTE.actionRed), border: 0xff6659, text: '#ffffff' } },
  parchment: { idle: { background: n(PALETTE.parchment), border: n(PALETTE.wood), text: '#2b1d0c' }, hover: { background: 0xf5deb3, border: n(PALETTE.wood), text: '#2b1d0c' } },
  wood: { idle: { background: n(PALETTE.darkWood), border: 0x8b5a2b, text: PALETTE.parchment }, hover: { background: 0x4a2a16, border: n(PALETTE.gold), text: '#ffe066' } },
} satisfies Record<ButtonVariant, Record<'idle' | 'hover', { background: number; border: number; text: string }>>;
