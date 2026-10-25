import { describe,it,expect } from 'vitest';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { createRankingStore } from './ranking-store.mjs';
import { backupRankings } from './backup.mjs';
import { createRankingApi } from './ranking-api.mjs';
const entry=(runId='run-1')=>({runId,name:'  José KID!  ',score:999999,kills:12,bounty:45,stage:2,level:8,seconds:90,character:'billy',difficulty:'hardcore'});
async function request(api,method='GET',body='',headers={}) {
  const req=Readable.from([Buffer.from(body)]); Object.assign(req,{method,url:'/api/rankings',headers:{host:'localhost:3000','content-type':'application/json',...headers},socket:{remoteAddress:'test'}});
  const res={status:0,headers:{},setHeader(k,v){this.headers[k]=v;},writeHead(code,values){this.status=code;Object.assign(this.headers,values);},end(value){this.body=JSON.parse(value);}};
  await api.handle(req,res);return res;
}
describe('durable server rankings',()=>{
  it('retains results across database restarts and recalculates scores instead of trusting the posted total',()=>{
    const dir=mkdtempSync(join(tmpdir(),'sunset-ranking-')),path=join(dir,'ranking.sqlite');
    let store=createRankingStore(path);
    try {
      store.submitBatch([entry()]);store.close();store=createRankingStore(path);
      expect(store.list()).toHaveLength(1);expect(store.list()[0]).toMatchObject({score:1050,name:'José KID'});
      store.submitBatch([{...entry(),name:'Changed',kills:900}]);expect(store.list()[0].name).toBe('José KID');expect(store.list()).toHaveLength(1);
    } finally {store.close();rmSync(dir,{recursive:true,force:true});}
  });
  it('rejects invalid batches atomically and returns only the top 100 while retaining older unique results',()=>{
    const store=createRankingStore(':memory:');
    try {
      expect(()=>store.submitBatch([entry(),{...entry('bad'),stage:9}])).toThrow();expect(store.list()).toEqual([]);
      expect(()=>store.submitBatch([{...entry(),seconds:Infinity}])).toThrow();expect(()=>store.submitBatch([{...entry(),name:'!!!'}])).toThrow();
      for(let i=0;i<105;i++)store.submitBatch([{...entry(`r-${i}`),kills:i}]);
      expect(store.list()).toHaveLength(100);expect(store.list()[0].kills).toBe(104);
      store.submitBatch([{...entry('r-0'),kills:1000}]);expect(store.list()[0].kills).toBe(104);
    } finally {store.close();}
  });
  it('serves the API, acknowledges duplicate retries and rejects malformed or cross-origin requests',async()=>{
    const api=createRankingApi({path:':memory:'});
    try {
      const post=await request(api,'POST',JSON.stringify({entries:[entry()]}));expect(post.status).toBe(200);expect(post.body.accepted).toEqual(['run-1']);
      expect((await request(api,'POST',JSON.stringify({entries:[entry()]}))).status).toBe(200);
      const get=await request(api);expect(get.body.entries).toHaveLength(1);expect(get.headers['Cache-Control']).toBe('no-store');
      expect((await request(api,'POST','{bad')).status).toBe(400);
      expect((await request(api,'POST','{}',{origin:'https://elsewhere.example'})).status).toBe(403);
      expect((await request(api,'POST','{}',{'content-type':'text/plain'})).status).toBe(415);
      expect((await request(api,'POST','x'.repeat(33000))).status).toBe(413);
      expect((await request(api,'DELETE')).status).toBe(405);
    } finally {api.close();}
  });
  it('handles bounded write traffic without losing existing results',async()=>{
    const api=createRankingApi({path:':memory:'});
    try {for(let i=0;i<60;i++)expect((await request(api,'POST',JSON.stringify({entries:[entry()]}))).status).toBe(200);
      expect((await request(api,'POST',JSON.stringify({entries:[entry()]}))).status).toBe(429);
      expect((await request(api)).body.entries).toHaveLength(1);
    }finally{api.close();}
  });
});

it('creates a consistent backup while the database is open and refuses to overwrite it',()=>{
  const dir=mkdtempSync(join(tmpdir(),'sunset-backup-')),source=join(dir,'source.sqlite'),target=join(dir,'backup.sqlite');
  const store=createRankingStore(source);
  try {
    store.submitBatch([entry('backup-run')]);backupRankings(source,target);
    const backup=createRankingStore(target);try{expect(backup.list()[0].runId).toBe('backup-run');}finally{backup.close();}
    expect(()=>backupRankings(source,target)).toThrow('already exists');
  } finally {store.close();rmSync(dir,{recursive:true,force:true});}
});
