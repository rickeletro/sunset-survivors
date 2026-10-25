// Automated isolated HTTP/storage check. Never inserts test scores in the live game database.
import { spawn } from 'node:child_process';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'sunset-http-ranking-')); let child;
async function boot() {
  child=spawn(process.execPath,['server/index.mjs'],{env:{...process.env,PORT:'0',HOST:'127.0.0.1',RANKING_DB_PATH:join(dir,'rankings.sqlite')},stdio:['ignore','pipe','pipe']});
  const port=await new Promise((resolve,reject)=>{
    let output=''; const timer=setTimeout(()=>reject(Error('Server startup timed out')),10000);
    child.stdout.on('data',chunk=>{output+=chunk;const match=/listening on port (\d+)/.exec(output);if(match){clearTimeout(timer);resolve(match[1]);}});
    child.once('exit',code=>{clearTimeout(timer);reject(Error(`Server exited: ${code}`));});
  });
  return `http://127.0.0.1:${port}`;
}
async function stop() {
  if(!child||child.exitCode!==null)return;
  const done=new Promise(resolve=>child.once('exit',resolve));child.kill('SIGTERM');
  const timer=setTimeout(()=>child.kill('SIGKILL'),5000);try{await done;}finally{clearTimeout(timer);}
}
try {
  let url=await boot();
  let response=await fetch(url);assert.equal(response.status,200);assert.match(await response.text(),/SUNSET|Sunset/i);
  const entry={runId:'isolated-http-check',name:'TEST',score:999999,kills:3,bounty:2,stage:1,level:2,seconds:30,character:'steve',difficulty:'hardcore'};
  response=await fetch(`${url}/api/rankings`,{method:'POST',headers:{'Content-Type':'application/json',Origin:url},body:JSON.stringify({entries:[entry]})});
  assert.equal(response.status,200);assert.deepEqual((await response.json()).accepted,[entry.runId]);
  await stop();url=await boot();
  const entries=(await(await fetch(`${url}/api/rankings`)).json()).entries;assert.equal(entries.length,1);assert.equal(entries[0].score,170);
  response=await fetch(`${url}/assets/fonts/rye/Rye-Regular.ttf`,{headers:{Range:'bytes=0-15'}});assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,16);
  console.log('PASS: production HTML, ranking POST, persistence after process restart, and media byte ranges.');
} finally {await stop();rmSync(dir,{recursive:true,force:true});}
