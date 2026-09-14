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

function click(action){app.handler({target:{dataset:{},getAttribute(name){return name==="data-action"?action:null;},parentElement:app}});}
assert.match(app.innerHTML,/교실에 들어갈 네 명/);
click("start-briefing");
for(const name of ["화영","강운심","에피 미노스","이난","김우주"])assert.match(app.innerHTML,new RegExp(name));
for(const name of ["마근아","변아리","조상민"])assert.doesNotMatch(app.innerHTML,new RegExp(name));
console.log(JSON.stringify({briefingCast:SEONGA_TUTORIAL_EVENT.characterPool.map(id=>GameEngine.character(id).name),excluded:["마근아","변아리","조상민"]},null,2));
