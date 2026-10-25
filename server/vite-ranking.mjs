import { createRankingApi } from './ranking-api.mjs';
export function rankingPlugin() {
  const attach=server=>{
    const api=createRankingApi();
    server.middlewares.use((req,res,next)=>{ void api.handle(req,res,next); });
    server.httpServer?.once('close',()=>api.close());
  };
  return { name:'sunset-persistent-ranking', configureServer:attach, configurePreviewServer:attach };
}
