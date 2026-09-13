"use strict";

const assert=require("node:assert/strict");
global.window=global;
require("../data/characters.js");
require("../data/neutral-abilities.js");
require("../data/tutorial-endless-classroom.js");
require("../engine.js");
require("../data/cafeteria-incident.js");
require("../cafeteria-engine.js");

const typed=items=>{assert.ok(items.length);for(const item of items){assert.ok(["dialogue","narration","effect"].includes(item.type));if(item.type==="dialogue")assert.ok(item.speaker);else assert.equal(item.speaker,undefined);}};

const tutorial=GameEngine.createState();
GameEngine.startBriefing(tutorial);typed(GameEngine.takePresentation(tutorial));
GameEngine.startExploration(tutorial);GameEngine.selectLocation(tutorial,SEONGA_TUTORIAL_EVENT.investigations[0].id);GameEngine.investigate(tutorial,SEONGA_TUTORIAL_EVENT.investigations[0].choices[0].id);
const investigation=GameEngine.takePresentation(tutorial);typed(investigation);assert.ok(investigation.some(x=>x.type==="dialogue"));assert.ok(investigation.some(x=>x.type==="effect"&&x.stat==="clue"));

const cafeteria=CafeteriaEngine.create();cafeteria.partyIds=["byeon-ari","hwayoung","inan","josangmin"];cafeteria.supportId="kim-wooju";CafeteriaEngine.beginExplore(cafeteria);
for(const [location,choice] of [["drain","drain-purify"],["staff","staff-calm"]]){CafeteriaEngine.selectLocation(cafeteria,location);CafeteriaEngine.investigate(cafeteria,choice);}CafeteriaEngine.start(cafeteria);CafeteriaEngine.takePresentation(cafeteria);
cafeteria.members["byeon-ari"].hp=1;cafeteria.order=["byeon-ari","hwayoung","inan","josangmin"];cafeteria.turn=0;CafeteriaEngine.act(cafeteria,"purify");
const purify=CafeteriaEngine.takePresentation(cafeteria);typed(purify);assert.ok(purify.some(x=>x.type==="narration"&&x.accent==="byeon-ari"));assert.ok(purify.some(x=>x.type==="dialogue"&&x.speaker==="변아리"));assert.ok(purify.some(x=>x.type==="effect"&&x.stat==="hp"&&x.delta===-1));assert.ok(purify.some(x=>x.type==="effect"&&x.stat==="incapacitated"));

const transition=CafeteriaEngine.create();transition.partyIds=["hwayoung","kang-unshim","inan","kim-wooju"];transition.supportId="byeon-ari";CafeteriaEngine.beginExplore(transition);for(const [location,choice] of [["drain","drain-scan"],["staff","staff-crosscheck"]]){CafeteriaEngine.selectLocation(transition,location);CafeteriaEngine.investigate(transition,choice);}CafeteriaEngine.start(transition);CafeteriaEngine.takePresentation(transition);transition.progress=SEONGA_CAFETERIA_EVENT.stages[0].needed-1;CafeteriaEngine.act(transition,"progress-primary");const transitionEvents=CafeteriaEngine.takePresentation(transition);typed(transitionEvents);assert.equal(transition.phase,"interlude");assert.ok(transitionEvents.some(x=>x.type==="narration"&&x.tone==="transition"));assert.equal(CafeteriaEngine.takePresentation(transition).length,0,"큐는 소비 후 비어야 한다.");

const fs=require("node:fs"),path=require("node:path"),css=fs.readFileSync(path.join(__dirname,"../styles.css"),"utf8"),cafeteriaApp=fs.readFileSync(path.join(__dirname,"../cafeteria-app.js"),"utf8");
assert.match(css,/@media\(max-width:760px\)/);assert.match(css,/\.command-menu\{grid-template-columns:1fr\}/);
for(const id of ["hwayoung","kang-unshim","epi-minos","inan","kim-wooju","mageuna","byeon-ari","josangmin"])assert.match(css,new RegExp(`\\.accent-${id}\\{\\s*--char-ink:`),`${id} 퍼스널 컬러가 필요하다.`);
assert.doesNotMatch(css,/#77bfff/i,"김우주의 이전 밝은 파랑 팔레트를 남기지 않는다.");
assert.match(css,/\.presentation-layer\.tone-ability\.accent-mageuna\{/,"마근아의 규정 집행에만 붉은 특수 강조를 사용한다.");
assert.match(cafeteriaApp,/previous\?\.type==="effect"/,"연속 effect를 결과 묶음으로 합쳐야 한다.");
assert.doesNotMatch(cafeteriaApp,/setTimeout\(advancePresentation/,"플레이 로그는 자동 진행 타이머를 사용하지 않아야 한다.");
assert.match(cafeteriaApp,/data-action="presentation-next">계속/,"모든 플레이 로그에 계속 버튼이 있어야 한다.");
console.log(JSON.stringify({investigationTypes:investigation.map(x=>x.type),purifyTypes:purify.map(x=>x.type),transitionQueued:true,mobileContract:true,profilePalettes:8,effectBundling:true,manualLogAdvance:true},null,2));
