import { SURVIVAL_SCORE_SQL } from '../../shared/ranking-score.js';
import { validateEntry } from '../ranking-validation.mjs';
const SELECT=`SELECT runId,name,${SURVIVAL_SCORE_SQL} AS score,kills,bounty,stage,level,seconds,character,difficulty FROM rankings ORDER BY score DESC,stage DESC,kills DESC,seconds DESC,runId ASC LIMIT 100`;
const INSERT='INSERT INTO rankings (runId,name,score,kills,bounty,stage,level,seconds,character,difficulty) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(runId) DO NOTHING';
export default {
  async fetch(request,env) {
    const origin=request.headers.get('Origin');
    const allowed=(env.ALLOWED_ORIGINS??'').split(',').map(s=>s.trim()).filter(Boolean);
    const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if (origin&&allowed.includes(origin)) {
      headers['Access-Control-Allow-Origin']=origin;
      headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';
      headers['Access-Control-Allow-Headers']='Content-Type';
      headers['Access-Control-Max-Age']='86400';
    }
    const reply=(status,data)=>Response.json(data,{status,headers});
    if (new URL(request.url).pathname!=='/api/rankings') return reply(404,{error:'Not found'});
    if (origin&&!allowed.includes(origin)) return reply(403,{error:'Invalid origin'});
    if (request.method==='OPTIONS') return new Response(null,{status:204,headers});
    if (!['GET','POST'].includes(request.method)) return reply(405,{error:'Method not allowed'});
    if (!env.RANKING_DB) return reply(503,{error:'Ranking temporarily unavailable'});
    try {
      if (request.method==='GET') {
        const result=await env.RANKING_DB.prepare(SELECT).all();
        return reply(200,{entries:result.results});
      }
      if (!origin||!allowed.includes(origin)) return reply(403,{error:'Invalid origin'});
      if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415,{error:'JSON required'});
      if (!env.RANKING_WRITES) return reply(503,{error:'Ranking temporarily unavailable'});
      const rate=await env.RANKING_WRITES.limit({key:`ranking-write:${request.headers.get('CF-Connecting-IP')??'unknown'}`});
      if (!rate.success) return reply(429,{error:'Please try again later'});
      let size=0;const chunks=[];const reader=request.body?.getReader();
      if (reader) try {
        while (true) { const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
          if(size>32768){await reader.cancel();return reply(413,{error:'Request too large'});}chunks.push(value);
        }
      } finally {reader.releaseLock();}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      let entries;
      try {
        const values=JSON.parse(new TextDecoder().decode(bytes)).entries;
        if(!Array.isArray(values)||!values.length||values.length>100)throw Error();
        entries=values.map(validateEntry);
      } catch {return reply(400,{error:'Invalid ranking result'});}
      await env.RANKING_DB.batch(entries.map(e=>env.RANKING_DB.prepare(INSERT).bind(e.runId,e.name,e.score,e.kills,e.bounty,e.stage,e.level,e.seconds,e.character,e.difficulty)));
      return reply(200,{accepted:entries.map(e=>e.runId)});
    } catch {return reply(503,{error:'Ranking temporarily unavailable'});}
  },
};
