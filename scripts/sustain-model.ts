import { PASSIVES } from '../src/data/passives';
import { HEAL_DROP_CHANCE, HEAL_DROP_HP, REGEN_DELAY_MS } from '../src/data/sustain';

/** Damage-script sensitivity analysis, not a combat bot. Same kill/collection/random
 * stream before/after, Cormano armor, fixed avoidable hit intervals; no XP changes.
 */
export function simulateSustain(seed: number, hitEvery: number, revised: boolean, regenMax: boolean | number = false, saloon = false) {
  const rank = typeof regenMax === 'number' ? regenMax : regenMax ? 5 : 0;
  const maxHp = 150 + (rank >= 3 ? (rank - 2) * 20 : 0);
  const regen = rank ? revised ? PASSIVES.whiskey.levels[rank - 1].effect.hpRegen! : [0.25, 0.5, 1, 1.5, 2][rank - 1] : 0;
  let hp = maxHp, kills = 0, collected = 0, carry = 0, healing = 0, effective = 0, lastDamage = -Infinity, hp90 = maxHp;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const pending: { at: number; hp: number }[] = [];
  const heal = (amount: number) => { healing += amount; const next = Math.min(maxHp, hp + amount); effective += next - hp; hp = next; };
  for (let t = 1; t <= 420; t++) {
    // Steady stage-1 envelope: 0.7 → 3 kills/s, 80% deterministic pickup collection.
    const totalKills = Math.floor(0.7 * t + 2.3 * t * t / (2 * 420));
    while (kills < totalKills) {
      kills++; const bottle = random() < (revised ? HEAL_DROP_CHANCE : 0.08);
      carry += 0.8;
      if (carry >= 1) { carry--; collected++; if (bottle) pending.push({ at: t + 4, hp: revised ? HEAL_DROP_HP : 30 }); }
    }
    for (let i = pending.length - 1; i >= 0; i--) if (pending[i].at <= t) { heal(pending[i].hp); pending.splice(i, 1); }
    if (t % hitEvery === 0) { hp -= 9; lastDamage = t * 1000; }
    if (hp <= 0) return { deadAt: t, hp: 0, hp90: t < 90 ? 0 : hp90, healing, effective, kills, collected };
    if (regen && (!revised || t * 1000 - lastDamage >= REGEN_DELAY_MS)) heal(regen);
    if (saloon && t === 90) heal(maxHp * 0.2);
    if (t === 90) hp90 = hp;
  }
  return { deadAt: undefined, hp, hp90, healing, effective, kills, collected };
}
export function sustainAudit() {
  const rows = [];
  for (const hitEvery of [20, 10, 5]) for (const regen of [0, 3, 5]) for (const revised of [false, true]) {
    const runs = Array.from({ length: 200 }, (_, i) => simulateSustain(1000 + i, hitEvery, revised, regen));
    rows.push({ hitsPerMinute: 60 / hitEvery, whiskeyRankFromStart: regen, rules: revised ? 'revised' : 'previous',
      survivePercent: runs.filter(r => !r.deadAt).length / 2,
      meanHp90: Math.round(runs.reduce((n, r) => n + r.hp90, 0) / runs.length),
      meanHpEnd: Math.round(runs.reduce((n, r) => n + r.hp, 0) / runs.length),
      meanEffectiveHealing: Math.round(runs.reduce((n, r) => n + r.effective, 0) / runs.length) });
  }
  return rows;
}
