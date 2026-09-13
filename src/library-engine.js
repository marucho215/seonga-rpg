"use strict";

window.LibraryEngine=(()=>{
  const E=SEONGA_LIBRARY_EVENT,C=SEONGA_CHARACTERS;
  const character=id=>C.find(x=>x.id===id),member=(s,id)=>s.members[id],factIds=()=>Object.keys(E.facts);
  const subject=name=>{const code=name.charCodeAt(name.length-1)-0xac00;return`${name}${code>=0&&code<=11171&&code%28!==0?"이":"가"}`;};
  function present(s,type,text,meta={}){const item={type,text,message:text,...meta};s.log.push(item);s.presentation.push(item);return item;}
  const dialogue=(s,text,speaker,meta={})=>present(s,"dialogue",text,{speaker,...meta});
  const narration=(s,text,meta={})=>present(s,"narration",text,meta);
  const effect=(s,text,meta={})=>present(s,"effect",text,meta);
  const aliveIds=s=>s.partyIds.filter(id=>member(s,id).hp>0),currentId=s=>s.order[s.turn];
  const clamp=v=>Math.max(0,Math.min(E.rules.maxStability,v));
  function stabilityRule(value){const id=value<=0?"collapsed":value===1?"critical":value<=3?"distorted":value<=5?"unstable":"stable";return{id,...E.stabilityThresholds[id]};}
  function initialFactEffects(){const result={};for(const rule of Object.values(E.factEffectRules))result[rule.stateKey]=rule.initial;return result;}

  function create(){
    const members={};C.forEach(x=>members[x.id]={hp:x.game.hp,heat:0,info:0,memory:0,cool:0,effort:0,rules:SEONGA_NEUTRAL_KITS[x.id]?.limit||0});
    const facts={};factIds().forEach(id=>facts[id]={knowledge:"unknown",reality:"corrupted",current:E.facts[id].current,playerClaim:null,corruptionLevel:1,bias:0,lastTouched:0,claimEvidenceCount:0,recheckReady:false});
    return{phase:"party",battlePhase:"audit",partyIds:["hwayoung","kang-unshim","inan","kim-wooju"],supportId:"mageuna",members,
      evidence:{},investigated:[],selectedLocation:null,investigationsLeft:E.rules.investigationLimit,
      pendingInteractions:[],skippedInteractions:[],interactionState:{used:[]},relationshipHistory:[],
      judgmentUnlocks:{},forecastKnown:false,originTraceUnlocked:false,systemInsight:false,conflictReveal:0,
      facts,factEffects:initialFactEffects(),reinvestigations:Object.fromEntries(factIds().map(id=>[id,0])),
      lockOrder:[],misjudgments:0,pureRecoveryActions:0,patternMitigation:0,patternPressure:0,factEffectShield:0,
      suppressedFact:null,suppressedUntilRound:0,sourceSnapshot:false,originMitigation:0,
      stability:E.rules.maxStability,minaLoad:0,minaOfflineRounds:0,pendingBlueScreen:false,
      rewriteBlock:false,patternBlock:false,round:1,patternStep:0,order:[],turn:0,acted:[],
      supportUses:E.rules.supportCharges,supportUsedRound:0,lastActionId:null,lastActionActorId:null,stageActions:0,
      failureReason:"",recorded:false,log:[],presentation:[]};
  }
  function toggle(s,id){if(!E.characterPool.includes(id)||s.phase!=="party")return false;const index=s.partyIds.indexOf(id);if(index>=0){if(s.partyIds.length<=1)return false;s.partyIds.splice(index,1);}else if(s.partyIds.length<E.rules.partySize)s.partyIds.push(id);else return false;if(s.partyIds.includes(s.supportId)){const replacement=E.characterPool.find(x=>!s.partyIds.includes(x));if(replacement)s.supportId=replacement;}return true;}
  function support(s,id){if(s.phase!=="party"||s.partyIds.includes(id)||!E.characterPool.includes(id))return false;s.supportId=id;return true;}
  function beginBriefing(s){if(s.partyIds.length!==E.rules.partySize||s.partyIds.includes(s.supportId))return false;s.phase="briefing";return true;}
  function beginExplore(s){if(!["party","briefing"].includes(s.phase)||s.partyIds.length!==E.rules.partySize)return false;s.phase="exploration";return true;}
  function selectLocation(s,id){if(s.phase!=="exploration"||currentInteraction(s)||s.investigationsLeft<=0||s.investigated.includes(id)||!E.investigations.some(x=>x.id===id))return false;s.selectedLocation=id;return true;}
  function leaveLocation(s){if(s.phase!=="exploration"||currentInteraction(s))return false;s.selectedLocation=null;return true;}
  function updatePartialUnlocks(s){if(!s.originTraceUnlocked&&E.facts.origin.partial.some(pair=>pair.every(id=>evidenceActive(s,id)))){s.originTraceUnlocked=true;effect(s,"두 제보의 확산 시각을 따라 최초 오염을 추적할 수 있다.",{stat:"originTrace",tone:"progress"});}}
  function addEvidence(s,id,extra={}){if(s.evidence[id])return false;s.evidence[id]={id,protected:false,authoritative:false,authorityCharges:0,enhancementInteractionUsed:null,comparisonInteractions:[],disabledUntilRound:0,recovered:false,...extra};updatePartialUnlocks(s);return true;}
  const evidenceActive=(s,id)=>Boolean(s.evidence[id]&&s.round>s.evidence[id].disabledUntilRound);
  const hasPair=(s,pair,active=true)=>pair.every(id=>active?evidenceActive(s,id):Boolean(s.evidence[id]));
  const activeEvidenceCount=(s,factId)=>Object.keys(s.evidence).filter(id=>evidenceActive(s,id)&&E.evidenceInfo[id].facts.includes(factId)).length;
  const factStatus=(s,id)=>s.facts[id].reality==="locked"?"locked":s.facts[id].knowledge;
  const evidenceCondition=(s,id,active=true)=>E.facts[id].verify.some(pair=>hasPair(s,pair,active));
  function canJudgeFact(s,id){
    const f=s.facts[id];if(!f||f.reality==="locked")return false;
    const condition=evidenceCondition(s,id,true)||Boolean(s.judgmentUnlocks[id])||(id==="origin"&&s.originTraceUnlocked&&s.judgmentUnlocks.origin);
    if(!condition)return false;
    if(f.knowledge!=="misverified")return f.knowledge!=="verified";
    return s.phase==="battle"||f.recheckReady||activeEvidenceCount(s,id)>f.claimEvidenceCount;
  }
  const canVerify=(s,id,active=true)=>evidenceCondition(s,id,active);
  function factConflict(s,factId){
    const rule=(E.conflicts[factId]||[]).find(x=>hasPair(s,x.requires,true));
    const observations=rule?[...rule.observations]:[];
    if(s.systemInsight&&E.facts[factId].claims)observations.push(`현재 시스템 주장: ${s.facts[factId].current}`);
    if(s.conflictReveal>0){const witness=Object.keys(s.evidence).find(id=>evidenceActive(s,id)&&E.evidenceInfo[id].kind==="testimony"&&E.evidenceInfo[id].facts.includes(factId));if(witness)observations.push(E.evidenceInfo[witness].summary);}
    const unique=[...new Set(observations)];return{active:Boolean(rule)||unique.length>1,observations:rule||unique.length>1?unique:[]};
  }
  const claimOptions=(s,factId)=>canJudgeFact(s,factId)?E.facts[factId].claims:[];

  function queueInteraction(s,item){if(!s.pendingInteractions.some(x=>x.id===item.id)&&!s.skippedInteractions.includes(item.id)&&!s.interactionState.used.includes(item.id))s.pendingInteractions.push(item);}
  function matchingEvidence(s,matcher){return Object.keys(s.evidence).filter(id=>{const info=E.evidenceInfo[id];return info.sourceCharacter===matcher.sourceCharacter&&info.kind===matcher.evidenceKind;});}
  function queueEvidenceInteractions(s,evidenceId){
    const info=E.evidenceInfo[evidenceId];
    for(const def of E.relationshipInteractions){
      if(def.category==="enhancement"&&info.sourceCharacter===def.sourceCharacter&&def.evidenceKinds.includes(info.kind))queueInteraction(s,{...def,id:`${def.id}:${evidenceId}`,definitionId:def.id,evidenceIds:[evidenceId]});
      if(def.category==="comparison"){const left=matchingEvidence(s,def.left),right=matchingEvidence(s,def.right);outer:for(const a of left)for(const b of right){const common=E.evidenceInfo[a].facts.filter(id=>E.evidenceInfo[b].facts.includes(id));if(common.length){queueInteraction(s,{...def,definitionId:def.id,evidenceIds:[a,b],factId:common[0]});break outer;}}}
    }
  }
  function interactionValid(s,item){if(item.category==="enhancement")return item.evidenceIds.every(id=>s.evidence[id]&&!s.evidence[id].enhancementInteractionUsed);return item.evidenceIds.every(id=>s.evidence[id])&&!s.interactionState.used.includes(item.id);}
  function currentInteraction(s){while(s.pendingInteractions.length&&!interactionValid(s,s.pendingInteractions[0]))s.pendingInteractions.shift();return s.pendingInteractions[0]||null;}
  function checkBlueScreen(s){if(s.minaLoad<E.rules.maxMinaLoad||s.minaOfflineRounds||s.pendingBlueScreen)return false;s.minaLoad=E.rules.maxMinaLoad;if(s.phase==="exploration"){s.pendingBlueScreen=true;effect(s,"미나 처리량 한계 도달 — 해결 구간 시작 시 한 라운드 동안 정지한다.",{stat:"minaOffline",tone:"danger"});return true;}s.minaOfflineRounds=1;narration(s,"미나의 다이아몬드 홍채가 한 바퀴 돌다 멎고, 책상 위로 그대로 엎어진다.",{tone:"danger"});dialogue(s,E.dialogue.mina.offline,"제갈 미나",{tone:"danger"});effect(s,"블루스크린 — 한 라운드 동안 재작성과 현실 고정이 중단된다.",{stat:"minaOffline",tone:"danger"});return true;}
  function resolveInteraction(s,apply){
    if(s.phase!=="exploration")return false;const item=currentInteraction(s);if(!item)return false;s.pendingInteractions.shift();
    if(!apply){s.skippedInteractions.push(item.id);effect(s,`${item.title}을 보류했다.`,{stat:"interaction"});return true;}if(!interactionValid(s,item))return false;
    s.relationshipHistory.push(item.definitionId);
    if(item.category==="enhancement")item.evidenceIds.forEach(id=>s.evidence[id].enhancementInteractionUsed=item.id);else{s.interactionState.used.push(item.id);item.evidenceIds.forEach(id=>s.evidence[id].comparisonInteractions.push(item.id));}
    if(item.resolver==="protect-and-forecast"){const ev=s.evidence[item.evidenceIds[0]];ev.protected=true;s.forecastKnown=true;s.minaLoad++;dialogue(s,"원본 뺐어요. 오프라인이에요. 이제 선생님이 못 건드려요. …제 화면에도 이상한 짤 띄우지 마세요.","김우주",{accent:"kim-wooju"});effect(s,`${E.evidenceInfo[ev.id].label}: 보호됨 · 다음 오류 표적 공개.`,{source:"kim-wooju",stat:"protected",tone:"guard"});}
    else if(item.resolver==="declare-authority"){const ev=s.evidence[item.evidenceIds[0]];ev.authoritative=true;ev.authorityCharges=1;s.minaLoad++;dialogue(s,"검증 전 정보의 현실 반영은 규정 위반입니다.","마근아",{accent:"mageuna"});effect(s,`${E.evidenceInfo[ev.id].label}: 공식 기준점 · 재작성 1회 거부.`,{source:"mageuna",stat:"authoritative",tone:"guard"});}
    else{s.judgmentUnlocks[item.factId]=true;s.stability=clamp(s.stability-1);dialogue(s,"내 쪽은 17시 12분부터 다섯 명으로 바뀌었어. 네 도장 찍힌 종이는 몇 시인데?","강운심",{accent:"kang-unshim"});dialogue(s,"17시 11분 58초. 수정 이력 없음. 제보보다 2초 빠릅니다.","마근아",{accent:"mageuna"});effect(s,`적대적 교차검증 — ${E.facts[item.factId].label} 판정 선택지 개방, 현실 안정도 -1.`,{stat:"stability",delta:-1,tone:"warning"});}
    checkBlueScreen(s);return true;
  }
  function applySecondary(s,choice){
    if(choice.secondary==="system-difference")s.systemInsight=true;
    if(choice.secondary==="reduce-route-risk")s.factEffects.routeRisk=Math.max(0,s.factEffects.routeRisk-1);
    if(choice.secondary==="cool-mina")s.minaLoad=Math.max(0,s.minaLoad-1);
  }
  function investigate(s,choiceId){if(s.phase!=="exploration"||currentInteraction(s)||!s.selectedLocation||s.investigationsLeft<=0)return false;const location=E.investigations.find(x=>x.id===s.selectedLocation),choice=location?.choices.find(x=>x.id===choiceId);if(!choice)return false;addEvidence(s,choice.evidence);applySecondary(s,choice);s.investigated.push(location.id);s.investigationsLeft--;s.selectedLocation=null;narration(s,`${location.label}에서 ${character(choice.owner).name}의 조사가 시작된다.`,{accent:choice.owner});dialogue(s,choice.quote,character(choice.owner).name,{accent:choice.owner});narration(s,choice.result,{accent:choice.owner});effect(s,`${E.evidenceInfo[choice.evidence].qualityLabel} 확보 — ${E.evidenceInfo[choice.evidence].label}.`,{source:choice.owner,stat:"evidence"});queueEvidenceInteractions(s,choice.evidence);return true;}

  function effectSuppressed(s,factId){if(s.factEffectShield>0){s.factEffectShield--;effect(s,`${E.facts[factId].label}의 오염 반동을 화영이 받아냈다.`,{stat:"factEffectShield",tone:"guard"});return true;}return s.suppressedFact===factId&&s.round<=s.suppressedUntilRound;}
  function strengthenFactEffect(s,factId,amount){
    if(effectSuppressed(s,factId))return;const rule=E.factEffectRules[factId],key=rule.stateKey;
    s.factEffects[key]+=amount;effect(s,`${E.facts[factId].label} 오염 효과 강화 — ${rule.description}`,{stat:key,tone:"danger"});
  }
  function corruptFact(s,factId,amount=1){const f=s.facts[factId];if(!f||f.reality==="locked")return false;f.corruptionLevel+=amount;f.bias+=amount;strengthenFactEffect(s,factId,amount);return true;}
  function judgeFact(s,factId,claim){
    if(!["exploration","battle"].includes(s.phase)||!canJudgeFact(s,factId)||!E.facts[factId].claims.some(x=>x.value===claim))return false;
    const f=s.facts[factId];f.playerClaim=claim;f.lastTouched=s.round;f.claimEvidenceCount=activeEvidenceCount(s,factId);f.recheckReady=false;
    if(claim===E.facts[factId].truth){f.knowledge="verified";narration(s,`${E.facts[factId].label}의 충돌 관측을 ${claim}으로 판정했다.`,{tone:"decision"});effect(s,`판정 일치 — ${E.facts[factId].label}. 현실 고정 조건을 확인할 수 있다.`,{stat:"verified",tone:"success"});}
    else{f.knowledge="misverified";s.misjudgments++;narration(s,`${E.facts[factId].label}을 현재 현실의 주장인 ${claim}으로 판정했다.`,{tone:"danger"});stabilityChange(s,-1,{source:factId});corruptFact(s,factId,1);if(factId==="origin")addMinaLoad(s,1,"잘못된 원인 판정");effect(s,"오판은 즉시 실패가 아니며, 재조사 뒤 행동 1회로 다시 판정할 수 있다.",{stat:"misverified",tone:"warning"});}
    if(s.conflictReveal>0)s.conflictReveal--;return true;
  }
  function deferJudgment(s,factId){if(!canJudgeFact(s,factId))return false;effect(s,`${E.facts[factId].label} 판정을 보류했다. 현재 관측과 증거는 유지된다.`,{stat:"judgmentHold"});return true;}
  function compareEvidence(s,id){return canJudgeFact(s,id);}
  function buildOrder(s){s.order=aliveIds(s).sort((a,b)=>character(b).game.speed-character(a).game.speed);s.turn=0;s.acted=[];}
  function start(s){if(s.phase!=="exploration"||currentInteraction(s)||s.investigated.length!==E.rules.investigationLimit)return false;s.phase="battle";s.battlePhase="audit";s.round=1;s.patternStep=0;buildOrder(s);if(s.pendingBlueScreen){s.pendingBlueScreen=false;s.minaOfflineRounds=1;}narration(s,"세 조사 기록이 서로 다른 현재값을 주장한다. 결론은 기록이 아니라 대응자가 내려야 한다.",{tone:"transition"});return true;}

  function missingAnchors(s,factId=null){const ids=factId?[factId]:factIds();return ids.flatMap(id=>E.facts[id].anchors.filter(evidenceId=>!s.evidence[evidenceId]).map(evidenceId=>({factId:id,evidenceId})));}
  function canReinvestigate(s,factId){return s.phase==="battle"&&s.facts[factId].reality!=="locked"&&s.reinvestigations[factId]<E.rules.maxReinvestigationsPerFact&&(missingAnchors(s,factId).length>0||s.facts[factId].knowledge==="misverified");}
  function activeFactEffect(s,factId){return !(s.suppressedFact===factId&&s.round<=s.suppressedUntilRound);}
  function consumePhantom(s,factId){if(factId!=="studentCount"||!activeFactEffect(s,factId)||s.factEffects.phantomTargets<=0)return false;s.factEffects.phantomTargets--;effect(s,`가짜 이용자가 F1 재조사 동선을 가로챘다. 남은 가짜 대상 ${s.factEffects.phantomTargets}.`,{stat:"phantomTargets",delta:-1,tone:"warning"});return true;}
  function reinvestigateFact(s,factId,all=false,sourceId=currentId(s)){
    if(!canReinvestigate(s,factId))return false;s.pureRecoveryActions++;
    if(consumePhantom(s,factId))return true;
    s.reinvestigations[factId]++;
    if(factId==="exitRoute"&&activeFactEffect(s,factId)&&s.factEffects.routeRisk>0)stabilityChange(s,-1,{source:"routeRisk"});
    const missing=missingAnchors(s,factId),targets=all?missing:missing.slice(0,1);
    targets.forEach(item=>addEvidence(s,item.evidenceId,{recovered:true,protected:sourceId==="epi-minos"}));
    s.facts[factId].recheckReady=true;
    narration(s,`${E.facts[factId].label}을 현장에서 다시 조사했다.`,{accent:sourceId});
    effect(s,targets.length?`핵심 증거 확보 — ${targets.map(x=>E.evidenceInfo[x.evidenceId].label).join(" · ")}.`:"새 관측으로 기존 판정을 다시 검토할 수 있다.",{stat:"evidence",tone:"success"});return true;
  }
  const recoveryRequirement=()=>1;
  function bestRecovery(s,predicate=()=>true){return missingAnchors(s).filter(x=>predicate(E.evidenceInfo[x.evidenceId],x)).sort((a,b)=>Number(s.facts[b.factId].knowledge==="verified")-Number(s.facts[a.factId].knowledge==="verified")||a.evidenceId.localeCompare(b.evidenceId))[0]||null;}
  function normalizeRecovery(){return false;}
  function activeAnchorsReady(s,factId){return E.facts[factId].anchors.every(id=>evidenceActive(s,id));}
  function authoritativeGuard(s,factId){return Object.values(s.evidence).find(ev=>ev.authoritative&&ev.authorityCharges>0&&E.evidenceInfo[ev.id].facts.includes(factId));}
  function stabilityChange(s,amount,meta={}){const before=s.stability;s.stability=clamp(s.stability+amount);effect(s,`현실 안정도 ${before} → ${s.stability}.`,{stat:"stability",delta:s.stability-before,tone:amount>=0?"recover":"danger",...meta});}
  function lowerLoad(s,amount,source){const before=s.minaLoad;s.minaLoad=Math.max(0,s.minaLoad-amount);effect(s,`미나 처리 부하 ${before} → ${s.minaLoad}.`,{source,stat:"minaLoad",delta:s.minaLoad-before,tone:"recover"});}
  function addMinaLoad(s,amount,reason){if(s.originMitigation>0){const reduced=Math.min(amount,s.originMitigation);amount-=reduced;s.originMitigation-=reduced;}if(!amount)return;s.minaLoad+=amount;effect(s,`${reason}으로 미나 처리 부하 +${amount}. 현재 ${s.minaLoad}/${E.rules.maxMinaLoad}.`,{stat:"minaLoad",delta:amount,tone:"warning"});checkBlueScreen(s);}
  function lockedCount(s){return s.lockOrder.length;}
  function clearFactEffect(s,factId){const rule=E.factEffectRules[factId];s.factEffects[rule.stateKey]=0;}
  function resolveLockConsequence(s,factId,first){
    const rule=E.lockConsequences[factId];clearFactEffect(s,factId);
    if(rule.cost==="raise-route-risk"&&s.facts.exitRoute.reality!=="locked")s.factEffects.routeRisk++;
    if(rule.cost==="raise-origin-pressure"&&s.facts.origin.reality!=="locked"){s.factEffects.correctionBacklash++;addMinaLoad(s,1,"안전 동선 우선 고정");}
    if(rule.benefit==="mitigate-late-patterns"){s.patternMitigation=1;if(first)addMinaLoad(s,rule.costValue,"최초 오염 우선 고정");}
    effect(s,`고정 순서 효과 — ${rule.description}`,{stat:"lockConsequence",source:factId,tone:"warning"});
  }
  function lockFact(s,factId){
    const f=s.facts[factId],validClaim=f?.playerClaim===E.facts[factId]?.truth;
    if(!f||f.reality==="locked"||f.knowledge!=="verified"||!validClaim||!activeAnchorsReady(s,factId)||s.minaOfflineRounds)return false;
    const first=s.lockOrder.length===0,originBacklash=factId==="origin"&&s.factEffects.correctionBacklash>0;f.reality="locked";f.current=E.facts[factId].truth;f.corruptionLevel=0;f.bias=0;f.lastTouched=s.round;s.lockOrder.push(factId);
    if(originBacklash)addMinaLoad(s,E.factEffectRules.origin.lockLoad,"원인 정정 반동");
    resolveLockConsequence(s,factId,first);
    if(first){s.battlePhase="collapse";s.patternStep=0;narration(s,"한 문장이 원본으로 고정되는 순간, 나머지 두 오류가 동시에 더 강하게 현실을 주장한다.",{tone:"danger"});effect(s,"COLLAPSE 진입 — 후반 현상 순환이 시작된다.",{stat:"battlePhase",tone:"warning"});}
    dialogue(s,s.lockOrder.length===3?"세 건 일치. 정정 완료. …이번 문장은 정말 맞습니다.":"확정된 정보로 덮어쓰겠습니다. 이번에는… 틀리지 않았습니다.","제갈 미나",{tone:"success"});
    effect(s,`현실 고정 — ${E.facts[factId].label}: ${E.facts[factId].truth}.`,{stat:"locked",source:factId,tone:"success"});
    if(s.lockOrder.length===3){s.phase="success";narration(s,"세 사실이 선택한 순서대로 원본에 고정됐다.",{tone:"success"});}return true;
  }

  const action=(id,label,description,disabled=false)=>({id,label,description,disabled});
  function canPay(m,cost={}){return Object.entries(cost).every(([key,value])=>(m[key]||0)>=value);}
  function lockReason(s,factId){const f=s.facts[factId];if(f.knowledge!=="verified"||f.playerClaim!==E.facts[factId].truth)return"정답과 일치하는 플레이어 판정이 필요하다.";if(!activeAnchorsReady(s,factId))return"핵심 증거 쌍이 필요하다.";if(s.minaOfflineRounds)return"미나가 재부팅 중이다.";return"판정한 사실을 현재 현실에 고정한다.";}
  function actions(s){
    if(s.phase!=="battle"||!currentId(s))return[];const id=currentId(s),m=member(s,id),result=[];
    for(const factId of factIds())if(canReinvestigate(s,factId))result.push(action(`reinvestigate:${factId}`,`${E.facts[factId].label} 재조사`,`부족한 핵심 증거 하나 확보 · ${s.reinvestigations[factId]}/${E.rules.maxReinvestigationsPerFact}`));
    for(const factId of factIds())if(canJudgeFact(s,factId)){for(const [index,claim] of claimOptions(s,factId).entries())result.push(action(`claim:${factId}:${index}`,claim.label,"충돌 관측을 해석해 플레이어 판정을 기록한다."));result.push(action(`defer:${factId}`,"판단 보류","현재 관측과 증거를 유지한다."));}
    for(const factId of factIds())if(s.facts[factId].reality!=="locked"){const reason=lockReason(s,factId);result.push(action(`lock:${factId}`,`현실 고정 · ${E.facts[factId].label}`,reason,reason!=="판정한 사실을 현재 현실에 고정한다."));}
    if(s.originTraceUnlocked&&!s.judgmentUnlocks.origin)result.push(action("trace-origin","원인 추적","확산 시점의 추가 관측을 열어 F3 판정을 가능하게 한다."));
    result.push(action("contain","현상 억제","현실 안정도 +1."));
    for(const ability of E.abilities[id]||[]){let label=ability.label;if(id==="hwayoung")label+=` · 열량 ${m.heat}`;if(id==="kang-unshim")label+=` · 정보 ${m.info}`;if(id==="epi-minos")label+=` · 보존 ${m.memory}`;if(id==="mageuna")label+=` · 집행 ${m.rules}회`;if(id==="josangmin")label+=` · 비축 ${m.effort}`;const disabled=!canPay(m,ability.cost)||ability.cooldown&&m[ability.cooldown]>0||ability.ruleCost&&m.rules<ability.ruleCost||ability.hpCost&&m.hp<ability.hpCost||ability.id==="rule"&&s.rewriteBlock;result.push(action(ability.id,label,ability.description,disabled));}
    return result;
  }
  function mostDangerousFact(s){return factIds().filter(id=>s.facts[id].reality!=="locked").sort((a,b)=>Number(s.facts[b].knowledge==="misverified")-Number(s.facts[a].knowledge==="misverified")||s.facts[b].bias-s.facts[a].bias||s.facts[a].lastTouched-s.facts[b].lastTouched||factIds().indexOf(a)-factIds().indexOf(b))[0];}
  function resolveAbility(s,m,a,id){
    if(a.verb==="absorbThreat"){s.factEffectShield++;m.heat++;effect(s,"다음 사실별 오염 효과 1회 무효화.",{source:id,stat:"factEffectShield",tone:"guard"});}
    if(a.verb==="gatherIntel"){m.info++;s.conflictReveal++;effect(s,"다음 판정에서 증언 계열 충돌 관측을 추가 공개한다.",{source:id,stat:"conflictReveal"});}
    if(a.verb==="snapshotState"){const lost=Object.values(s.evidence).find(ev=>!evidenceActive(s,ev.id));if(lost){lost.disabledUntilRound=0;m.memory++;effect(s,`${E.evidenceInfo[lost.id].label}을 보존 장면에서 복원했다.`,{source:id,stat:"sourceLoss",tone:"recover"});}else{s.sourceSnapshot=true;effect(s,"다음 출처 소실 대상 한 건을 장면으로 보존한다.",{source:id,stat:"sourceSnapshot",tone:"guard"});}}
    if(a.verb==="stabilizeField"){lowerLoad(s,2,id);s.originMitigation++;m.cool=2;}
    if(a.verb==="analyze"){s.systemInsight=true;s.forecastKnown=true;m.cool=2;effect(s,"시스템 자료의 원본/현재 차이와 다음 오류 표적을 공개했다.",{source:id,stat:"forecast",tone:"progress"});}
    if(a.verb==="declareRule"){m.rules--;s.rewriteBlock=true;effect(s,`다음 재작성 차단 대기 · 남은 집행 ${m.rules}회.`,{source:id,stat:"rewriteBlock",tone:"guard"});}
    if(a.verb==="purify"){const target=mostDangerousFact(s);s.suppressedFact=target;s.suppressedUntilRound=s.round+1;m.hp=Math.max(0,m.hp-a.hpCost);m.cool=2;effect(s,`${E.facts[target].label} 오염 효과를 다음 라운드까지 억제. ${subject(character(id).name)} HP ${a.hpCost} 감소.`,{source:id,stat:"suppressedFact",tone:"guard"});}
    if(a.verb==="conserveAction"){m.effort++;effect(s,`비축 행동 ${m.effort} 확보.`,{source:id,stat:"effort",delta:1});}
    if(a.verb==="decisiveIntervention"){const target=factIds().filter(fid=>canReinvestigate(s,fid)).sort((a,b)=>missingAnchors(s,b).length-missingAnchors(s,a).length||factIds().indexOf(a)-factIds().indexOf(b))[0];if(target)reinvestigateFact(s,target,true,id);else stabilityChange(s,1,{source:id});}
  }
  function payAbility(m,a){if(a.cost)Object.entries(a.cost).forEach(([key,value])=>m[key]-=value);}
  function fail(s,reason){s.phase="failure";s.failureReason=reason;effect(s,reason,{stat:"failure",tone:"danger"});}
  function checkFailure(s){if(s.stability<=0){fail(s,"현실 안정도가 소진되어 도서관의 원본 기준을 유지하지 못했다.");return true;}if(aliveIds(s).length===0){fail(s,"출전 인원이 모두 전투 불능이 되어 도서관에서 철수했다.");return true;}return false;}
  const schedule=s=>s.battlePhase==="collapse"?E.patternScheduleLate:E.patternScheduleEarly;
  function resolveRewriteTarget(s,target){if(s.facts[target]?.reality!=="locked")return target;const start=factIds().indexOf(target);for(let i=1;i<=factIds().length;i++){const id=factIds()[(start+i)%factIds().length];if(s.facts[id].reality!=="locked")return id;}return null;}
  function patternAt(s,offset=0){const list=schedule(s),entry=list[(s.patternStep+offset)%list.length],pattern={...E.patterns.find(x=>x.id===entry.pattern),...entry};if(pattern.pattern==="rewrite"||pattern.id==="rewrite")pattern.fact=resolveRewriteTarget(s,pattern.fact);return pattern;}
  const currentPattern=s=>patternAt(s,0),nextPattern=s=>patternAt(s,1);
  function patternForecast(s){const pattern=nextPattern(s);return{known:s.forecastKnown,pattern:pattern.id,label:pattern.label,target:s.forecastKnown?(pattern.fact||pattern.kind||null):null};}
  function applyPattern(s){
    const p=currentPattern(s);if(s.patternBlock){s.patternBlock=false;effect(s,`${p.label} 차단 — 후방 대응이 이번 오류를 막았다.`,{stat:"patternBlock",tone:"guard"});return;}const tier=stabilityRule(s.stability),lateBonus=s.battlePhase==="collapse"?1:0,strength=Math.max(1,1+tier.corruptionBoost+lateBonus-s.patternMitigation);
    if(p.id==="rewrite"){if(!p.fact){effect(s,"모든 사실이 고정되어 재작성 대상을 잃었다.",{stat:"rewrite",tone:"guard"});return;}if(s.minaOfflineRounds){effect(s,"미나의 블루스크린으로 새로운 재작성이 발생하지 않았다.",{stat:"rewrite",tone:"guard"});return;}if(s.rewriteBlock){s.rewriteBlock=false;effect(s,`정정 제한 규정이 ${E.facts[p.fact].label} 재작성을 차단했다.`,{source:"mageuna",stat:"rewriteBlock",tone:"guard"});return;}const guard=authoritativeGuard(s,p.fact);if(guard){guard.authorityCharges--;effect(s,`${E.evidenceInfo[guard.id].label}의 공식 기준점이 재작성을 거부했다.`,{source:"mageuna",stat:"authoritative",tone:"guard"});return;}corruptFact(s,p.fact,strength);s.patternPressure+=strength;narration(s,`${E.facts[p.fact].label}의 현재 주장이 한 겹 더 강해졌다.`,{tone:"danger"});stabilityChange(s,-1);if(tier.rewriteLoad)addMinaLoad(s,tier.rewriteLoad,"불안정 반동");}
    else if(p.id==="source-loss"){let count=Math.max(1,(s.battlePhase==="collapse"?2:1)-s.patternMitigation);if(s.sourceSnapshot){count=Math.max(0,count-1);s.sourceSnapshot=false;}const candidates=Object.values(s.evidence).filter(ev=>evidenceActive(s,ev.id)&&!ev.protected&&E.evidenceInfo[ev.id].kind===p.kind&&!factIds().some(fid=>s.facts[fid].reality==="locked"&&E.facts[fid].anchors.includes(ev.id))).slice(0,count);if(!candidates.length){effect(s,"출처 소실이 판정 자료를 찾지 못했다.",{stat:"sourceLoss",tone:"guard"});return;}candidates.forEach(ev=>{ev.disabledUntilRound=s.round+1;effect(s,`출처 소실 — ${E.evidenceInfo[ev.id].label}이 다음 라운드 동안 판정에 사용할 수 없다.`,{stat:"sourceLoss",source:ev.id,tone:"warning"});});}
    else{const target=mostDangerousFact(s);if(!target)return;corruptFact(s,target,strength);s.patternPressure+=strength;narration(s,`${E.facts[target].label}의 ${s.facts[target].knowledge==="misverified"?"오판":"현재 주장"}이 우선 강화된다.`,{tone:"danger"});stabilityChange(s,-1);}
  }
  function endRound(s){const wasOffline=s.minaOfflineRounds>0;applyPattern(s);s.partyIds.forEach(id=>{if(member(s,id).cool>0)member(s,id).cool--;});if(wasOffline&&s.minaOfflineRounds>0){s.minaOfflineRounds--;if(!s.minaOfflineRounds){s.minaLoad=Math.min(3,s.minaLoad);effect(s,"미나가 안전 부하에서 재부팅했다.",{stat:"minaLoad",tone:"recover"});}}if(checkFailure(s)||s.phase!=="battle")return;s.patternStep++;s.round++;buildOrder(s);}
  function advanceTurn(s,actorId){s.acted.push(actorId);if(checkFailure(s)||s.phase!=="battle")return;const remaining=s.order.filter(id=>member(s,id).hp>0&&!s.acted.includes(id));if(remaining.length){s.turn=s.order.indexOf(remaining[0]);return;}endRound(s);}
  function act(s,id){
    if(s.phase!=="battle")return false;const actorId=currentId(s),m=member(s,actorId),available=actions(s).find(x=>x.id===id&&!x.disabled);if(!actorId||m.hp<=0||!available)return false;s.lastActionId=id;s.lastActionActorId=actorId;s.stageActions++;
    if(id.startsWith("reinvestigate:"))reinvestigateFact(s,id.slice(14),false,actorId);
    else if(id.startsWith("claim:")){const [,factId,index]=id.split(":");judgeFact(s,factId,E.facts[factId].claims[Number(index)].value);}
    else if(id.startsWith("defer:"))deferJudgment(s,id.slice(6));
    else if(id.startsWith("lock:"))lockFact(s,id.slice(5));
    else if(id==="trace-origin"){s.judgmentUnlocks.origin=true;s.facts.origin.recheckReady=true;narration(s,"공유 오답의 확산 시각을 거슬러 최초 발언과 검색 수정의 순서를 나란히 놓았다.",{tone:"decision"});effect(s,"F3 판정 선택지 개방.",{stat:"judgmentUnlock",tone:"progress"});}
    else if(id==="contain"){narration(s,"임시 기준선이 충돌하는 관측 사이를 붙든다.",{accent:actorId});stabilityChange(s,1,{source:actorId});}
    else{const a=(E.abilities[actorId]||[]).find(x=>x.id===id);if(!a)return false;narration(s,`${character(actorId).name}의 판단 도구를 사건 기록에 적용한다.`,{accent:actorId,tone:"ability"});dialogue(s,a.quote,character(actorId).name,{accent:actorId});payAbility(m,a);resolveAbility(s,m,a,actorId);}
    if(checkFailure(s)||s.phase!=="battle")return true;advanceTurn(s,actorId);return true;
  }
  function supportStatus(s){const id=s.supportId,a=E.supportAdapters[id],m=member(s,id);if(s.phase!=="battle")return{available:false,reason:"해결 구간이 아니다."};if(s.supportUses<=0)return{available:false,reason:"사건 전체 지원 횟수를 소진했다."};if(s.supportUsedRound===s.round)return{available:false,reason:"이번 라운드에는 이미 지원을 요청했다."};if(a.ruleCost&&m.rules<a.ruleCost)return{available:false,reason:"남은 집행 횟수가 없다."};return{available:true,reason:"사용 가능"};}
  function useSupport(s){const status=supportStatus(s);if(!status.available)return false;const id=s.supportId,a=E.supportAdapters[id],m=member(s,id);s.supportUses--;s.supportUsedRound=s.round;narration(s,`${character(id).name}의 후방 회선이 도서관 사건 기록표에 연결된다.`,{accent:id,tone:"support"});if(a.verb==="blockRisk")s.patternBlock=true;if(a.verb==="gatherIntel")s.conflictReveal++;if(a.verb==="restoreState")Object.values(s.evidence).forEach(ev=>ev.disabledUntilRound=0);if(a.verb==="stabilizeField")lowerLoad(s,1,id);if(a.verb==="improveEfficiency"){const ev=Object.values(s.evidence).find(x=>!x.protected);if(ev)ev.protected=true;else s.forecastKnown=true;}if(a.verb==="declareRule"){m.rules-=a.ruleCost;s.rewriteBlock=true;}if(a.verb==="createSafeZone"){s.suppressedFact=mostDangerousFact(s);s.suppressedUntilRound=s.round+1;}if(a.verb==="amplifyNextAction"){const target=factIds().find(fid=>canReinvestigate(s,fid));if(target)reinvestigateFact(s,target,true,id);}checkFailure(s);return true;}
  function minaReaction(s){if(s.minaOfflineRounds||s.pendingBlueScreen)return E.dialogue.mina.offline;if(s.minaLoad<=1)return E.dialogue.mina.low;if(s.minaLoad<=3)return E.dialogue.mina.middle;return E.dialogue.mina.high;}
  function resultSummary(s){return`세 번째 사건 해결 · 고정 순서 ${s.lockOrder.map(id=>E.facts[id].label.slice(0,2)).join("→")} · 오판 ${s.misjudgments}회 · 현실 안정도 ${s.stability}/${E.rules.maxStability} · 미나 부하 ${s.minaLoad}/${E.rules.maxMinaLoad} · 관계 ${s.relationshipHistory.join(",")||"없음"}`;}
  function takePresentation(s){const queued=s.presentation.slice();s.presentation.length=0;return queued;}
  return{create,toggle,support,beginBriefing,beginExplore,selectLocation,leaveLocation,investigate,currentInteraction,resolveInteraction,compareEvidence,judgeFact,deferJudgment,claimOptions,canJudgeFact,factConflict,start,actions,act,useSupport,supportStatus,currentPattern,nextPattern,patternForecast,stabilityRule,factStatus,canVerify,evidenceActive,recoveryRequirement,missingAnchors,bestRecovery,normalizeRecovery,canReinvestigate,lockedCount,minaReaction,resultSummary,takePresentation,character,event:E,_applyPattern:applyPattern,_checkBlueScreen:checkBlueScreen,_reinvestigateFact:reinvestigateFact};
})();
