import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
const bundle=await build({entryPoints:['scripts/economy-model.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {economicRun}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const rows=[];
for(const mode of ['easy','normal','hardcore'])for(const profile of ['cautious','steady','fast'])for(const length of ['short','medium','long'])rows.push(economicRun(length,profile,mode));
console.table(rows.filter(row=>row.mode==='normal'));
writeFileSync('docs/development/economy-audit.json',JSON.stringify({assumptions:{stage:1,rareCash:'expected value, not guaranteed bags',objectives:'short none; medium half; long two thirds of scheduled camps',captains:'short none; medium one; long four, with profile collection factor',gallery:'paid eight-hit non-perfect round',shopping:'configured affordable services; long includes two separate door rests',gambling:'excluded',combat:'not simulated; hypothetical kill/collection profiles',persistence:'shared wallet retains all net cash during gameplay; result grants only time/victory bonus once; no anonymous preview rewards'},rows},null,2)+'\n');
