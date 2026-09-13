"use strict";

const assert=require("node:assert/strict");
global.window=global;
require("../data/characters.js");
require("../data/neutral-abilities.js");
require("../data/cafeteria-incident.js");
require("../cafeteria-engine.js");

const locationForChoice=choiceId=>SEONGA_CAFETERIA_EVENT.investigations.find(location=>location.choices.some(choice=>choice.id===choiceId)).id;
function investigate(state,choiceId){assert.equal(CafeteriaEngine.selectLocation(state,locationForChoice(choiceId)),true);assert.equal(CafeteriaEngine.investigate(state,choiceId),true);}
function preparedState(party,supportId,choices){
  const state=CafeteriaEngine.create();state.partyIds=party;state.supportId=supportId;
  assert.equal(CafeteriaEngine.beginExplore(state),true);
  investigate(state,choices[0]);
  assert.equal(CafeteriaEngine.start(state),false,"조사 한 번으로는 진입할 수 없어야 한다.");
  investigate(state,choices[1]);
  assert.equal(state.investigated.length,2);assert.equal(state.investigationsLeft,0);assert.equal(CafeteriaEngine.start(state),true);
  return state;
}

function pickAction(state,priority,routeOrder,staffSecondary=false){
  const actions=CafeteriaEngine.actions(state).filter(action=>!action.disabled);
  const actorId=state.order[state.turn],actorLastAction=state.actionMemory[actorId]?.id;
  const preferred=ids=>{for(const id of ids){const found=actions.find(action=>action.id===id&&action.id!==actorLastAction);if(found)return found;}return ids.map(id=>actions.find(action=>action.id===id)).find(Boolean);};
  if(state.stage===1&&!state.priority)return actions.find(action=>action.id===`priority-${priority}`);
  const pattern=CafeteriaEngine.currentPattern(state);
  if(state.stage===2){
    const routeId=routeOrder.find(id=>!state.routes.find(route=>route.id===id).sealed),index=state.routes.findIndex(route=>route.id===routeId),route=state.routes[index];
    const pressure=preferred(["purify","calm","absorb","decisive-contain","rule","cold-zone","distributed","contain"]),prepare=actions.find(action=>action.id===`prepare-${index}`)||actions.find(action=>action.id.startsWith("prepare-")&&action.id!==actorLastAction),predict=actions.find(action=>action.id==="predict"),conserve=actions.find(action=>action.id==="conserve");
    const immediateRisk=Math.max(0,route.currentRisk-(route.prepared?1:0)-(state.prediction?1:0)-(state.safeSeal>0?1:0)-(state.reserveBoost>0?1:0)),immediateReaction=CafeteriaEngine.currentPattern(state).id==="surge"?1:0,finalSeal=actions.find(action=>action.id===`seal-${index}`);
    if(state.routes.filter(item=>!item.sealed).length===1&&finalSeal&&state.spread+immediateRisk+immediateReaction<SEONGA_CAFETERIA_EVENT.rules.failureSpread)return finalSeal;
    if(state.spread>=5&&pressure&&pressure.id!==actorLastAction)return pressure;
    if(prepare&&(route.currentRisk>=2||state.spread>=5))return prepare;
    if(predict&&!state.prediction)return predict;
    if(conserve&&state.members.josangmin.effort<1)return conserve;
    const risk=Math.max(0,route.currentRisk-(route.prepared?1:0)-(state.prediction?1:0)-(state.safeSeal>0?1:0)-(state.reserveBoost>0?1:0)),reaction=CafeteriaEngine.currentPattern(state).id==="surge"?1:0,endRoundRisk=state.acted.length===state.partyIds.filter(id=>state.members[id].hp>0).length-1?1:0;
    if(state.spread+risk+reaction+endRoundRisk>=SEONGA_CAFETERIA_EVENT.rules.failureSpread)return pressure||actions.find(action=>action.id!==actorLastAction)||actions[0];
    return actions.find(action=>action.id===`seal-${index}`)||actions.find(action=>action.id==="contain")||actions[0];
  }
  if(state.spread>=6||state.spread>=5&&pattern.id!=="coagulation")return preferred(["purify","calm","absorb","decisive-contain","contain"]);
  if(pattern.id==="surge")return preferred(["absorb","calm","purify","intel","snapshot","conserve","rule","cold-zone","contain"]);
  if(state.stage===1&&priority==="supplies"&&state.secondary<SEONGA_CAFETERIA_EVENT.priorities.supplies.secondaryNeeded)return actions.find(action=>action.id==="progress-secondary")||actions[0];
  if(state.stage===1&&priority==="staff"&&staffSecondary&&state.secondary<SEONGA_CAFETERIA_EVENT.priorities.staff.secondaryNeeded)return actions.find(action=>action.id==="progress-secondary")||actions[0];
  const progress=preferred(["analyze","swing","restore","decisive-progress","progress-primary"]);
  if(progress?.id===actorLastAction)return preferred(["absorb","calm","purify","intel","snapshot","conserve","rule","cold-zone","contain"])||progress;
  return progress||actions[0];
}

function simulate(config){
  const state=preparedState(config.party,config.support,config.choices),routeOrder=config.routeOrder||["drain","cart","vent"];
  let guard=0,stage3Entry=null,actionTrail=[];
  while(!["success","failure"].includes(state.phase)&&guard++<240){
    if(state.phase==="interlude"){CafeteriaEngine.nextStage(state);if(state.stage===2)stage3Entry=Object.fromEntries(state.routes.map(route=>[route.id,route.currentRisk]));continue;}
    if(state.phase!=="battle")continue;
    const supportWindow=state.stage===2&&state.supportId!=="josangmin"||state.stage<2&&(state.spread>=6||state.time<=1);
    if(supportWindow&&!state.supportUsed&&state.supportUses>0&&CafeteriaEngine.supportAvailable(state))CafeteriaEngine.useSupport(state);
    if(state.phase!=="battle")continue;
    const action=pickAction(state,config.priority,routeOrder,config.staffSecondary);assert.ok(action,`사용 가능한 행동 필요: stage ${state.stage}`);actionTrail.push(`${state.stage}:${state.round}:${state.order[state.turn]}:${action.id}`);CafeteriaEngine.act(state,action.id);
  }
  assert.equal(state.phase,"success",`${config.name} 경로가 완주해야 한다. stage=${state.stage} spread=${state.spread} time=${state.time} actions=${state.stageActions.join("/")} routes=${state.routes.map(r=>`${r.id}:${r.sealed?"X":r.currentRisk}`).join(",")} ${state.failureReason}\n${actionTrail.slice(-18).join("\n")}\n${state.log.slice(-8).map(x=>x.message).join("\n")}`);
  return{name:config.name,priority:config.priority,choices:config.choices,support:config.support,stageActions:state.stageActions,total:state.stageActions.reduce((a,b)=>a+b,0),supplies:state.outcomes.supplies,stage3Entry,routeOrder:state.routeOrder,finalSpread:state.spread};
}

// 조사 계약: 장소를 고른 뒤 접근법을 고르고, 서로 다른 두 장소를 완료해야 한다.
const exploration=CafeteriaEngine.create();CafeteriaEngine.beginExplore(exploration);
assert.equal(CafeteriaEngine.selectLocation(exploration,"drain"),true);
assert.equal(CafeteriaEngine.investigate(exploration,"drain-scan"),true);
assert.equal(CafeteriaEngine.selectLocation(exploration,"drain"),false,"같은 장소는 다시 조사할 수 없어야 한다.");
assert.equal(CafeteriaEngine.start(exploration),false);
investigate(exploration,"inventory-archive");assert.equal(CafeteriaEngine.start(exploration),true);

// 변아리 HP 비용, 0 고정, 차례 제외와 전원 전투 불능 실패.
const ari=preparedState(["byeon-ari","hwayoung","inan","josangmin"],"kim-wooju",["drain-purify","staff-calm"]);
ari.members["byeon-ari"].hp=1;ari.order=["byeon-ari","hwayoung","inan","josangmin"];ari.turn=0;
assert.equal(CafeteriaEngine.act(ari,"purify"),true);assert.equal(ari.members["byeon-ari"].hp,0);assert.notEqual(ari.order[ari.turn],"byeon-ari");
const allOut=preparedState(["byeon-ari","hwayoung","inan","josangmin"],"kim-wooju",["drain-purify","staff-calm"]);
allOut.partyIds.forEach(id=>allOut.members[id].hp=0);allOut.members["byeon-ari"].hp=1;allOut.order=["byeon-ari"];allOut.turn=0;
CafeteriaEngine.act(allOut,"purify");assert.equal(allOut.phase,"failure");assert.equal(allOut.members["byeon-ari"].hp,0);

// 변아리 후방 지원은 이동 소독 효과를 적용한다.
const ariSupport=preparedState(["hwayoung","kang-unshim","inan","kim-wooju"],"byeon-ari",["drain-scan","staff-crosscheck"]);
ariSupport.spread=4;ariSupport.members["byeon-ari"].hp=0;const ariSupportHp=ariSupport.members["byeon-ari"].hp;
assert.equal(CafeteriaEngine.supportStatus(ariSupport).available,true);assert.equal(CafeteriaEngine.useSupport(ariSupport),true);
assert.equal(ariSupport.members["byeon-ari"].hp,ariSupportHp);assert.equal(ariSupport.spread,2);
assert.equal(ariSupport.log.some(x=>x.source==="byeon-ari"&&x.stat==="hp"),false);

// 마근아 직접/후방 집행은 같은 3회 자원을 소비한다.
const directRule=preparedState(["mageuna","hwayoung","inan","josangmin"],"kim-wooju",["drain-scan","staff-crosscheck"]);
directRule.order=["mageuna","hwayoung","inan","josangmin"];directRule.turn=0;
CafeteriaEngine.act(directRule,"rule");assert.equal(directRule.members.mageuna.rules,2);assert.equal(directRule.blockEffect.sourceId,"mageuna");
directRule.members.mageuna.rules=0;directRule.blockEffect=null;directRule.acted=[];directRule.turn=0;assert.equal(CafeteriaEngine.actions(directRule).find(action=>action.id==="rule").disabled,true);
const supportRule=preparedState(["hwayoung","inan","kim-wooju","josangmin"],"mageuna",["drain-scan","staff-crosscheck"]);
supportRule.members.mageuna.rules=1;assert.equal(CafeteriaEngine.useSupport(supportRule),true);assert.equal(supportRule.members.mageuna.rules,0);supportRule.supportUsed=false;supportRule.blockEffect=null;assert.equal(CafeteriaEngine.useSupport(supportRule),false);

// 차단 효과의 실제 출처가 분리된다.
const hwaBlock=preparedState(["hwayoung","inan","kim-wooju","josangmin"],"byeon-ari",["drain-scan","staff-crosscheck"]);
hwaBlock.members.hwayoung.heat=2;hwaBlock.order=["hwayoung","inan","kim-wooju","josangmin"];hwaBlock.turn=0;CafeteriaEngine.act(hwaBlock,"distributed");assert.equal(hwaBlock.blockEffect.sourceId,"hwayoung");assert.match(hwaBlock.blockEffect.label,/화영/);
const inanBlock=preparedState(["inan","hwayoung","kim-wooju","josangmin"],"byeon-ari",["drain-scan","staff-crosscheck"]);
inanBlock.order=["inan","hwayoung","kim-wooju","josangmin"];inanBlock.turn=0;CafeteriaEngine.act(inanBlock,"cold-zone");assert.equal(inanBlock.blockEffect.sourceId,"inan");assert.match(inanBlock.blockEffect.label,/이난/);

// 조상민은 목표와 억제를 직접 골라야 한다.
const sangmin=preparedState(["josangmin","hwayoung","inan","kim-wooju"],"byeon-ari",["drain-scan","staff-crosscheck"]);
sangmin.members.josangmin.effort=2;sangmin.order=["josangmin","hwayoung","inan","kim-wooju"];sangmin.turn=0;
assert.ok(CafeteriaEngine.actions(sangmin).some(a=>a.id==="decisive-progress"));assert.ok(CafeteriaEngine.actions(sangmin).some(a=>a.id==="decisive-contain"));
const beforeProgress=sangmin.progress;CafeteriaEngine.act(sangmin,"decisive-progress");assert.equal(sangmin.progress,beforeProgress+2);
sangmin.turn=0;sangmin.acted=[];sangmin.round=2;sangmin.spread=6;const beforeSpread=sangmin.spread;CafeteriaEngine.act(sangmin,"decisive-contain");assert.equal(sangmin.spread,beforeSpread-3);

// 실패 경로: 확산 한계는 목표 완료가 아닌 행동 직후 실패한다.
const failure=preparedState(["hwayoung","inan","kim-wooju","josangmin"],"byeon-ari",["drain-scan","staff-crosscheck"]);failure.spread=8;CafeteriaEngine.act(failure,"progress-primary");assert.equal(failure.phase,"failure");

// 초견 첫 라운드: 서로 다른 두 인물의 기본 진행은 전역 반복으로 오판하지 않고 즉사하지 않는다.
const opening=preparedState(["hwayoung","kang-unshim","inan","kim-wooju"],"byeon-ari",["inventory-archive","staff-crosscheck"]);
assert.equal(CafeteriaEngine.currentPattern(opening).id,"coagulation","첫 구간은 진행 버튼을 추가 증폭하지 않는 반응으로 시작해야 한다.");
CafeteriaEngine.act(opening,"progress-primary");const firstActor=opening.lastActionActorId;CafeteriaEngine.act(opening,"progress-primary");
assert.notEqual(opening.lastActionActorId,firstActor);assert.equal(opening.repeatCount,1,"다른 캐릭터의 같은 명령은 반복 학습으로 세지 않는다.");assert.equal(opening.phase,"battle");assert.equal(opening.spread,6);

const configs=[
  {name:"대피-배수/증언",party:["hwayoung","kang-unshim","inan","kim-wooju"],support:"byeon-ari",choices:["drain-purify","staff-crosscheck"],priority:"staff",routeOrder:["cart","vent","drain"]},
  {name:"대피-흐름/환풍",party:["mageuna","byeon-ari","josangmin","kim-wooju"],support:"inan",choices:["drain-scan","vent-predict"],priority:"staff",routeOrder:["cart","vent","drain"]},
  {name:"대피-증언/점검로",party:["hwayoung","epi-minos","mageuna","byeon-ari"],support:"josangmin",choices:["staff-calm","vent-walk"],priority:"staff",routeOrder:["cart","vent","drain"]},
  {name:"대피-선택 격리 완수",party:["hwayoung","epi-minos","mageuna","byeon-ari"],support:"kim-wooju",choices:["staff-crosscheck","vent-walk"],priority:"staff",staffSecondary:true,routeOrder:["cart","drain","vent"]},
  {name:"보존-장부/증언",party:["kang-unshim","epi-minos","inan","josangmin"],support:"hwayoung",choices:["inventory-archive","staff-crosscheck"],priority:"supplies",routeOrder:["cart","vent","drain"]},
  {name:"보존-격리선/배수",party:["hwayoung","kim-wooju","mageuna","byeon-ari"],support:"epi-minos",choices:["inventory-line","drain-scan"],priority:"supplies",routeOrder:["cart","drain","vent"]},
  {name:"보존-장부/환풍",party:["hwayoung","kang-unshim","kim-wooju","josangmin"],support:"mageuna",choices:["inventory-archive","vent-predict"],priority:"supplies",routeOrder:["cart","vent","drain"]}
];
const results=configs.map(simulate);
function naiveRun(config,seed){
  const state=preparedState(config.party,config.support,config.choices);let value=seed>>>0,guard=0;
  const random=()=>{value=(value*1664525+1013904223)>>>0;return value/4294967296;};
  while(!["success","failure"].includes(state.phase)&&guard++<240){
    if(state.phase==="interlude"){CafeteriaEngine.nextStage(state);continue;}
    if(state.phase!=="battle")continue;
    if(!state.supportUsed&&state.supportUses&&CafeteriaEngine.supportAvailable(state)&&random()<.2)CafeteriaEngine.useSupport(state);
    if(state.phase!=="battle")continue;
    const actions=CafeteriaEngine.actions(state).filter(action=>!action.disabled);
    const forced=state.stage===1&&!state.priority?actions.find(action=>action.id===`priority-${config.priority}`):null;
    CafeteriaEngine.act(state,(forced||actions[Math.floor(random()*actions.length)]).id);
  }
  return{success:state.phase==="success",actions:state.stageActions.reduce((a,b)=>a+b,0),failure:state.failureReason};
}
const naive=Array.from({length:84},(_,index)=>naiveRun(configs[index%configs.length],index+41)),naiveFailures=naive.filter(x=>!x.success).length,naiveFailureRate=naiveFailures/naive.length;
assert.ok(naiveFailureRate>=.45,"무작위 행동은 유의미하게 실패해야 한다.");
assert.ok(results.some(x=>x.priority==="staff"&&x.supplies==="contaminated"));assert.ok(results.filter(x=>x.priority==="supplies").every(x=>x.supplies==="preserved"));
assert.ok(results.some(x=>x.priority==="staff"&&x.supplies==="preserved"&&x.stage3Entry.cart===3),"대피 우선에서도 선택 격리를 마치면 식자재와 기본 카트 위험을 보존해야 한다.");
assert.ok(results.filter(x=>x.priority==="staff").some(x=>x.stage3Entry.cart===5),"대피 우선에서 남긴 식자재는 카트 경로 위험을 높여야 한다.");
assert.ok(results.filter(x=>x.priority==="supplies").every(x=>Object.values(x.stage3Entry).every(risk=>risk<=2)),"보존 우선 완료는 세 봉쇄 경로의 진입 위험을 낮춰야 한다.");
assert.ok(new Set(results.map(x=>x.routeOrder.join("/"))).size>=2,"봉쇄 순서를 바꾼 경로를 검증해야 한다.");
assert.ok(new Set(results.map(x=>x.support)).size>=5,"여러 후방 지원을 검증해야 한다.");
assert.ok(new Set(results.map(x=>x.choices.join("/"))).size>=5,"여러 조사 조합을 검증해야 한다.");
for(const [id,abilities] of Object.entries(SEONGA_CAFETERIA_EVENT.abilities))for(const ability of abilities)assert.ok(SEONGA_NEUTRAL_KITS[id].verbs.includes(ability.verb),`${id}의 ${ability.verb}는 중립 능력 계약에 포함되어야 한다.`);
for(const [id,adapter] of Object.entries(SEONGA_CAFETERIA_EVENT.supportAdapters))assert.ok(SEONGA_NEUTRAL_KITS[id].verbs.includes(adapter.verb),`${id} 후방 지원의 ${adapter.verb}는 중립 능력 계약에 포함되어야 한다.`);
const lastAverage=results.reduce((sum,x)=>sum+x.stageActions[2],0)/results.length;assert.ok(lastAverage>=4,"마지막 구간은 최소한 네 번 이상의 판단을 평균적으로 요구해야 한다.");
const branchAverages={staff:Number((results.filter(x=>x.priority==="staff").reduce((sum,x)=>sum+x.total,0)/results.filter(x=>x.priority==="staff").length).toFixed(2)),supplies:Number((results.filter(x=>x.priority==="supplies").reduce((sum,x)=>sum+x.total,0)/results.filter(x=>x.priority==="supplies").length).toFixed(2))};
console.log(JSON.stringify({results,branchAverages,lastStageAverage:Number(lastAverage.toFixed(2)),naive:{runs:naive.length,failures:naiveFailures,failureRate:Number(naiveFailureRate.toFixed(3))}},null,2));
