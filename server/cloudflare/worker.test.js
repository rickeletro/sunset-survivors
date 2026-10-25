import { it,expect,vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import worker from './worker.mjs';
function fixture(){
  const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('./migrations/0001_rankings.sql',import.meta.url),'utf8'));
  return {db,env:{ALLOWED_ORIGINS:'https://game.example',RANKING_WRITES:{limit:vi.fn(async()=>({success:true}))},RANKING_DB:{
    prepare(sql){const stmt=db.prepare(sql);return {all:async()=>({results:stmt.all()}),bind(...values){return {run:()=>stmt.run(...values)};}};},
    async batch(statements){db.exec('BEGIN');try{for(const s of statements)s.run();db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}}
  }}};
}
const entry={runId:'worker-run',name:'Billy',score:99999,kills:3,bounty:2,stage:2,level:3,seconds:44,character:'billy',difficulty:'hardcore'};
const request=(method='GET',origin='https://game.example',body)=>new Request('https://ranking.example/api/rankings',{method,headers:{Origin:origin,'Content-Type':'application/json'},...(body===undefined?{}:{body})});
it('supports static-host CORS/preflight and persists D1-compatible batches without trusting the score',async()=>{
  const {db,env}=fixture();try{
    const options=await worker.fetch(request('OPTIONS'),env);expect(options.status).toBe(204);expect(options.headers.get('Access-Control-Allow-Origin')).toBe('https://game.example');
    const post=()=>worker.fetch(request('POST','https://game.example',JSON.stringify({entries:[entry]})),env);
    expect((await post()).status).toBe(200);expect((await post()).status).toBe(200);
    const get=await worker.fetch(request(),env);const result=await get.json();expect(result.entries).toHaveLength(1);expect(result.entries[0].score).toBe(170);
    expect(get.headers.get('Access-Control-Allow-Origin')).toBe('https://game.example');
  }finally{db.close();}
});
it('rejects disallowed origins, invalid data, large bodies and rate-limited writes',async()=>{
  const {db,env}=fixture();try{
    const blocked=await worker.fetch(request('POST','https://bad.example','{}'),env);expect(blocked.status).toBe(403);expect(blocked.headers.has('Access-Control-Allow-Origin')).toBe(false);
    expect((await worker.fetch(request('POST','https://game.example','{broken'),env)).status).toBe(400);
    expect((await worker.fetch(request('POST','https://game.example',JSON.stringify({entries:[entry,{...entry,stage:9}]})),env)).status).toBe(400);
    expect((await(await worker.fetch(request(),env)).json()).entries).toEqual([]);
    expect((await worker.fetch(request('POST','https://game.example','x'.repeat(33000)),env)).status).toBe(413);
    env.RANKING_WRITES.limit.mockResolvedValue({success:false});
    expect((await worker.fetch(request('POST','https://game.example',JSON.stringify({entries:[entry]})),env)).status).toBe(429);
  }finally{db.close();}
});

it('accepts the configured GitHub Pages origin without requiring its repository path',async()=>{
  const {db,env}=fixture();
  try {
    const config=readFileSync(new URL('./wrangler.toml',import.meta.url),'utf8');
    env.ALLOWED_ORIGINS=/ALLOWED_ORIGINS = "([^"]+)"/.exec(config)[1];
    const response=await worker.fetch(request('OPTIONS','https://rickeletro.github.io'),env);
    expect(response.status).toBe(204);expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://rickeletro.github.io');
    expect((await worker.fetch(request('GET','https://someone-else.github.io'),env)).status).toBe(403);
  } finally {db.close();}
});
