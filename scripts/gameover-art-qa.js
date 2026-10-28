import { readFileSync, writeFileSync } from 'node:fs';
export const artQaEnabled=process.env.SUNSET_ART_QA==='1';
export function artQaImageSize(path){const png=readFileSync(path);return{width:png.readUInt32BE(16),height:png.readUInt32BE(20)};}
export function exportGameOverScene(root){
 const pack=node=>{
  const record={};for(const key of ['x','y','width','height','scaleX','scaleY','text','style','key','originX','originY','draws','stroke','strokeWidth','color','alpha'])if(node[key]!==undefined)record[key]=node[key];
  record.children=node.list.filter(child=>child.active&&child.visible).map(pack);return record;
 };
 writeFileSync('/tmp/sunset-gameover-scene.json',JSON.stringify(pack(root)));
}
