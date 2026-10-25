import { createRankingStore } from './ranking-store.mjs';
export function createRankingApi(options={}) {
  let store; const limits=new Map();
  const getStore=()=>store??=createRankingStore(options.path);
  const reply=(res,status,data)=>{ res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}); res.end(JSON.stringify(data)); };
  return {
    async handle(req,res,next=()=>reply(res,404,{error:'Not found'})) {
      if (req.url?.split('?')[0]!=='/api/rankings') return next();
      if (req.method==='GET') {
        try { reply(res,200,{entries:getStore().list()}); } catch { reply(res,503,{error:'Ranking temporarily unavailable'}); }
        return;
      }
      if (req.method!=='POST') { res.setHeader('Allow','GET, POST'); reply(res,405,{error:'Method not allowed'}); return; }
      if (req.headers.origin) {
        try { if (new URL(req.headers.origin).host!==req.headers.host) { reply(res,403,{error:'Invalid origin'}); return; } }
        catch { reply(res,403,{error:'Invalid origin'}); return; }
      }
      if (!req.headers['content-type']?.startsWith('application/json')) { reply(res,415,{error:'JSON required'}); return; }
      const now=Date.now(), ip=req.socket?.remoteAddress ?? 'local';
      for (const [key,value] of limits) if (now-value.start>=60000) limits.delete(key);
      if (!limits.has(ip)&&limits.size>=10000) { reply(res,429,{error:'Please try again later'}); return; }
      const limit=limits.get(ip)??{start:now,count:0}; limits.set(ip,limit);
      if (++limit.count>60) { reply(res,429,{error:'Please try again later'}); return; }
      try {
        let bytes=0; const chunks=[];
        for await (const chunk of req) { const buffer=Buffer.from(chunk); bytes+=buffer.length; if (bytes>32768) { reply(res,413,{error:'Request too large'}); return; } chunks.push(buffer); }
        const body=Buffer.concat(chunks).toString('utf8');
        let entries;
        try { entries=JSON.parse(body).entries; } catch { reply(res,400,{error:'Invalid JSON'}); return; }
        const database=getStore(); let accepted;
        try { accepted=database.submitBatch(entries); }
        catch(error) { if (error.code?.startsWith('ERR_SQLITE')) throw error; reply(res,400,{error:'Invalid ranking result'}); return; }
        reply(res,200,{accepted});
      } catch { reply(res,503,{error:'Ranking temporarily unavailable'}); }
    },
    close() { store?.close(); store=undefined; },
  };
}
