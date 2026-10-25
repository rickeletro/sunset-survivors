import { DatabaseSync } from 'node:sqlite';
import { existsSync,mkdirSync } from 'node:fs';
import { dirname,resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export function backupRankings(source,target) {
  source=resolve(source); target=resolve(target);
  if (!existsSync(source)) throw Error('Ranking database does not exist yet');
  if (existsSync(target)) throw Error('Backup destination already exists');
  mkdirSync(dirname(target),{recursive:true});
  const db=new DatabaseSync(source);
  try { db.exec('PRAGMA busy_timeout=5000'); db.prepare('VACUUM INTO ?').run(target); }
  finally { db.close(); }
  return target;
}
if (process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])) {
  const target=process.argv[2]??`.data/backups/rankings-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`;
  console.log(`Ranking backup: ${backupRankings(process.env.RANKING_DB_PATH??'.data/rankings.sqlite',target)}`);
}
