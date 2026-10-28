/** Shared by Phaser, the local API and the Cloudflare Worker. Money is never score. */
export function survivalScore(kills, seconds, difficulty = 'normal') {
  const safe=value=>Number.isFinite(value)?Math.max(0,Math.floor(value)):0;
  const time=Math.min(600,safe(seconds)), waves=Math.min(5,Math.floor(time/120));
  const factor=difficulty==='hardcore'?1.3:difficulty==='easy'?.8:1;
  return Math.floor((safe(kills)*50+time*2+waves*500)*factor);
}
/** SQLite/D1 projection also re-scores legacy rows without changing IDs or player history. */
export const SURVIVAL_SCORE_SQL = "CAST((kills * 50 + MIN(600, CAST(seconds AS INTEGER)) * 2 + MIN(5, CAST(seconds / 120 AS INTEGER)) * 500) * CASE difficulty WHEN 'hardcore' THEN 1.3 WHEN 'easy' THEN 0.8 ELSE 1 END AS INTEGER)";
