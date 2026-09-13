"use strict";

const assert=require("node:assert/strict");
global.window=global;global.SEONGA_TEST_INSTANT_PRESENTATION=true;let saved=null;global.localStorage={getItem(){return saved;},setItem(key,value){saved=value;}};
const app={innerHTML:"",handler:null,addEventListener(type,handler){this.handler=handler;}};global.document={querySelector(){return app;}};
require("../data/campaign.js");require("../data/characters.js");require("../data/neutral-abilities.js");require("../data/cafeteria-incident.js");require("../cafeteria-engine.js");require("../cafeteria-app.js");
const click=action=>app.handler({target:{dataset:{action},parentElement:app}});
click("briefing");click("begin-explore");click("select-location:inventory");assert.match(app.innerHTML,/식자재 보존 우선 루트 해금/);assert.doesNotMatch(app.innerHTML,/격리 가능한 품목을 남겼다/);click("investigate:inventory-archive");click("select-location:staff");click("investigate:staff-crosscheck");click("start");const state=SEONGA_CAFETERIA_UI_DEBUG.getState();state.progress=SEONGA_CAFETERIA_EVENT.stages[0].needed-1;click("act:progress-primary");assert.equal(state.phase,"interlude");click("next");assert.match(app.innerHTML,/식자재 보존 우선/);assert.match(app.innerHTML,/data-action="act:priority-supplies" >/);click("act:priority-supplies");assert.equal(state.priority,"supplies");assert.match(app.innerHTML,/식자재 격리/);
console.log(JSON.stringify({inventoryApproachDirectionVisible:true,rewardHidden:true,suppliesPrioritySelectable:true},null,2));
