"use strict";

const assert=require("node:assert/strict");
global.window=global;
require("../data/characters.js");
require("../data/neutral-abilities.js");
require("../data/library-incident.js");
require("../library-engine.js");
const E=SEONGA_LIBRARY_EVENT;
const locationFor=id=>E.investigations.find(x=>x.choices.some(c=>c.id===id)).id;
function investigate(s,id,apply=false){assert.equal(LibraryEngine.selectLocation(s,locationFor(id)),true);assert.equal(LibraryEngine.investigate(s,id),true);while(LibraryEngine.currentInteraction(s))LibraryEngine.resolveInteraction(s,apply);}
function evidence(id,extra={}){return{id,protected:false,authoritative:false,authorityCharges:0,enhancementInteractionUsed:null,comparisonInteractions:[],disabledUntilRound:0,recovered:false,...extra};}
function battle(){const s=LibraryEngine.create();s.phase="battle";s.order=[...s.partyIds].sort((a,b)=>LibraryEngine.character(b).game.speed-LibraryEngine.character(a).game.speed);return s;}
function addAnchors(s,factId){for(const id of E.facts[factId].anchors)s.evidence[id]=evidence(id);}
function readyFact(s,factId){addAnchors(s,factId);s.facts[factId].playerClaim=E.facts[factId].truth;s.facts[factId].knowledge="verified";}

// 조합은 판정 선택지만 열며 자동 검증하지 않는다.
const judgment=LibraryEngine.create();LibraryEngine.beginExplore(judgment);
investigate(judgment,"access-wooju");investigate(judgment,"search-unshim");
assert.equal(judgment.facts.studentCount.knowledge,"unknown");
assert.equal(LibraryEngine.canJudgeFact(judgment,"studentCount"),true);
assert.equal(LibraryEngine.claimOptions(judgment,"studentCount").length,2);
assert.equal(LibraryEngine.compareEvidence(judgment,"studentCount"),true);
assert.equal(judgment.facts.studentCount.knowledge,"unknown");

// 정답/오답 판정과 deterministic 재판정.
assert.equal(LibraryEngine.judgeFact(judgment,"studentCount","5명"),true);
assert.equal(judgment.facts.studentCount.knowledge,"misverified");assert.equal(judgment.phase,"exploration");assert.equal(judgment.misjudgments,1);
investigate(judgment,"counter-epi");assert.equal(judgment.facts.studentCount.knowledge,"misverified");
assert.equal(LibraryEngine.judgeFact(judgment,"studentCount","3명"),true);
assert.equal(judgment.facts.studentCount.knowledge,"verified");assert.equal(judgment.facts.studentCount.playerClaim,"3명");

// 충돌 관측 API.
const conflict=LibraryEngine.factConflict(judgment,"studentCount");
assert.equal(conflict.active,true);assert.ok(conflict.observations.some(x=>x.includes("3건")));assert.ok(conflict.observations.some(x=>x.includes("5명")));

// lock은 올바른 판정과 anchor가 모두 필요하다.
const lockGate=battle();addAnchors(lockGate,"studentCount");
assert.equal(LibraryEngine.actions(lockGate).find(x=>x.id==="lock:studentCount").disabled,true);
lockGate.facts.studentCount.playerClaim="5명";lockGate.facts.studentCount.knowledge="misverified";
assert.equal(LibraryEngine.actions(lockGate).find(x=>x.id==="lock:studentCount").disabled,true);
lockGate.facts.studentCount.playerClaim="3명";lockGate.facts.studentCount.knowledge="verified";
assert.equal(LibraryEngine.actions(lockGate).find(x=>x.id==="lock:studentCount").disabled,false);

// 첫 lock은 collapse 전환, 순서 기록, F1 consequence를 발생시킨다.
lockGate.factEffects.phantomTargets=4;const routeBefore=lockGate.factEffects.routeRisk;
assert.equal(LibraryEngine.act(lockGate,"lock:studentCount"),true);
assert.equal(lockGate.battlePhase,"collapse");assert.deepEqual(lockGate.lockOrder,["studentCount"]);
assert.equal(lockGate.factEffects.phantomTargets,0);assert.equal(lockGate.factEffects.routeRisk,routeBefore+1);

// F2/F3 첫 고정 consequence.
const f2First=battle();readyFact(f2First,"exitRoute");f2First.factEffects.routeRisk=3;
LibraryEngine.act(f2First,"lock:exitRoute");assert.equal(f2First.factEffects.routeRisk,0);assert.equal(f2First.minaLoad,1);assert.ok(f2First.factEffects.correctionBacklash>0);
const f3First=battle();readyFact(f3First,"origin");f3First.factEffects.correctionBacklash=0;
LibraryEngine.act(f3First,"lock:origin");assert.equal(f3First.factEffects.correctionBacklash,0);assert.equal(f3First.minaLoad,2);assert.equal(f3First.patternMitigation,1);

// rewrite는 locked 사실을 제외하고 다른 미고정 사실을 강화한다.
const rewrite=battle();readyFact(rewrite,"studentCount");LibraryEngine.act(rewrite,"lock:studentCount");
rewrite.patternStep=1;const lockedLevel=rewrite.facts.studentCount.corruptionLevel,originLevel=rewrite.facts.origin.corruptionLevel;
LibraryEngine._applyPattern(rewrite);assert.equal(rewrite.facts.studentCount.corruptionLevel,lockedLevel);assert.ok(rewrite.facts.origin.corruptionLevel>originLevel);

// confirmation은 misverified를 bias가 더 높은 다른 fact보다 우선한다.
const confirmation=battle();confirmation.battlePhase="collapse";confirmation.patternStep=0;
confirmation.facts.studentCount.bias=10;confirmation.facts.exitRoute.knowledge="misverified";confirmation.facts.exitRoute.playerClaim="서측 서가";
const wrongLevel=confirmation.facts.exitRoute.corruptionLevel;LibraryEngine._applyPattern(confirmation);
assert.ok(confirmation.facts.exitRoute.corruptionLevel>wrongLevel);

// source-loss는 claim을 지우지 않고 protected에는 적용되지 않는다.
const loss=battle();loss.battlePhase="collapse";loss.patternStep=2;loss.facts.studentCount.playerClaim="3명";loss.facts.studentCount.knowledge="verified";
loss.evidence["official-record"]=evidence("official-record");loss.evidence["evacuation-rule"]=evidence("evacuation-rule",{protected:true});
LibraryEngine._applyPattern(loss);assert.equal(loss.facts.studentCount.playerClaim,"3명");assert.equal(loss.facts.studentCount.knowledge,"verified");
assert.equal(loss.evidence["evacuation-rule"].disabledUntilRound,0);assert.ok(loss.evidence["official-record"].disabledUntilRound>0);

// 관계 효과는 판정 방법만 바꾸며 정답을 자동 확정하지 않는다.
const relation=LibraryEngine.create();LibraryEngine.beginExplore(relation);investigate(relation,"access-unshim");
assert.equal(LibraryEngine.selectLocation(relation,"counter"),true);LibraryEngine.investigate(relation,"counter-mageuna");
LibraryEngine.resolveInteraction(relation,true);LibraryEngine.resolveInteraction(relation,true);
assert.equal(relation.judgmentUnlocks.studentCount,true);assert.equal(relation.facts.studentCount.knowledge,"unknown");
assert.equal(relation.evidence["official-record"].authoritative,true);

// 변아리 후방 지원은 가장 위험한 사실의 오염을 억제한다.
const ariSupport=battle();ariSupport.supportId="byeon-ari";ariSupport.members["byeon-ari"].hp=0;
assert.equal(LibraryEngine.supportStatus(ariSupport).available,true);assert.equal(LibraryEngine.useSupport(ariSupport),true);
assert.equal(ariSupport.members["byeon-ari"].hp,0);assert.ok(ariSupport.suppressedFact);assert.equal(ariSupport.suppressedUntilRound,ariSupport.round+1);
assert.equal(ariSupport.log.some(x=>x.source==="byeon-ari"&&x.stat==="hp"),false);

// partial 추적도 정답 자동 판정 대신 F3 판정 선택지를 연다.
const partial=LibraryEngine.create();LibraryEngine.beginExplore(partial);investigate(partial,"access-unshim");investigate(partial,"search-unshim");investigate(partial,"exit-hwayoung");
assert.equal(partial.originTraceUnlocked,true);assert.equal(partial.facts.origin.knowledge,"unknown");LibraryEngine.start(partial);
assert.equal(LibraryEngine.act(partial,"trace-origin"),true);assert.equal(partial.judgmentUnlocks.origin,true);assert.equal(partial.facts.origin.knowledge,"unknown");
assert.ok(LibraryEngine.actions(partial).some(x=>x.id.startsWith("claim:origin:")));

// 블루스크린 중 lock/rewrite 금지와 재부팅 수명은 유지한다.
const blue=battle();readyFact(blue,"studentCount");blue.minaLoad=5;LibraryEngine._checkBlueScreen(blue);
assert.equal(blue.minaOfflineRounds,1);assert.equal(LibraryEngine.actions(blue).find(x=>x.id==="lock:studentCount").disabled,true);
const beforeRewrite=blue.facts.studentCount.corruptionLevel;LibraryEngine._applyPattern(blue);assert.equal(blue.facts.studentCount.corruptionLevel,beforeRewrite);

console.log(JSON.stringify({checks:23,automaticVerification:false,claimStates:["unknown","verified","misverified","locked"],collapseTransition:true,relationshipAutoAnswer:false},null,2));
