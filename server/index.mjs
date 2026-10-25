import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve,extname,sep } from 'node:path';
import { createRankingApi } from './ranking-api.mjs';
const root=resolve('dist'),api=createRankingApi();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.ttf':'font/ttf','.woff2':'font/woff2','.woff':'font/woff','.ico':'image/x-icon'};
const server=createServer((req,res)=>{ void api.handle(req,res,()=>{
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405);res.end();return; }
  let path;
  try { path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname)); }
  catch { res.writeHead(400);res.end();return; }
  if (path===root) path=resolve(root,'index.html');
  if (!path.startsWith(root+sep)) { res.writeHead(403);res.end();return; }
  try {
    const stat=statSync(path); if (!stat.isFile()) throw Error('Not a file');
    const headers={'Content-Type':types[extname(path)]??'application/octet-stream','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes','Cache-Control':path.endsWith('index.html')?'no-cache':'public, max-age=3600'};
    let start=0,end=stat.size-1,status=200;
    if (req.headers.range) {
      const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
      if (!match || (start=Number(match[1]))>=stat.size || (end=match[2]?Math.min(Number(match[2]),end):end)<start) { res.writeHead(416,{'Content-Range':`bytes */${stat.size}`});res.end();return; }
      status=206; headers['Content-Range']=`bytes ${start}-${end}/${stat.size}`;
    }
    headers['Content-Length']=String(Math.max(0,end-start+1)); res.writeHead(status,headers);
    if (req.method==='HEAD'||stat.size===0) res.end(); else createReadStream(path,{start,end}).on('error',()=>res.destroy()).pipe(res);
  } catch { res.writeHead(404);res.end('Not found'); }
}); });
server.listen(Number(process.env.PORT??3000),process.env.HOST??'0.0.0.0',()=>console.log(`Sunset Survivors server listening on port ${server.address().port}`));
let closing=false;
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{ if(closing)return; closing=true;server.close(()=>{api.close();process.exit(0);});server.closeIdleConnections(); });
