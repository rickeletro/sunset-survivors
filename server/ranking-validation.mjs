import { survivalScore } from '../shared/ranking-score.js';
const cleanName = value => value.normalize('NFKC').replace(/[^\p{L}\p{N} ._'’-]/gu, '').trim().replace(/\s+/g,' ').slice(0,18);
export function validateEntry(value) {
  if (!value || typeof value !== 'object' || typeof value.runId !== 'string' || !/^[\w-]{1,100}$/.test(value.runId) || typeof value.name !== 'string' || value.name.length>100) throw Error('Invalid ranking entry');
  const name=cleanName(value.name);
  if (!name || !['easy','normal','hardcore'].includes(value.difficulty) || !['steve','billy','bob','cormano'].includes(value.character)) throw Error('Invalid gunslinger');
  const bounds={kills:[0,10000000],bounty:[0,100000000],stage:[1,8],level:[1,10000],seconds:[0,86400]};
  for (const [key,[min,max]] of Object.entries(bounds)) if (!Number.isFinite(value[key]) || value[key]<min || value[key]>max || key!=='seconds'&&!Number.isInteger(value[key])) throw Error(`Invalid ${key}`);
  const {runId,kills,bounty,stage,level,seconds,character,difficulty}=value;
  return {runId,name,score:survivalScore(kills,seconds,difficulty),kills,bounty,stage,level,seconds,character,difficulty};
}
