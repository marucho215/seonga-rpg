"use strict";

const assert=require("node:assert/strict");
global.window=global;
let timers=[],saved=null;
global.setTimeout=callback=>{timers.push(callback);return timers.length;};
global.clearTimeout=()=>{};
global.localStorage={getItem(){return saved;},setItem(key,value){saved=value;}};
const app={innerHTML:"",handler:null,addEventListener(type,handler){this.handler=handler;}};
global.document={querySelector(){return app;}};
require("../data/campaign.js");require("../data/characters.js");require("../data/neutral-abilities.js");require("../data/cafeteria-incident.js");require("../cafeteria-engine.js");require("../cafeteria-app.js");
const click=action=>app.handler({target:{dataset:{action},parentElement:app}});
click("briefing");click("begin-explore");click("select-location:inventory");click("investigate:inventory-archive");assert.equal(SEONGA_CAFETERIA_UI_DEBUG.isLocked(),true);assert.match(app.innerHTML,/presentation-layer narration/);const before=SEONGA_CAFETERIA_UI_DEBUG.getState().investigationsLeft;click("select-location:staff");assert.equal(SEONGA_CAFETERIA_UI_DEBUG.getState().investigationsLeft,before,"연출 중 연타가 조사를 중복 실행하지 않아야 한다.");assert.equal(SEONGA_CAFETERIA_UI_DEBUG.getState().selectedLocation,null);
assert.match(app.innerHTML,/계속/);assert.equal(timers.length,0,"서술은 자동 진행 타이머를 만들지 않아야 한다.");
click("presentation-next");assert.match(app.innerHTML,/presentation-layer dialogue/);assert.match(app.innerHTML,/계속/);assert.equal(timers.length,0,"대사는 자동 진행 타이머를 만들지 않아야 한다.");assert.equal(SEONGA_CAFETERIA_UI_DEBUG.isLocked(),true,"로그를 읽는 동안 행동 입력은 잠겨야 한다.");
let guard=0;while(SEONGA_CAFETERIA_UI_DEBUG.isLocked()&&guard++<30){assert.match(app.innerHTML,/계속/);click("presentation-next");assert.equal(timers.length,0,"모든 로그는 버튼 입력만으로 진행해야 한다.");}
assert.equal(SEONGA_CAFETERIA_UI_DEBUG.isLocked(),false,"연출 종료 뒤 입력이 풀려야 한다.");click("select-location:staff");assert.equal(SEONGA_CAFETERIA_UI_DEBUG.getState().selectedLocation,"staff","연출 종료 뒤 다음 입력이 가능해야 한다.");
console.log(JSON.stringify({lockedDuringPresentation:true,allLogsWaitForInput:true,duplicatePrevented:true,inputRestored:true},null,2));
