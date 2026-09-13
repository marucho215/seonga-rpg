"use strict";

const assert=require("node:assert/strict");
global.window=global;
global.SEONGA_TEST_INSTANT_PRESENTATION=true;
let saved=null;
global.localStorage={getItem(){return saved;},setItem(key,value){saved=value;}};
const app={innerHTML:"",handler:null,addEventListener(type,handler){this.handler=handler;}};
global.document={querySelector(){return app;}};
require("../data/campaign.js");
require("../data/characters.js");
require("../data/neutral-abilities.js");
require("../data/cafeteria-incident.js");
require("../cafeteria-engine.js");
require("../cafeteria-app.js");

function click(action){app.handler({target:{dataset:{action},parentElement:app}});}
assert.match(app.innerHTML,/급식동에 데려갈 네 명/);assert.match(app.innerHTML,/CURRENT UNIT/);
click("briefing");assert.match(app.innerHTML,/BRIEFING/);assert.match(app.innerHTML,/제 주방에서 생긴 일이니/);
click("begin-explore");assert.match(app.innerHTML,/서로 다른 두 장소/);assert.doesNotMatch(app.innerHTML,/초기 확산 억제에 유리/);
click("select-location:drain");assert.match(app.innerHTML,/흐름 센서로 배관 분기를 추적/);assert.doesNotMatch(app.innerHTML,/첫 분류 작업의 시작점을 미리 특정/);
click("investigate:drain-scan");assert.match(app.innerHTML,/배관 흐름 지도/);assert.match(app.innerHTML,/남은 조사\s*<b>1<\/b>회/);
click("select-location:staff");click("investigate:staff-crosscheck");assert.match(app.innerHTML,/최초 목격 시각/);
click("start");assert.match(app.innerHTML,/김우주/);assert.match(app.innerHTML,/16\/16 HP/);assert.match(app.innerHTML,/사건 전체 2\/2/);
console.log(JSON.stringify({flow:["party","briefing","exploration-location","exploration-result","battle"],hpVisible:true,rewardHiddenBeforeChoice:true},null,2));
