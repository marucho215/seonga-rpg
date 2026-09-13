"use strict";

const assert=require("node:assert/strict");
global.window=global;
require("../data/characters.js");
require("../data/neutral-abilities.js");
require("../data/library-incident.js");
require("../library-engine.js");
const E=SEONGA_LIBRARY_EVENT,FACTS=Object.keys(E.facts);
const locationFor=id=>E.investigations.find(x=>x.choices.some(c=>c.id===id)).id;
function investigate(s,id){assert.equal(LibraryEngine.selectLocation(s,locationFor(id)),true);assert.equal(LibraryEngine.investigate(s,id),true);while(LibraryEngine.currentInteraction(s))LibraryEngine.resolveInteraction(s,false);}
function evidence(id){return{id,protected:false,authoritative:false,authorityCharges:0,enhancementInteractionUsed:null,comparisonInteractions:[],disabledUntilRound:0,recovered:false};}
function correctClaimAction(s,factId){const index=E.facts[factId].claims.findIndex(x=>x.value===E.facts[factId].truth);return`claim:${factId}:${index}`;}
function wrongClaimAction(factId){const index=E.facts[factId].claims.findIndex(x=>x.value!==E.facts[factId].truth);return`claim:${factId}:${index}`;}
function snapshot(s){return{stability:s.stability,minaLoad:s.minaLoad,phantomTargets:s.factEffects.phantomTargets,routeRisk:s.factEffects.routeRisk,correctionBacklash:s.factEffects.correctionBacklash,patternMitigation:s.patternMitigation,patternPressure:s.patternPressure};}

function solve(s,order=FACTS,wrongFacts=[]){
  const wrongDone=new Set(),snapshots=[];let guard=0;
  while(!["success","failure"].includes(s.phase)&&guard++<240){
    const target=order.find(id=>s.facts[id].reality!=="locked");
    if(!target)break;
    if(LibraryEngine.currentPattern(s).id==="rewrite"&&LibraryEngine.supportStatus(s).available)LibraryEngine.useSupport(s);
    const available=LibraryEngine.actions(s).filter(x=>!x.disabled),ids=new Set(available.map(x=>x.id));let id;
    if(s.stability<=2)id="contain";
    if(!id&&wrongFacts.includes(target)&&!wrongDone.has(target)&&ids.has(wrongClaimAction(target))){id=wrongClaimAction(target);wrongDone.add(target);}
    if(!id&&ids.has(`lock:${target}`))id=`lock:${target}`;
    if(!id&&ids.has(correctClaimAction(s,target)))id=correctClaimAction(s,target);
    if(!id&&target==="origin"&&ids.has("trace-origin"))id="trace-origin";
    if(!id&&ids.has(`reinvestigate:${target}`))id=`reinvestigate:${target}`;
    if(!id)id="contain";
    const beforeLocks=s.lockOrder.length;assert.equal(LibraryEngine.act(s,id),true,`행동 실패: ${id}`);
    if(s.lockOrder.length>beforeLocks)snapshots.push(snapshot(s));
  }
  assert.equal(s.phase,"success",`해결 실패: ${s.failureReason} / order=${order.join(",")} / actions=${s.stageActions}`);
  return{state:s,snapshots};
}
function allEvidenceState(){
  const s=LibraryEngine.create();s.phase="battle";s.order=[...s.partyIds].sort((a,b)=>LibraryEngine.character(b).game.speed-LibraryEngine.character(a).game.speed);
  for(const factId of FACTS){for(const id of E.facts[factId].anchors)s.evidence[id]=evidence(id);s.facts[factId].playerClaim=E.facts[factId].truth;s.facts[factId].knowledge="verified";}
  return s;
}

// 대표 lock order 세 개는 모두 성공하며 첫 고정 직후 상태가 구별된다.
const orders=[["studentCount","exitRoute","origin"],["exitRoute","origin","studentCount"],["origin","studentCount","exitRoute"]];
function solveOrderWithCollapse(order){
  const s=allEvidenceState();assert.equal(LibraryEngine.act(s,`lock:${order[0]}`),true);const firstLock=snapshot(s),round=s.round;
  while(s.phase==="battle"&&s.round===round)assert.equal(LibraryEngine.act(s,"contain"),true);
  const afterCollapsePattern=snapshot(s),result=solve(s,order);result.snapshots.unshift(firstLock,afterCollapsePattern);return result;
}
const orderRuns=orders.map(solveOrderWithCollapse);
for(let i=0;i<orders.length;i++)assert.deepEqual(orderRuns[i].state.lockOrder,orders[i]);
const firstSnapshots=orderRuns.map(x=>x.snapshots[0]),collapseSnapshots=orderRuns.map(x=>x.snapshots[1]);
assert.notDeepEqual(firstSnapshots[0],firstSnapshots[1]);assert.notDeepEqual(firstSnapshots[1],firstSnapshots[2]);assert.notDeepEqual(firstSnapshots[0],firstSnapshots[2]);
assert.ok(new Set(firstSnapshots.map(x=>`${x.minaLoad}:${x.routeRisk}:${x.correctionBacklash}:${x.patternMitigation}`)).size===3);
assert.ok(new Set(collapseSnapshots.map(x=>x.patternPressure)).size>=2,"F3 선고정의 후반 패턴 완화가 pressure 차이를 만들어야 한다.");

// 세 종류 오판 모두 즉시 실패하지 않고 행동 1회 재판정 뒤 최종 성공한다.
for(const wrongFact of FACTS){
  const s=allEvidenceState();
  for(const factId of FACTS){s.facts[factId].knowledge="unknown";s.facts[factId].playerClaim=null;}
  const result=solve(s,FACTS,[wrongFact]).state;
  assert.equal(result.misjudgments,1);assert.equal(result.phase,"success");assert.equal(result.facts[wrongFact].playerClaim,E.facts[wrongFact].truth);
}

// 5곳 중 3곳 × 각 장소 2개 접근 = 80개 합법 조사 루트 전수 검사.
const locations=E.investigations,sets=[];
for(let a=0;a<locations.length;a++)for(let b=a+1;b<locations.length;b++)for(let c=b+1;c<locations.length;c++)sets.push([locations[a],locations[b],locations[c]]);
const routes=[];for(const set of sets)for(let mask=0;mask<8;mask++)routes.push(set.map((location,index)=>location.choices[(mask>>index)&1].id));
const routeResults=[];
for(const choices of routes){
  const s=LibraryEngine.create();LibraryEngine.beginExplore(s);for(const choice of choices)investigate(s,choice);
  assert.equal(LibraryEngine.lockedCount(s),0);assert.equal(LibraryEngine.start(s),true);
  const result=solve(s).state;routeResults.push({actions:result.stageActions,recovery:result.pureRecoveryActions});
  assert.ok(result.pureRecoveryActions/result.stageActions<=0.5,`재조사 비율 초과: ${choices.join(",")}`);
}
const average=key=>routeResults.reduce((sum,x)=>sum+x[key],0)/routeResults.length;

console.log(JSON.stringify({
  orderRuns:orders.map((order,index)=>({order,firstLock:firstSnapshots[index],afterCollapsePattern:collapseSnapshots[index],final:{stability:orderRuns[index].state.stability,minaLoad:orderRuns[index].state.minaLoad}})),
  wrongRoutes:3,
  routeCoverage:{routes:routes.length,softLocks:0,minActions:Math.min(...routeResults.map(x=>x.actions)),maxActions:Math.max(...routeResults.map(x=>x.actions))},
  averageActions:Number(average("actions").toFixed(2)),
  averagePureRecovery:Number(average("recovery").toFixed(2)),
  pureRecoveryShare:Number((average("recovery")/average("actions")).toFixed(3))
},null,2));
