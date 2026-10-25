/** Eight reusable bays; stage profiles alternate endurance and speed increases. */
export const GALLERY_DURATION = 40000;
export const GALLERY_TARGETS = 12;
export const GALLERY_SLOTS = 8;
export const GALLERY_PLATE = { width: 176, height: 192, foot: 10, fallMs: 230 } as const;
export const GALLERY_BOSS_KEYS = Array.from({ length: 8 }, (_, i) => `boss_poster_${i + 1}`);
export interface GalleryPlate { id: number; slot: number; boss: number; bornAt: number; riseMs: number; expiresAt: number; hitAt?: number; }
export type GalleryFailure = 'miss' | 'escaped' | 'time';
export function gallerySlot(slot: number) { return { x: -480 + slot % 4 * 320, y: slot < 4 ? -15 : 230 }; }
export interface GalleryProfile {
  stage: number; name: string; targets: number; durationMs: number; perfectBonus: number;
  pace: number; pairAfter: number; pairChance: number; recoveryMs: number; velvet: number;
}
const SALOON_NAMES = ['Dusty Draw', 'Iron Horse', 'Ember Shot', 'Lucky Trigger', 'Last Car', 'Eagle Eye', 'Golden Hacienda', 'Midnight Marshal'] as const;
export function galleryProfile(stage = 1): GalleryProfile {
  const id = Number.isFinite(stage) ? Math.max(1, Math.min(8, Math.floor(stage))) : 1;
  const targets = 12 + Math.floor((id - 1) / 2) * 4, pace = Math.floor(id / 2);
  return { stage: id, name: SALOON_NAMES[id - 1], targets, durationMs: targets * 2500 + 10000,
    perfectBonus: 20 + (id - 1) * 5, pace,
    pairAfter: pace === 0 ? targets + 1 : Math.ceil(targets * (pace === 1 ? 2 / 3 : pace === 2 ? .4 : pace === 3 ? .3 : .2)),
    pairChance: pace === 0 ? 0 : .2 + pace * .15, recoveryMs: Math.max(200, 420 - pace * 55),
    velvet: [0xa51e16, 0x572449, 0xa51e16, 0x603719, 0x572449, 0x321b10, 0x603719, 0x572449][id - 1] };
}
export function galleryDifficulty(hits: number, stage = 1) {
  const profile = galleryProfile(stage), progress = Math.max(0, Math.min(1, hits / profile.targets));
  const lerp = (from: number, to: number) => Math.round(from + (to - from) * progress);
  return { riseMs: lerp(380 - profile.pace * 25, 290 - profile.pace * 22),
    exposedMs: lerp(2100 - profile.pace * 180, Math.max(900, 1450 - profile.pace * 140)),
    gapMs: lerp(620 - profile.pace * 60, 420 - profile.pace * 45),
    pairGapMs: lerp(200 - profile.pace * 15, 175 - profile.pace * 15) };
}
/** Hinge projection around the board's base; final artwork proportions are unchanged. */
export function galleryPlatePose(plate: GalleryPlate, elapsed: number, endedAt?: number) {
  const age = elapsed - plate.bornAt;
  const end = plate.hitAt ?? endedAt;
  if (age < 0 || (endedAt !== undefined && endedAt < plate.bornAt)) return { lift: 0, canHit: false, remaining: 1 };
  const rise = Math.min(1, Math.max(0, age / plate.riseMs));
  const raised = Math.sin(rise * Math.PI / 2);
  const retract = end === undefined ? 0 : Math.min(1, Math.max(0, (elapsed - end) / GALLERY_PLATE.fallMs));
  const lift = raised * (1 - retract * retract);
  return { lift, canHit: end === undefined && lift >= .45 && elapsed < plate.expiresAt,
    remaining: Math.max(0, Math.min(1, (plate.expiresAt - elapsed) / (plate.expiresAt - plate.bornAt - plate.riseMs))) };
}
export function galleryPlateContains(plate: GalleryPlate, elapsed: number, x: number, y: number) {
  const pose = galleryPlatePose(plate, elapsed), slot = gallerySlot(plate.slot);
  return pose.canHit && Math.abs(x - slot.x) <= GALLERY_PLATE.width / 2 &&
    y >= slot.y - GALLERY_PLATE.height * pose.lift && y <= slot.y - GALLERY_PLATE.foot * pose.lift;
}
export class ShootingGallery {
  elapsed = 0; shots = 0; readonly hits = new Set<number>(); readonly plates: GalleryPlate[] = [];
  state: 'ready' | 'playing' | 'lost' | 'won' | 'closed' = 'ready';
  failure?: GalleryFailure; endedAt?: number;
  readonly profile: GalleryProfile;
  private lastWaveWasPair = false;
  private paid = false; private nextWaveAt = 650; private lastSlot = -1; private lastBoss = 0;
  constructor(private random: () => number = Math.random, stage = 1) { this.profile = galleryProfile(stage); }
  get finished() { return this.state === 'lost' || this.state === 'won' || this.state === 'closed'; }
  start() { if (this.state === 'ready') this.state = 'playing'; }
  private roll(max: number) { const value = this.random(); return Math.floor(Math.min(.999999, Math.max(0, Number.isFinite(value) ? value : 0)) * max); }
  private wave() {
    const difficulty = galleryDifficulty(this.hits.size, this.profile.stage), left = this.profile.targets - this.plates.length;
    const pair = !this.lastWaveWasPair && this.hits.size >= this.profile.pairAfter && this.roll(100) < this.profile.pairChance * 100;
    const count = Math.min(left, pair ? 2 : 1);
    const available = Array.from({ length: GALLERY_SLOTS }, (_, i) => i).filter(slot => slot !== this.lastSlot && !this.plates.some(p => p.slot === slot && (p.hitAt === undefined || this.elapsed - p.hitAt < GALLERY_PLATE.fallMs)));
    for (let i = 0; i < count; i++) {
      const alternate = this.profile.pace >= 3 && this.lastSlot >= 0;
      const preferred = alternate ? available.filter(slot => Math.floor(slot / 4) !== Math.floor(this.lastSlot / 4)) : available;
      const pool = preferred.length ? preferred : available;
      const slot = pool[this.roll(pool.length)]; available.splice(available.indexOf(slot), 1);
      let boss = this.roll(8) + 1; if (boss === this.lastBoss) boss = boss % 8 + 1;
      const bornAt = this.nextWaveAt + i * difficulty.pairGapMs;
      this.plates.push({ id: this.plates.length, slot, boss, bornAt, riseMs: difficulty.riseMs, expiresAt: bornAt + difficulty.riseMs + difficulty.exposedMs });
      this.lastSlot = slot; this.lastBoss = boss;
    }
    this.lastWaveWasPair = count === 2;
    this.nextWaveAt = Infinity;
  }
  tick(delta: number) {
    if (this.state === 'ready') return;
    if (!Number.isFinite(delta) || delta <= 0) return;
    this.elapsed += delta;
    if (this.state !== 'playing') return;
    if (this.elapsed >= this.nextWaveAt && this.plates.length < this.profile.targets) this.wave();
    if (this.plates.some(p => p.hitAt === undefined && this.elapsed >= p.expiresAt)) this.lose('escaped');
    else if (this.elapsed >= this.profile.durationMs) this.lose('time');
  }
  private lose(reason: GalleryFailure) { this.failure = reason; this.state = 'lost'; this.endedAt = this.elapsed; }
  shoot(x: number, y: number): GalleryPlate | undefined {
    if (this.state !== 'playing') return;
    this.shots++;
    const plate = this.plates.find(p => p.hitAt === undefined && galleryPlateContains(p, this.elapsed, x, y));
    if (!plate) { this.lose('miss'); return; }
    plate.hitAt = this.elapsed; this.hits.add(plate.id);
    if (this.hits.size === this.profile.targets) { this.state = 'won'; this.endedAt = this.elapsed; }
    else if (this.plates.every(p => p.hitAt !== undefined)) this.nextWaveAt = this.elapsed + galleryDifficulty(this.hits.size, this.profile.stage).gapMs + (this.lastWaveWasPair ? this.profile.recoveryMs : 0);
    return { ...plate };
  }
  close() {
    if (this.paid) return { bounty: 0, xp: 0 };
    const won = this.state === 'won'; this.paid = true; this.state = 'closed'; this.endedAt ??= this.elapsed;
    return { bounty: this.hits.size * 3 + (won ? this.profile.perfectBonus : 0), xp: this.hits.size * 5 };
  }
}
