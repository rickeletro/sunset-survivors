import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
const out = await build({ entryPoints: ['scripts/sustain-model.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { sustainAudit, simulateSustain } = await import('data:text/javascript;base64,' + Buffer.from(out.outputFiles[0].text).toString('base64'));
const rows = sustainAudit();
console.table(rows);
const recoveryAt90 = revised => Array.from({ length: 200 }, (_, i) =>
  simulateSustain(1000 + i, 20, revised, false, true).hp90 - simulateSustain(1000 + i, 20, revised).hp90).reduce((n, x) => n + x, 0) / 200;
const saloon = { meanEffectiveHealAt90Before: recoveryAt90(false), meanEffectiveHealAt90After: recoveryAt90(true) };
console.log('Saloon at 90 active seconds, 3 hits/minute:', saloon);
if (process.argv.includes('--write')) {
  writeFileSync('docs/architecture/sustain-entry-audit-2026-10.json', JSON.stringify({
    assumptions: { durationSeconds: 420, hero: 'Cormano', baseHp: 150, banditDamageAfterArmor: 9, seeds: '1000..1199',
      killsPerSecond: '0.7 → 3 linearly', collectionFraction: 0.8, pickupDelaySeconds: 4,
      caveats: 'Scripted avoidable hits; not a combat bot. Whiskey ranks, when present, start at t=0. No supplies or max-HP rank-up healing.' }, rows, saloon,
  }, null, 2) + '\n');
}
