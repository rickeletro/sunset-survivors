import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
const bundle = await build({ entryPoints: ['scripts/balance-model.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const { simulateProgression, legacyXpForLevel } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const rows = [], snapshots = [];
for (let stage = 1; stage <= 8; stage++) for (const profile of ['cautious', 'steady', 'fast']) {
  const before = simulateProgression(stage, profile, legacyXpForLevel), after = simulateProgression(stage, profile);
  rows.push({ stage, profile, kills: after.kills, xp: after.totalXp, levelBefore: before.level, levelAfter: after.level,
    firstUpgradeBefore: before.upgrades[0]?.second, firstUpgradeAfter: after.upgrades[0]?.second,
    thirdUpgradeBefore: before.upgrades[2]?.second, thirdUpgradeAfter: after.upgrades[2]?.second });
  snapshots.push({ stage, profile, kills: after.kills, pickups: after.pickups, xp: after.totalXp,
    bountyBeforeStageClearAndBoss: after.bounty, levelBefore: before.level, levelAfter: after.level,
    firstUpgradeSeconds: [before.upgrades[0].second, after.upgrades[0].second],
    thirdUpgradeSeconds: [before.upgrades[2].second, after.upgrades[2].second] });
}
console.table(rows);
const boosted = simulateProgression(1, 'fast', undefined, 2.2);
console.log('Max-badge upper envelope (earned badge cost not deducted):', { level: boosted.level, xp: boosted.totalXp });
if (process.argv.includes('--write')) {
  const path = 'docs/architecture/balance-audit-2026-10.json';
  mkdirSync('docs/architecture', { recursive: true });
  writeFileSync(path, JSON.stringify({ assumptions: { durationSeconds: 420, spawnIntervalMs: 850, pickupDelaySeconds: 4,
    objectives: 'two completed after 8 seconds; optimistic', combat: 'not simulated; identical hypothetical kill streams isolate XP curve' }, stages: snapshots }, null, 2) + '\n');
  console.log('Saved', path);
}
