"use strict";

const assert=require("node:assert/strict");
global.window=global;global.SEONGA_TEST_INSTANT_PRESENTATION=true;let saved=JSON.stringify({completed:["endless-classroom","cafeteria-containment"]});
global.localStorage={getItem(){return saved;},setItem(key,value){saved=value;}};
const app={innerHTML:"",handler:null,addEventListener(type,handler){this.handler=handler;}};global.document={querySelector(){return app;}};
require("../data/campaign.js");require("../data/characters.js");require("../data/neutral-abilities.js");require("../data/library-incident.js");require("../library-engine.js");require("../ui-common.js");require("../library-app.js");
const click=action=>app.handler({target:{dataset:{action},parentElement:app}});

assert.match(app.innerHTML,/도서관에 데려갈 네 명/);click("briefing");click("begin-explore");
click("select-location:search-terminal");click("investigate:search-wooju");click("interaction:apply");
click("select-location:exit");click("investigate:exit-hwayoung");
assert.match(app.innerHTML,/판단 가능/);assert.match(app.innerHTML,/충돌 관측/);assert.match(app.innerHTML,/현재 주장 · 서측 서가/);
click("select-location:mina-desk");click("investigate:desk-epi");click("start");
assert.match(app.innerHTML,/북측 비상구를 원본으로 판정/);assert.match(app.innerHTML,/판단 보류/);
assert.match(app.innerHTML,/AUDIT/);assert.match(app.innerHTML,/고정 순서 없음/);
assert.match(app.innerHTML,/다음 오류 · 출처 소실 · 시스템 자료/);
click("act:claim:exitRoute:0");
let state=SEONGA_LIBRARY_UI_DEBUG.getState();assert.equal(state.facts.exitRoute.knowledge,"verified");assert.equal(state.facts.exitRoute.playerClaim,"북측 비상구");
click("act:reinvestigate:exitRoute");click("act:lock:exitRoute");
state=SEONGA_LIBRARY_UI_DEBUG.getState();assert.equal(state.battlePhase,"collapse");assert.deepEqual(state.lockOrder,["exitRoute"]);
assert.match(app.innerHTML,/COLLAPSE/);assert.match(app.innerHTML,/고정 순서 F2/);assert.match(app.innerHTML,/오판|검증됨|고정됨/);

console.log(JSON.stringify({flow:["party","briefing","exploration","claim","fact-reinvestigation","first-lock"],claimVisible:true,conflictVisible:true,battlePhase:"collapse",lockOrder:["exitRoute"],layoutContract:true},null,2));
