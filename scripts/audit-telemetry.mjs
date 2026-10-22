import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
const b = await build({ stdin: { contents: "export * from './scripts/telemetry-model'; export {xpForLevel} from './src/data/economy';", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm' });
const m = await import('data:text/javascript;base64,' + Buffer.from(b.outputFiles[0].text).toString('base64'));
const rows = [];
for (const [stage, seconds, observedLevel] of [[1, 360, 27], [2, 403, 36]]) {
  const fit = m.fitReportedRun(stage, seconds, observedLevel), revised = m.reproduceRun(stage, seconds, fit.finalKillsPerSecond, m.xpForLevel);
  const withoutBadge = m.reproduceRun(stage, seconds, fit.finalKillsPerSecond, m.reportedRunCost, false);
  const medianLateGap = run => {
    const gaps = run.choices.slice(1).map((c, i) => ({ at: c.at, gap: c.at - run.choices[i].at })).filter(c => c.at >= seconds - 120).map(c => c.gap).sort((a, b) => a - b);
    return Math.round(gaps[Math.floor(gaps.length / 2)] * 10) / 10;
  };
  rows.push({ stage, seconds, userReportedLevel: observedLevel, requiredXpForReport: m.cumulativeCost(observedLevel),
    fittedKills: fit.kills, fittedFinalKillsPerSecond: Math.round(fit.finalKillsPerSecond * 100) / 100,
    fittedRawXp: fit.rawXp, fittedEarnedXp: fit.earnedXp, badgeMaxAtSeconds: fit.choices.find(c => c.badgeRank === 5)?.at,
    sameStreamWithoutBadgeLevel: withoutBadge.level, revisedSameStreamLevel: revised.level,
    lateMedianChoiceGapBefore: medianLateGap(fit), lateMedianChoiceGapAfter: medianLateGap(revised) });
}
console.table(rows);
if (process.argv.includes('--write')) writeFileSync('docs/architecture/difficulty-playtest-audit-2026-10.json', JSON.stringify({
  observations: 'Only stage/time/level are human observations. Kills, raw XP, badge allocation and capacity are fitted explanatory assumptions, not measured playtest data.',
  assumptions: 'Real seeded director, rewards, 850ms waves, four-second pickup lag, all loot collected, optional supply completions. Badge uses choices at levels 3/5/7/9/11. No combat/movement/build feedback simulation.',
  rows,
}, null, 2) + '\n');
