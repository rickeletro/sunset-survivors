/**
 * Sunset Survivors - Design Tokens & Theme
 * Based on Sunset Riders (SNES / Arcade) 16-bit Western Color Palette
 */

export const THEME = {
  colors: {
    // Parchment & Wanted Poster
    parchment: {
      light: '#f7e7c4',
      base: '#e8c48a',
      dark: '#c49a55',
      shadow: '#7a5223',
      border: '#452b14',
      ink: '#231407',
    },
    // Reward / Blood Red
    reward: {
      light: '#ff3b30',
      base: '#c81d1d',
      dark: '#8b0e0e',
      glow: 'rgba(200, 29, 29, 0.6)',
    },
    // Gold & Coins
    gold: {
      light: '#ffe066',
      base: '#f5c518',
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
      background: '#0d0705',
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

  borders: {
    wanted: '4px solid #452b14',
    card: '3px solid #8b5a2b',
    goldGlow: '0 0 12px rgba(245, 197, 24, 0.8)',
    redGlow: '0 0 16px rgba(200, 29, 29, 0.9)',
  },

  audio: {
    masterVolume: 0.8,
    sfxVolume: 0.9,
    bgmVolume: 0.6,
  },
};
