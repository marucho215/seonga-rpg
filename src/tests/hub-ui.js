"use strict";

const assert=require("node:assert/strict");global.window=global;let saved=JSON.stringify({completed:["endless-classroom"]});global.localStorage={getItem(){return saved;},setItem(key,value){saved=value;}};const hub={innerHTML:""};global.document={querySelector(){return hub;}};
require("../data/campaign.js");require("../data/characters.js");require("../data/neutral-abilities.js");require("../ui-common.js");require("../hub.js");
assert.equal((hub.innerHTML.match(/approach-card/g)||[]).length,4);assert.match(hub.innerHTML,/사건 01 · 완료/);assert.match(hub.innerHTML,/사건 02 · 진행 가능/);assert.match(hub.innerHTML,/사건 03 · 잠김/);assert.match(hub.innerHTML,/대응 인원 · 8명/);assert.doesNotMatch(hub.innerHTML,/debug\.html/);
console.log(JSON.stringify({catalogCards:4,unlockDrivenStatus:true,unlockedRosterCount:8,debugLink:false},null,2));
