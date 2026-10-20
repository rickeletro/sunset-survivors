import { PALETTE } from './palette';

/**
 * Sunset Survivors - Design Tokens & Theme
 * Foundation → semantic → component tokens for WESTERN PULP 98.
 */

export const THEME = {
  palette: PALETTE,
  layout: { referenceWidth: 1536, referenceHeight: 1024, spacing: 8 },
  layers: { ground: -10, scenery: 3, actor: 10, hud: 50, overlay: 80, modal: 100 },
  motion: { hover: 100, press: 60, release: 80 },
  colors: {
    // Parchment & Wanted Poster
    parchment: {
      light: '#f7e7c4',
      base: PALETTE.parchment,
      dark: '#c49a55',
      shadow: '#7a5223',
      border: '#452b14',
      ink: '#231407',
    },
    // Reward / Blood Red
    reward: {
      light: '#ff3b30',
      base: PALETTE.burntRed,
      dark: '#8b0e0e',
      glow: 'rgba(200, 29, 29, 0.6)',
    },
    // Gold & Coins
    gold: {
      light: '#ffe066',
      base: PALETTE.gold,
      dark: '#c69500',
      shimmer: '#fff2a8',
    },
    // Outlaw Simon Greedwell Purple
    greedwell: {
      light: '#b05aff',
      base: '#7c2db8',
      dark: '#4f167a',
    },
    // Character Signatures
    characters: {
      steve: {
        primary: '#ffe600',   // Electric Yellow
        accent: '#ff2a85',    // Pink Bandana / Hat
        trim: '#2a4480',      // Denim
        name: 'STEVE',
        title: 'The Quickdraw Gambler',
      },
      billy: {
        primary: '#0066ff',   // Royal Frontier Blue
        accent: '#00f0ff',    // Turquoise Neon
        trim: '#f8fafc',      // White Chaps
        name: 'BILLY',
        title: 'The Lawman Tracker',
      },
      bob: {
        primary: '#10b981',   // Forest Green
        accent: '#f59e0b',    // Golden Holster & Blonde
        trim: '#065f46',      // Dark Green
        name: 'BOB',
        title: 'The Frontier Sharpshooter',
      },
      cormano: {
        primary: '#e11d74',   // Hot Magenta Poncho
        accent: '#8b5cf6',    // Sombrero Purple
        trim: '#dc2626',      // Scarlet Chaps
        name: 'CORMANO',
        title: 'The Avenging Vigilante',
      },
    },
    // UI Elements
    ui: {
      background: PALETTE.charcoal,
      cardBg: 'rgba(25, 14, 9, 0.92)',
      cardBorder: '#c49a55',
      cardSelected: '#ffe066',
      hpGreen: '#22c55e',
      hpRed: '#ef4444',
      xpBlue: '#38bdf8',
      textMuted: '#a38a74',
      white: '#ffffff',
    },
  },

  typography: {
    narrativeFont: '"Roboto Slab", serif',
    pixelFont: '"Press Start 2P", monospace',
    westernFont: '"Rye", serif',
    sizes: {
      xs: '10px',
      sm: '12px',
      md: '16px',
      lg: '20px',
      xl: '28px',
      title: '40px',
    },
  },

};
