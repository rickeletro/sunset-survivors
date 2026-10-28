import { describe,it,expect } from 'vitest';
import { RankingManager, rankingName, runScore, survivalScore, type RankingEntry } from './RankingManager';
const entry = (id: string, score = 100): RankingEntry => ({ runId: id, name: 'Billy', score:survivalScore(score,60,'hardcore'), kills: score, bounty: 0, stage: 1, level: 1, seconds: 60, character: 'billy', difficulty: 'hardcore' });
describe('persistent local ranking', () => {
  it('uses the existing score formula and accepts zero-valued results', () => {
    expect(runScore(45,12)).toBe(1050); const r = new RankingManager(() => { throw Error(); });
    expect(r.submit({ ...entry('zero',0),kills:0,seconds:0 })).toBe(true); expect(r.list()[0].score).toBe(0);
  });
  it('normalizes names, rejects empty names, invalid results and duplicate runs', () => {
    expect(rankingName('  José   KID!  ')).toBe('José KID'); expect(rankingName('a'.repeat(30))).toHaveLength(18);
    const r = new RankingManager(() => { throw Error(); });
    expect(r.submit({ ...entry('a'), name: ' !!! ' })).toBe(false);
    expect(r.submit({ ...entry('a'), score: NaN })).toBe(false);
    expect(r.submit(entry('a'))).toBe(true); expect(r.submit(entry('a',200))).toBe(false); expect(r.list()).toHaveLength(1);
  });
  it('persists sorted results, supports mode filters and does not expose mutable entries', () => {
    const saved=new Map<string,string>(); const storage=()=>({getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>{saved.set(key,value);}});
    const r = new RankingManager(storage); r.submit(entry('a')); r.submit({ ...entry('b',200), difficulty:'easy' });
    const loaded = new RankingManager(storage); expect(loaded.list().map(e => e.runId)).toEqual(['b','a']);
    expect(loaded.list('hardcore')).toHaveLength(1); loaded.list()[0].name = 'changed'; expect(loaded.list()[0].name).toBe('Billy');
  });
  it('handles damaged storage and retains at most the best hundred results', () => {
    const r = new RankingManager(() => ({ getItem: () => '{bad', setItem: () => {} }));
    for (let i=0;i<110;i++) r.submit(entry(String(i),i)); expect(r.list()).toHaveLength(100); expect(r.list().at(-1)?.score).toBe(survivalScore(10,60,'hardcore'));
  });
});

it('uploads a durable retry queue, survives reloads and merges the server board across devices', async()=>{
  const { vi }=await import('vitest');let saved=new Map<string,string>();
  const storage=()=>({getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>{saved.set(key,value);}});
  const offline=vi.fn(async()=>{throw Error('offline');});
  const first=new RankingManager(storage,offline);first.submit(entry('queued'));expect(await first.sync()).toBe(false);
  let serverEntries=[entry('other-device',900)];
  const online=vi.fn(async(_url:string,init?:RequestInit)=>{
    if(init?.method==='POST') {const batch=JSON.parse(String(init.body)).entries;serverEntries.push(...batch);return {ok:true,json:async()=>({accepted:batch.map((e:RankingEntry)=>e.runId)})};}
    return {ok:true,json:async()=>({entries:serverEntries})};
  });
  const loaded=new RankingManager(storage,online);expect(await loaded.sync()).toBe(true);
  expect(loaded.list().map(e=>e.runId)).toEqual(['other-device','queued']);
  online.mockClear();const again=new RankingManager(storage,online);await again.sync();
  expect(online.mock.calls.some(c=>c[1]?.method==='POST')).toBe(false);
});

it('migrates the old local board once and does not acknowledge failed server writes',async()=>{
  const { vi }=await import('vitest');const values=new Map([['sunset_rankings_v1',JSON.stringify([entry('legacy')])]]);
  const storage=()=>({getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);}});
  const fail=vi.fn(async()=>({ok:false,json:async()=>({})}));const r=new RankingManager(storage,fail);
  expect(await r.sync()).toBe(false);expect(r.list()[0].runId).toBe('legacy');
  const accepted=vi.fn(async(_url:string,init?:RequestInit)=>({ok:true,json:async()=>init?.method==='POST'?{accepted:['legacy']}:{entries:[entry('legacy')]}}));
  const retry=new RankingManager(storage,accepted);expect(await retry.sync()).toBe(true);expect(JSON.parse(values.get('sunset_ranking_pending_v1')!)).toEqual([]);
});

it('does not lose submissions arriving while a refresh is already in flight',async()=>{
  const {vi}=await import('vitest');let resolve!:()=>void;let gets=0;const uploaded:RankingEntry[]=[];
  const request=vi.fn(async(_url:string,init?:RequestInit)=>{
    if(init?.method==='POST'){const entries=JSON.parse(String(init.body)).entries;uploaded.push(...entries);return {ok:true,json:async()=>({accepted:entries.map((e:RankingEntry)=>e.runId)})};}
    if(++gets===1)await new Promise<void>(r=>{resolve=r;});
    return {ok:true,json:async()=>({entries:[...uploaded]})};
  });
  const r=new RankingManager(()=>({getItem:()=>null,setItem:()=>{}}),request);const syncing=r.sync();r.submit(entry('late'));resolve();
  expect(await syncing).toBe(true);expect(uploaded.map(e=>e.runId)).toEqual(['late']);expect(r.list()).toHaveLength(1);
});

it('uses a separately deployed ranking API for static-hosted builds',async()=>{
  const {vi}=await import('vitest');
  const request=vi.fn(async()=>({ok:true,json:async()=>({entries:[]})}));
  const r=new RankingManager(()=>({getItem:()=>null,setItem:()=>{}}),request,'https://ranking.example/api/rankings');
  expect(await r.sync()).toBe(true);expect(request).toHaveBeenCalledWith('https://ranking.example/api/rankings',expect.any(Object));
});

it('defaults production builds to the live Worker while preserving local development and explicit overrides',async()=>{
  const {rankingEndpoint,PUBLIC_RANKING_API}=await import('./RankingManager');
  expect(rankingEndpoint(undefined,true)).toBe('https://sunset-survivors-ranking.rickeletro.workers.dev/api/rankings');
  expect(rankingEndpoint('  ',true)).toBe(PUBLIC_RANKING_API);
  expect(rankingEndpoint(undefined,false)).toBe('/api/rankings');
  expect(rankingEndpoint(' https://custom.example/api/rankings ',true)).toBe('https://custom.example/api/rankings');
});

describe('survival scoring and durable personal history',()=>{
  it('scores kills, active survival, completed waves and difficulty without rewarding money',()=>{
    expect(survivalScore(10,119,'normal')).toBe(738);
    expect(survivalScore(10,120,'normal')).toBe(1240);
    expect(survivalScore(10,120,'hardcore')).toBe(1612);
    expect(survivalScore(10,120,'easy')).toBe(992);
    expect(survivalScore(-1,NaN)).toBe(0);
    expect(survivalScore(10,900)).toBe(survivalScore(10,600));
    const r=new RankingManager(()=>{throw Error('offline');});
    r.submit({...entry('poor'),bounty:0});r.submit({...entry('rich'),bounty:1000000});
    expect(r.list()[0].score).toBe(r.list()[1].score);
  });
  it('keeps a result outside the top hundred in personal history after server sync and restart',async()=>{
    const values=new Map<string,string>();const storage=()=>({getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);}});
    const top=Array.from({length:100},(_,i)=>entry(`remote-${i}`,200+i));
    const request=async(_url:string,init?:RequestInit)=>({ok:true,json:async()=>init?.method==='POST'?{accepted:JSON.parse(String(init.body)).entries.map((e:RankingEntry)=>e.runId)}:{entries:top}});
    const first=new RankingManager(storage,request);first.submit(entry('my-low-run',1));expect(await first.sync()).toBe(true);
    expect(first.list().some(row=>row.runId==='my-low-run')).toBe(false);
    expect(first.find('my-low-run')?.name).toBe('Billy');expect(first.position(first.find('my-low-run')!)).toBe(101);
    const next=new RankingManager(storage,request);expect(next.submit(entry('my-low-run',9999))).toBe(false);
    expect(next.history().some(row=>row.runId==='my-low-run')).toBe(true);
    expect(next.list()).toHaveLength(100);
  });
});
