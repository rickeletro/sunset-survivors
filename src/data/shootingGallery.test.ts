import { expect, it } from 'vitest';
import { ShootingGallery, gallerySlot, galleryPlatePose, galleryPlateContains, galleryDifficulty, galleryProfile, GALLERY_DURATION, GALLERY_TARGETS } from './shootingGallery';
function first() {
  const g = new ShootingGallery(() => 0); g.start(); g.tick(650); const p = g.plates[0]; g.tick(p.riseMs); return { g, p, slot: gallerySlot(p.slot) };
}
it('waits for start, raises a random boss board and accepts only its exposed shape', () => {
  const g = new ShootingGallery(() => .9); g.tick(1000); expect(g.plates).toHaveLength(0); expect(g.shoot(0, 0)).toBeUndefined();
  g.start(); g.tick(650); const p = g.plates[0], slot = gallerySlot(p.slot);
  expect(galleryPlatePose(p, g.elapsed).lift).toBe(0); expect(galleryPlateContains(p, g.elapsed, slot.x, slot.y - 50)).toBe(false);
  g.tick(p.riseMs / 2); const pose = galleryPlatePose(p, g.elapsed);
  expect(pose.lift).toBeGreaterThan(.45); expect(pose.lift).toBeLessThan(1);
  expect(galleryPlateContains(p, g.elapsed, slot.x, slot.y + 4)).toBe(false);
  expect(g.shoot(slot.x, slot.y - 70)?.id).toBe(p.id);
});
it('ends immediately on one miss and never accepts a second attempt or pays twice', () => {
  const { g } = first(); expect(g.shoot(900, -900)).toBeUndefined(); expect(g.state).toBe('lost'); expect(g.failure).toBe('miss');
  g.shoot(0, 0); g.start(); expect(g.shots).toBe(1); expect(g.close()).toEqual({ bounty: 0, xp: 0 }); expect(g.close()).toEqual({ bounty: 0, xp: 0 });
});
it('loses if a board escapes and rejects hits after its deadline', () => {
  const { g, p, slot } = first(); g.tick(p.expiresAt - g.elapsed);
  expect(g.state).toBe('lost'); expect(g.failure).toBe('escaped'); expect(g.shoot(slot.x, slot.y - 80)).toBeUndefined();
});
it('banks previous earned hits on a loss without paying the perfect bonus', () => {
  const { g, slot } = first(); g.shoot(slot.x, slot.y - 80); g.shoot(slot.x, slot.y - 80);
  expect(g.failure).toBe('miss'); expect(g.close()).toEqual({ bounty: 3, xp: 5 });
});
it('increases speed and produces staggered pairs in different bays while keeping rewards bounded', () => {
  const g = new ShootingGallery(() => 0, 2); g.start(); let steps = 0, maxActive = 0;
  while (!g.finished && steps++ < 1600) {
    g.tick(20);
    maxActive = Math.max(maxActive, g.plates.filter(p => p.hitAt === undefined && p.bornAt <= g.elapsed).length);
    for (const p of g.plates) if (p.hitAt === undefined && g.elapsed >= p.bornAt + p.riseMs) {
      const slot = gallerySlot(p.slot); expect(g.shoot(slot.x, slot.y - 80)?.id).toBe(p.id);
    }
  }
  expect(g.state).toBe('won'); expect(g.hits.size).toBe(GALLERY_TARGETS); expect(g.plates).toHaveLength(GALLERY_TARGETS);
  const pairs = g.plates.slice(1).filter((p, i) => p.bornAt - g.plates[i].bornAt <= 180);
  expect(pairs.length).toBeGreaterThan(0); expect(maxActive).toBeLessThanOrEqual(2);
  for (let i = 1; i < g.plates.length; i++) if (g.plates[i].bornAt - g.plates[i - 1].bornAt <= 180) expect(g.plates[i].slot).not.toBe(g.plates[i - 1].slot);
  expect(g.plates.at(-1)!.riseMs).toBeLessThan(g.plates[0].riseMs); expect(galleryDifficulty(10).exposedMs).toBeLessThan(galleryDifficulty(0).exposedMs);
  expect(g.close()).toEqual({ bounty: 61, xp: 60 }); expect(g.close()).toEqual({ bounty: 0, xp: 0 });
});
it('uses injected randomness for both bay and boss and retracts independently after resolution', () => {
  const a = first(), b = new ShootingGallery(() => .99); b.start(); b.tick(650);
  expect(b.plates[0].slot).not.toBe(a.p.slot); expect(b.plates[0].boss).not.toBe(a.p.boss);
  a.g.shoot(a.slot.x, a.slot.y - 80); a.g.tick(230); expect(galleryPlatePose(a.p, a.g.elapsed).lift).toBe(0);
  a.g.tick(GALLERY_DURATION); expect(a.g.finished).toBe(true);
});

it('can expose two bosses together and ends both on a single miss', () => {
  const g = new ShootingGallery(() => 0, 2); g.start();
  while (g.hits.size < g.profile.pairAfter && !g.finished) {
    g.tick(20);
    for (const p of g.plates) if (p.hitAt === undefined && g.elapsed >= p.bornAt + p.riseMs) { const slot = gallerySlot(p.slot); g.shoot(slot.x, slot.y - 80); }
  }
  g.tick(900);
  const live = g.plates.filter(p => p.hitAt === undefined && galleryPlatePose(p, g.elapsed).canHit);
  expect(live).toHaveLength(2); expect(Math.abs(live[0].bornAt - live[1].bornAt)).toBeLessThanOrEqual(180);
  g.shoot(999, 999); expect(g.state).toBe('lost');
  const slot = gallerySlot(live[1].slot); expect(g.shoot(slot.x, slot.y - 80)).toBeUndefined(); expect(g.hits.size).toBe(g.profile.pairAfter);
});
it('never raises a pending second board after the round has already been lost', () => {
  const p = { id: 1, slot: 3, boss: 8, bornAt: 1000, riseMs: 200, expiresAt: 2400 };
  expect(galleryPlatePose(p, 1100, 980).lift).toBe(0);
});

it('alternates endurance increases and speed increases across the eight stage profiles', () => {
  expect(Array.from({ length: 8 }, (_, i) => galleryProfile(i + 1).targets)).toEqual([12, 12, 16, 16, 20, 20, 24, 24]);
  for (const stage of [3, 5, 7]) {
    const before = galleryProfile(stage - 1), after = galleryProfile(stage);
    expect(after.targets).toBe(before.targets + 4); expect(after.pace).toBe(before.pace);
    expect(galleryDifficulty(0, stage)).toEqual(galleryDifficulty(0, stage - 1));
    expect(after.durationMs).toBeGreaterThan(before.durationMs);
  }
  for (const stage of [2, 4, 6, 8]) {
    expect(galleryProfile(stage).targets).toBe(galleryProfile(stage - 1).targets);
    expect(galleryDifficulty(0, stage).exposedMs).toBeLessThan(galleryDifficulty(0, stage - 1).exposedMs);
  }
  expect(galleryDifficulty(12, 7).exposedMs).toBeGreaterThan(galleryDifficulty(23, 7).exposedMs);
});
it.each([0, .99])('keeps every stage completable with valid late hits, bounded waves and single settlement (random %s)', random => {
  for (let stage = 1; stage <= 8; stage++) {
    const g = new ShootingGallery(() => random, stage), waves: number[] = [];
    let steps = 0, previous = 0; g.start();
    while (!g.finished && steps++ < 5000) {
      g.tick(20);
      if (g.plates.length !== previous) { waves.push(g.plates.length - previous); previous = g.plates.length; }
      for (const p of g.plates) if (p.hitAt === undefined && g.elapsed >= p.expiresAt - 120) {
        const slot = gallerySlot(p.slot); expect(g.shoot(slot.x, slot.y - 80)?.id, `stage ${stage}`).toBe(p.id);
      }
    }
    expect(g.state, `stage ${stage}`).toBe('won'); expect(g.hits.size).toBe(g.profile.targets);
    expect(Math.max(...waves)).toBeLessThanOrEqual(2);
    for (let i = 1; i < waves.length; i++) if (waves[i - 1] === 2) expect(waves[i]).toBe(1);
    if (stage === 1) expect(waves.every(count => count === 1)).toBe(true);
    expect(g.close()).toEqual({ bounty: g.profile.targets * 3 + g.profile.perfectBonus, xp: g.profile.targets * 5 });
    expect(g.close()).toEqual({ bounty: 0, xp: 0 });
  }
});
it('increases the perfect-round reward and safely normalizes invalid stage IDs', () => {
  const bonuses = Array.from({ length: 8 }, (_, i) => galleryProfile(i + 1).perfectBonus);
  expect(bonuses).toEqual([20, 25, 30, 35, 40, 45, 50, 55]);
  expect(galleryProfile(NaN).stage).toBe(1); expect(galleryProfile(99).stage).toBe(8);
});
