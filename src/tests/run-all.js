"use strict";

const fs=require("node:fs"),path=require("node:path"),{spawnSync}=require("node:child_process"),self=path.basename(__filename);
const files=fs.readdirSync(__dirname).filter(name=>name.endsWith(".js")&&name!==self).sort(),results=[];
for(const file of files){const run=spawnSync(process.execPath,[path.join(__dirname,file)],{stdio:"inherit"});results.push({file,status:run.status});if(run.status!==0){console.error(`FAILED ${file}`);process.exit(run.status||1);}}
console.log(JSON.stringify({suite:"Incident 01-04 regression",tests:results.length,allPassed:true,coverage:{exhaustive:["사건 04 조사 6개 조합"],representative:["사건 01 성공 편성","사건 02 성공·비최적·패배","사건 03 고정 순서·오판 복구"]}},null,2));
