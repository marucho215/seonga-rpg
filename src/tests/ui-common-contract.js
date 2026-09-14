"use strict";

const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const read=name=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
const apps=["app.js","cafeteria-app.js","library-app.js","magnum-app.js"],pages={"tutorial.html":"app.js","cafeteria.html":"cafeteria-app.js","library.html":"library-app.js","magnum.html":"magnum-app.js"};
for(const file of apps){const source=read(file);assert.match(source,/SEONGA_UI\.createPresentation/,`${file}은 공통 프레젠테이션을 사용해야 한다.`);assert.doesNotMatch(source,/function bundlePresentation/,`${file}에 effect 묶음 구현을 복제하지 않는다.`);for(const marker of ["actor-focus","command-section","party-status","support-call"])assert.match(source,new RegExp(marker),`${file}의 사건별 전투 마크업은 유지한다.`);}
for(const [file,appFile] of Object.entries(pages)){const source=read(file),common=source.indexOf('src="ui-common.js"'),app=source.indexOf(`src="${appFile}"`);assert.ok(common>0&&common<app,`${file}은 사건 앱보다 먼저 공통 UI를 로드해야 한다.`);assert.doesNotMatch(source,/debug-(app|adapters)\.js/);}
assert.doesNotMatch(read("index.html"),/debug-(app|adapters)\.js/);assert.doesNotMatch(read("hub.js"),/debug\.html|SEONGA_DEBUG/);
console.log(JSON.stringify({apps:apps.length,sharedPresentation:true,eventMarkupPreserved:true,debugIsolated:true},null,2));
