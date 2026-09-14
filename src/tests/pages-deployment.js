"use strict";

const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const root=path.resolve(__dirname,"../.."),workflow=fs.readFileSync(path.join(root,".github/workflows/pages.yml"),"utf8");

assert.match(workflow,/node src\/tests\/run-all\.js/,"배포 전에 전체 회귀 테스트를 실행해야 한다.");
assert.match(workflow,/rsync -a src\/ _site\//,"src를 사이트 루트로 배포해야 한다.");
for(const file of ["debug.html","debug-app.js","debug-adapters.js","tests/"])assert.match(workflow,new RegExp(`--exclude '${file.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}'`),`${file}은 공개 빌드에서 제외해야 한다.`);
assert.match(workflow,/actions\/deploy-pages@v4/,"GitHub Pages 배포 단계가 필요하다.");
console.log(JSON.stringify({siteRoot:"src",mobileEntry:"index.html",debugExcluded:true,testsBeforeDeploy:true},null,2));
