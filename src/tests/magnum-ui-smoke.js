"use strict";

const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
global.window=global;global.SEONGA_TEST_INSTANT_PRESENTATION=true;let saved=JSON.stringify({completed:["endless-classroom","cafeteria-containment","library-reality-audit"]});
global.localStorage={getItem(){return saved;},setItem(key,value){saved=value;}};
const app={innerHTML:"",handler:null,addEventListener(type,handler){this.handler=handler;}},head={append(){}};
global.document={querySelector(selector){return selector==="#app"?app:null;},createElement(){return{dataset:{}};},head};
require("../data/campaign.js");require("../data/characters.js");require("../data/neutral-abilities.js");require("../data/magnum-incident.js");require("../magnum-engine.js");require("../ui-common.js");require("../magnum-app.js");
const click=action=>app.handler({target:{dataset:{action},parentElement:app}});
assert.match(app.innerHTML,/체육관에 들어갈 네 명/);assert.doesNotMatch(app.innerHTML,/매그넘<\/strong>/,"첫 클리어 전에는 매그넘이 편성 명단에 없어야 한다.");
click("briefing");assert.match(app.innerHTML,/천사는 그런 얼굴을 하지 않는다/);click("begin-explore");assert.match(app.innerHTML,/네 곳 중 서로 다른 두 곳/);
click("select-location:rumors");click("investigate:rumors-unshim");click("select-location:camera");click("investigate:camera-wooju");click("start");
for(const text of ["매그넘 HP","복제 불안정","복제 대기","IMI","재구성"])assert.match(app.innerHTML,new RegExp(text));
const source=fs.readFileSync(path.join(__dirname,"../magnum-app.js"),"utf8"),common=fs.readFileSync(path.join(__dirname,"../ui-common.js"),"utf8"),css=fs.readFileSync(path.join(__dirname,"../styles.css"),"utf8");assert.match(source,/SEONGA_UI\.createPresentation/);assert.doesNotMatch(common,/setTimeout\(/);assert.match(common,/data-action="presentation-next">계속/);assert.match(css,/\.accent-magnum\{/);assert.doesNotMatch(css,/:root\s*\{[^}]*--magnum/s);
console.log(JSON.stringify({flow:["party","briefing","exploration","battle"],bossHpVisible:true,instabilityVisible:true,copyQueueVisible:true,manualPresentation:true,cssScope:"accent-magnum only"},null,2));
