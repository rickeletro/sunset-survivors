/**
 * 64x64 SVG Icons for Sunset Survivors
 * Styled with retro western colors, crisp outlines and high contrast
 */

export const SVG_ICONS = {
  // Dual Revolvers
  revolver: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- Gun Barrel & Cylinder -->
      <path d="M12 28H38V36H12V28Z" fill="#94a3b8" stroke="#000" stroke-width="2"/>
      <path d="M30 24H44V40H30V24Z" fill="#64748b" stroke="#000" stroke-width="2"/>
      <circle cx="37" cy="32" r="3" fill="#cbd5e1"/>
      <path d="M12 30H8V34H12V30Z" fill="#475569" stroke="#000" stroke-width="2"/>
      <!-- Wooden Handle -->
      <path d="M40 36L48 52C48 54 44 56 38 54L34 38L40 36Z" fill="#b45309" stroke="#451a03" stroke-width="2"/>
      <path d="M28 36C28 42 34 42 34 36" stroke="#f59e0b" stroke-width="2"/>
      <!-- Gold accents -->
      <circle cx="42" cy="46" r="2" fill="#f5c518"/>
      <!-- Spark / muzzle flare -->
      <polygon points="6,32 10,29 10,35" fill="#f59e0b"/>
    </svg>
  `,

  // Sawed-Off Shotgun
  shotgun: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- Twin Heavy Barrels -->
      <path d="M10 24H36V32H10V24Z" fill="#475569" stroke="#000" stroke-width="2"/>
      <path d="M10 32H36V40H10V32Z" fill="#334155" stroke="#000" stroke-width="2"/>
      <!-- Breech & Stock -->
      <path d="M36 26H44V38H36V26Z" fill="#e11d74" stroke="#000" stroke-width="2"/>
      <path d="M44 30L56 46C56 50 50 52 44 48L38 38L44 30Z" fill="#78350f" stroke="#451a03" stroke-width="2"/>
      <circle cx="48" cy="42" r="3" fill="#f59e0b"/>
      <!-- Blast pellets -->
      <circle cx="6" cy="27" r="2" fill="#ef4444"/>
      <circle cx="4" cy="32" r="2.5" fill="#f59e0b"/>
      <circle cx="6" cy="37" r="2" fill="#ef4444"/>
    </svg>
  `,

  // Winchester Repeater Rifle
  rifle: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- Long Barrel -->
      <path d="M8 28H44V32H8V28Z" fill="#94a3b8" stroke="#000" stroke-width="2"/>
      <path d="M8 33H40V36H8V33Z" fill="#64748b" stroke="#000" stroke-width="1.5"/>
      <!-- Brass Receiver -->
      <path d="M38 27H46V38H38V27Z" fill="#f59e0b" stroke="#78350f" stroke-width="2"/>
      <!-- Full Wooden Stock -->
      <path d="M46 29L58 42C58 48 52 50 46 45L42 37L46 29Z" fill="#92400e" stroke="#451a03" stroke-width="2"/>
      <!-- Lever action -->
      <path d="M36 38C36 44 42 44 42 38" stroke="#f59e0b" stroke-width="2"/>
    </svg>
  `,

  // Dynamite Bundle
  dynamite: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- Sticks of TNT -->
      <rect x="18" y="22" width="10" height="32" rx="2" fill="#c81d1d" stroke="#000" stroke-width="2"/>
      <rect x="28" y="20" width="10" height="34" rx="2" fill="#dc2626" stroke="#000" stroke-width="2"/>
      <rect x="38" y="22" width="10" height="32" rx="2" fill="#b91c1c" stroke="#000" stroke-width="2"/>
      <!-- Black tying bands -->
      <rect x="16" y="28" width="34" height="5" fill="#1c1917"/>
      <rect x="16" y="44" width="34" height="5" fill="#1c1917"/>
      <!-- Fuses -->
      <path d="M23 22C23 16 32 18 33 12" stroke="#d97706" stroke-width="2"/>
      <path d="M33 20C33 14 34 12 35 10" stroke="#d97706" stroke-width="2"/>
      <path d="M43 22C43 17 36 16 35 10" stroke="#d97706" stroke-width="2"/>
      <!-- Spark -->
      <circle cx="35" cy="9" r="4" fill="#fbbf24"/>
      <polygon points="35,3 37,8 41,9 37,11 35,15 33,11 29,9 33,8" fill="#ef4444"/>
    </svg>
  `,

  // Molotov Cocktail
  molotov: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- Glass Bottle -->
      <path d="M28 26V20H36V26L44 32V50C44 53 41 55 38 55H26C23 55 20 53 20 50V32L28 26Z" fill="#047857" stroke="#064e3b" stroke-width="2"/>
      <rect x="22" y="34" width="20" height="16" fill="#f59e0b" opacity="0.85"/>
      <!-- Cloth wick -->
      <path d="M30 20L34 12L38 15L34 20H30Z" fill="#e2e8f0" stroke="#475569" stroke-width="1.5"/>
      <!-- Flame -->
      <path d="M34 6C31 10 38 12 36 16C38 15 41 12 40 9C38 6 36 5 34 6Z" fill="#f59e0b"/>
      <circle cx="36" cy="11" r="2.5" fill="#ef4444"/>
    </svg>
  `,

  // Sheriff's Star Badge
  sheriff_badge: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- 6-Pointed Star -->
      <g transform="translate(32,32)">
        <polygon points="0,-22 6,-8 21,-9 11,2 17,16 3,10 0,22 -6,10 -17,16 -11,2 -21,-9 -6,-8" 
          fill="#f5c518" stroke="#78350f" stroke-width="2"/>
        <circle cx="0" cy="0" r="8" fill="#d97706" stroke="#78350f" stroke-width="1.5"/>
        <circle cx="0" cy="-22" r="3" fill="#ffe066" stroke="#78350f" stroke-width="1"/>
        <circle cx="21" cy="-9" r="3" fill="#ffe066" stroke="#78350f" stroke-width="1"/>
        <circle cx="17" cy="16" r="3" fill="#ffe066" stroke="#78350f" stroke-width="1"/>
        <circle cx="0" cy="22" r="3" fill="#ffe066" stroke="#78350f" stroke-width="1"/>
        <circle cx="-17" cy="16" r="3" fill="#ffe066" stroke="#78350f" stroke-width="1"/>
        <circle cx="-21" cy="-9" r="3" fill="#ffe066" stroke="#78350f" stroke-width="1"/>
        <circle cx="0" cy="0" r="4" fill="#fef08a"/>
      </g>
    </svg>
  `,

  // Silver Spurs
  spurs: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- U-Shaped Heel Band -->
      <path d="M16 46C16 30 26 22 40 22C44 22 48 24 50 26" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round"/>
      <path d="M40 22L48 14" stroke="#94a3b8" stroke-width="4"/>
      <!-- Rowel (Spinning Star) -->
      <g transform="translate(50, 12)">
        <polygon points="0,-8 3,-3 8,-4 4,1 7,6 1,4 -2,8 -3,3 -8,3 -4,-1 -6,-6 -1,-4" fill="#f1f5f9" stroke="#475569" stroke-width="1.5"/>
        <circle cx="0" cy="0" r="3" fill="#38bdf8"/>
      </g>
      <!-- Leather Buckle -->
      <rect x="12" y="42" width="10" height="12" rx="2" fill="#78350f" stroke="#000" stroke-width="2"/>
      <circle cx="17" cy="48" r="2" fill="#f5c518"/>
    </svg>
  `,

  // Whiskey Canteen
  whiskey: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- Flask Body -->
      <circle cx="32" cy="36" r="18" fill="#c49a55" stroke="#452b14" stroke-width="2"/>
      <circle cx="32" cy="36" r="14" fill="#a16207"/>
      <!-- Spout and Cork -->
      <rect x="28" y="14" width="8" height="6" fill="#78350f" stroke="#000" stroke-width="1.5"/>
      <rect x="29" y="10" width="6" height="5" fill="#fde047" stroke="#854d0e" stroke-width="1"/>
      <!-- Cross Pattern -->
      <path d="M32 26V46M22 36H42" stroke="#452b14" stroke-width="2"/>
      <circle cx="32" cy="36" r="4" fill="#22c55e"/>
    </svg>
  `,

  // Bandolier
  bandolier: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- Diagonal Leather Strap -->
      <path d="M8 56L56 8" stroke="#78350f" stroke-width="12" stroke-linecap="round"/>
      <path d="M8 56L56 8" stroke="#451a03" stroke-width="12" stroke-dasharray="2 10" stroke-linecap="round"/>
      <!-- Bullets inserted in strap -->
      <circle cx="16" cy="48" r="3.5" fill="#f5c518" stroke="#000" stroke-width="1"/>
      <circle cx="24" cy="40" r="3.5" fill="#f5c518" stroke="#000" stroke-width="1"/>
      <circle cx="32" cy="32" r="3.5" fill="#f5c518" stroke="#000" stroke-width="1"/>
      <circle cx="40" cy="24" r="3.5" fill="#f5c518" stroke="#000" stroke-width="1"/>
      <circle cx="48" cy="16" r="3.5" fill="#f5c518" stroke="#000" stroke-width="1"/>
    </svg>
  `,

  // Gold Nugget
  gold_nugget: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- Sparkling Gold Nugget -->
      <polygon points="18,36 24,18 42,16 50,28 46,46 30,50 16,42" fill="#f5c518" stroke="#78350f" stroke-width="2"/>
      <polygon points="24,18 42,16 36,30 22,28" fill="#fef08a"/>
      <polygon points="36,30 50,28 46,46 34,40" fill="#d97706"/>
      <polygon points="22,28 34,40 30,50 16,42 18,36" fill="#b45309"/>
      <!-- Sparkle -->
      <polygon points="46,14 48,10 52,12 49,15 51,18 47,16 44,19 45,15" fill="#ffffff"/>
    </svg>
  `,

  // Spinning Lasso
  lasso: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <ellipse cx="32" cy="32" rx="20" ry="14" transform="rotate(-15 32 32)" stroke="#d97706" stroke-width="4" fill="none" stroke-dasharray="4 3"/>
      <ellipse cx="30" cy="30" rx="16" ry="10" transform="rotate(-15 32 32)" stroke="#b45309" stroke-width="2" fill="none"/>
      <!-- Knot / Honda -->
      <circle cx="48" cy="24" r="4" fill="#78350f"/>
      <path d="M48 24C44 38 38 52 28 56" stroke="#d97706" stroke-width="3" stroke-dasharray="3 2"/>
    </svg>
  `,

  // Wanted Poster
  wanted_poster: `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect width="64" height="64" rx="8" fill="#1b120c" stroke="#8b5a2b" stroke-width="2"/>
      <!-- Parchment Sheet -->
      <rect x="14" y="10" width="36" height="44" rx="3" fill="#e8c48a" stroke="#452b14" stroke-width="2"/>
      <!-- Header Bar -->
      <rect x="18" y="14" width="28" height="6" fill="#c81d1d"/>
      <!-- Silhouette Head -->
      <rect x="22" y="24" width="20" height="18" fill="#231407"/>
      <!-- Hat -->
      <ellipse cx="32" cy="24" rx="12" ry="3" fill="#c81d1d"/>
      <rect x="28" y="20" width="8" height="4" fill="#c81d1d"/>
      <!-- Dollar Bounty -->
      <rect x="18" y="46" width="28" height="4" fill="#7c2db8"/>
    </svg>
  `,
};

/**
 * Utility helper to convert SVG string to Base64 Data URL for Phaser textures
 */
export function getSvgDataUrl(svgString: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString.trim());
}
