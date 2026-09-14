"use strict";

const assert=require("node:assert/strict");
global.window=global;
global.SEONGA_TEST_INSTANT_PRESENTATION=true;
const app={innerHTML:"",handler:null,addEventListener(type,handler){this.handler=handler;}};
global.document={querySelector(){return app;}};
require("../data/characters.js");
require("../data/tutorial-endless-classroom.js");
require("../engine.js");
require("../ui-common.js");
require("../app.js");

function click(action){const button={getAttribute(name){return name==="data-action"?action:null;},parentElement:app};app.handler({target:{getAttribute(){return null;},parentElement:button}});}
assert.match(app.innerHTML,/교실에 들어갈 네 명/);
click("toggle:hwayoung");assert.match(app.innerHTML,/CURRENT UNIT · 3\/4/);assert.match(app.innerHTML,/data-action="start-briefing" disabled/);
click("toggle:epi-minos");assert.match(app.innerHTML,/CURRENT UNIT · 4\/4/);assert.match(app.innerHTML,/화영 · 화영 · 문 고정/);
click("start-briefing");
for(const name of ["화영","강운심","에피 미노스","이난","김우주"])assert.match(app.innerHTML,new RegExp(name));
for(const name of ["마근아","변아리","조상민"])assert.doesNotMatch(app.innerHTML,new RegExp(name));
console.log(JSON.stringify({briefingCast:SEONGA_TUTORIAL_EVENT.characterPool.map(id=>GameEngine.character(id).name),excluded:["마근아","변아리","조상민"]},null,2));
