import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { validateEntry } from './ranking-validation.mjs';
export { validateEntry } from './ranking-validation.mjs';
export function createRankingStore(path=process.env.RANKING_DB_PATH ?? '.data/rankings.sqlite') {
  if (path!==':memory:') { path=resolve(path); mkdirSync(dirname(path),{recursive:true}); }
  const db=new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS rankings (
      runId TEXT PRIMARY KEY, name TEXT NOT NULL, score INTEGER NOT NULL,
      kills INTEGER NOT NULL, bounty INTEGER NOT NULL, stage INTEGER NOT NULL,
      level INTEGER NOT NULL, seconds REAL NOT NULL, character TEXT NOT NULL,
      difficulty TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS ranking_score ON rankings(score DESC,stage DESC,kills DESC,seconds DESC,runId ASC);`);
  const insert=db.prepare('INSERT INTO rankings (runId,name,score,kills,bounty,stage,level,seconds,character,difficulty) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(runId) DO NOTHING');
  const select=db.prepare('SELECT runId,name,score,kills,bounty,stage,level,seconds,character,difficulty FROM rankings ORDER BY score DESC,stage DESC,kills DESC,seconds DESC,runId ASC LIMIT 100');
  return {
    list:()=>select.all().map(row=>({...row})),
    submitBatch(values) {
      if (!Array.isArray(values)||!values.length||values.length>100) throw Error('Submit between 1 and 100 results');
      const entries=values.map(validateEntry);
      db.exec('BEGIN IMMEDIATE');
      try {
        for (const e of entries) insert.run(e.runId,e.name,e.score,e.kills,e.bounty,e.stage,e.level,e.seconds,e.character,e.difficulty);
        db.exec('COMMIT');
      } catch(error) { db.exec('ROLLBACK'); throw error; }
      return entries.map(e=>e.runId);
    },
    close:()=>db.close(),
  };
}
