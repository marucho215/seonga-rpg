"use strict";

window.LibraryEngine=(()=>{
  const E=SEONGA_LIBRARY_EVENT,C=SEONGA_CHARACTERS;
  const character=id=>C.find(x=>x.id===id),member=(s,id)=>s.members[id],factIds=()=>Object.keys(E.facts);
  const availableCharacterIds=()=>window.CampaignProgress?CampaignProgress.availableCharacterIds(E.id,E.characterPool):[...E.characterPool];
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
    const pool=availableCharacterIds(),supportId=pool.includes("mageuna")?"mageuna":pool.find(id=>!["hwayoung","kang-unshim","inan","kim-wooju"].includes(id))||"epi-minos";
    const facts={};factIds().forEach(id=>facts[id]={knowledge:"unknown",reality:"corrupted",current:E.facts[id].current,playerClaim:null,corruptionLevel:1,bias:0,lastTouched:0,claimEvidenceCount:0,recheckReady:false});
    return{phase:"party",battlePhase:"audit",partyIds:["hwayoung","kang-unshim","inan","kim-wooju"],supportId,members,
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
  function toggle(s,id){const pool=availableCharacterIds();if(!pool.includes(id)||s.phase!=="party")return false;const index=s.partyIds.indexOf(id);if(index>=0){if(s.partyIds.length<=1)return false;s.partyIds.splice(index,1);}else if(s.partyIds.length<E.rules.partySize)s.partyIds.push(id);else return false;if(s.partyIds.includes(s.supportId)){const replacement=pool.find(x=>!s.partyIds.includes(x));if(replacement)s.supportId=replacement;}return true;}
  function support(s,id){if(s.phase!=="party"||s.partyIds.includes(id)||!availableCharacterIds().includes(id))return false;s.supportId=id;return true;}
  function beginBriefing(s){if(s.partyIds.length!==E.rules.partySize||s.partyIds.includes(s.supportId)||!availableCharacterIds().includes(s.supportId))return false;s.phase="briefing";return true;}
  function beginExplore(s){if(!["party","briefing"].includes(s.phase)||s.partyIds.length!==E.rules.partySize)return false;s.phase="exploration";return true;}
  function selectLocation(s,id){if(s.phase!=="exploration"||currentInteraction(s)||s.investigationsLeft<=0||s.investigated.includes(id)||!E.investigations.some(x=>x.id===id))return false;s.selectedLocation=id;return true;}
  function leaveLocation(s){if(s.phase!=="exploration"||currentInteraction(s))return false;s.selectedLocation=null;return true;}
  function updatePartialUnlocks(s){if(!s.originTraceUnlocked&&E.facts.origin.partial.some(pair=>pair.every(id=>evidenceActive(s,id)))){s.originTraceUnlocked=true;narration(s,"서로 다른 제보에서 문장이 바뀐 시각이 한 점으로 겹친다.",{tone:"decision"});effect(s,"F3 추적 가능",{stat:"originTrace",tone:"progress"});}}
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
  function checkBlueScreen(s){if(s.minaLoad<E.rules.maxMinaLoad||s.minaOfflineRounds||s.pendingBlueScreen)return false;s.minaLoad=E.rules.maxMinaLoad;if(s.phase==="exploration"){s.pendingBlueScreen=true;narration(s,"미나의 오른쪽 홍채가 멈췄다가 느리게 다시 회전한다.",{tone:"danger"});effect(s,"미나 정지 예고 · 1라운드",{stat:"minaOffline",tone:"danger"});return true;}s.minaOfflineRounds=1;narration(s,"미나의 다이아몬드 홍채가 한 바퀴 돌다 멎고, 책상 위로 그대로 엎어진다.",{tone:"danger"});dialogue(s,E.dialogue.mina.offline,"제갈 미나",{tone:"danger"});effect(s,"블루스크린 · 1라운드",{stat:"minaOffline",tone:"danger"});return true;}
  function resolveInteraction(s,apply){
    if(s.phase!=="exploration")return false;const item=currentInteraction(s);if(!item)return false;s.pendingInteractions.shift();
    if(!apply){s.skippedInteractions.push(item.id);effect(s,`${item.title} 보류`,{stat:"interaction"});return true;}if(!interactionValid(s,item))return false;
    s.relationshipHistory.push(item.definitionId);
    if(item.category==="enhancement")item.evidenceIds.forEach(id=>s.evidence[id].enhancementInteractionUsed=item.id);else{s.interactionState.used.push(item.id);item.evidenceIds.forEach(id=>s.evidence[id].comparisonInteractions.push(item.id));}
    if(item.resolver==="protect-and-forecast"){const ev=s.evidence[item.evidenceIds[0]];ev.protected=true;s.forecastKnown=true;s.minaLoad++;dialogue(s,"원본 뺐어요. 오프라인이에요. 이제 선생님이 못 건드려요. …제 화면에도 이상한 짤 띄우지 마세요.","김우주",{accent:"kim-wooju"});narration(s,"우주의 화면에서 다음으로 흔들릴 기록 하나가 먼저 점멸한다. 미나의 오른쪽 홍채가 한 차례 빠르게 돈다.",{accent:"kim-wooju"});effect(s,`${E.evidenceInfo[ev.id].label} 보호`,{source:"kim-wooju",stat:"protected",tone:"guard"});effect(s,"다음 오류 예측",{source:"kim-wooju",stat:"forecast",tone:"progress"});effect(s,"미나 부하 +1",{source:"kim-wooju",stat:"minaLoad",delta:1,tone:"warning"});}
    else if(item.resolver==="declare-authority"){const ev=s.evidence[item.evidenceIds[0]];ev.authoritative=true;ev.authorityCharges=1;s.minaLoad++;dialogue(s,"승인된 기록입니다. 이 문서보다 앞설 안내는 없습니다.","마근아",{accent:"mageuna"});narration(s,"마근아가 직인 문서를 펼치자 단말기의 글자가 한 번 흔들리고 멎는다. 미나의 목소리 끝에 잡음이 얇게 낀다.",{accent:"mageuna"});effect(s,`${E.evidenceInfo[ev.id].label} 공식 기준점`,{source:"mageuna",stat:"authoritative",tone:"guard"});effect(s,"미나 부하 +1",{source:"mageuna",stat:"minaLoad",delta:1,tone:"warning"});}
    else{s.judgmentUnlocks[item.factId]=true;s.stability=clamp(s.stability-1);dialogue(s,"내 쪽은 17시 12분부터 다섯 명으로 바뀌었어. 네 도장 찍힌 종이는 몇 시인데?","강운심",{accent:"kang-unshim"});dialogue(s,"17시 11분 58초. 수정 이력 없음. 제보보다 2초 빠릅니다.","마근아",{accent:"mageuna"});narration(s,"두 시각이 맞부딪치자 서가의 그림자가 서로 다른 방향으로 갈라진다.",{tone:"danger"});effect(s,`${E.facts[item.factId].label} 판단 가능`,{stat:"judgmentUnlock",tone:"progress"});effect(s,"현실 안정도 -1",{stat:"stability",delta:-1,tone:"warning"});}
    checkBlueScreen(s);return true;
  }
  function applySecondary(s,choice){
    if(choice.secondary==="system-difference")s.systemInsight=true;
    if(choice.secondary==="reduce-route-risk")s.factEffects.routeRisk=Math.max(0,s.factEffects.routeRisk-1);
    if(choice.secondary==="cool-mina")s.minaLoad=Math.max(0,s.minaLoad-1);
  }
  function investigate(s,choiceId){if(s.phase!=="exploration"||currentInteraction(s)||!s.selectedLocation||s.investigationsLeft<=0)return false;const location=E.investigations.find(x=>x.id===s.selectedLocation),choice=location?.choices.find(x=>x.id===choiceId);if(!choice)return false;addEvidence(s,choice.evidence);applySecondary(s,choice);s.investigated.push(location.id);s.investigationsLeft--;s.selectedLocation=null;narration(s,`${location.label}에서 ${character(choice.owner).name}의 조사가 시작된다.`,{accent:choice.owner});dialogue(s,choice.quote,character(choice.owner).name,{accent:choice.owner});narration(s,choice.result,{accent:choice.owner});effect(s,`${E.evidenceInfo[choice.evidence].qualityLabel} 확보 · ${E.evidenceInfo[choice.evidence].label}`,{source:choice.owner,stat:"evidence"});queueEvidenceInteractions(s,choice.evidence);return true;}

  function effectSuppressed(s,factId){if(s.factEffectShield>0){s.factEffectShield--;narration(s,"화영이 뒤틀린 기록과 현장 사이에 몸을 밀어 넣는다.",{accent:"hwayoung",tone:"guard"});effect(s,`${E.facts[factId].label} 오염 반동 차단`,{stat:"factEffectShield",tone:"guard"});return true;}return s.suppressedFact===factId&&s.round<=s.suppressedUntilRound;}
  function strengthenFactEffect(s,factId,amount){
    if(effectSuppressed(s,factId))return;const rule=E.factEffectRules[factId],key=rule.stateKey;
    s.factEffects[key]+=amount;const scenes={studentCount:"출입 기록의 빈 칸에 낯선 이름이 번지고, 열람실 의자 하나가 더 끌려 나온다.",exitRoute:"북쪽 표지가 흐려지는 동안 서쪽 유도등이 한층 선명해진다.",origin:"미나의 목소리 끝에 노이즈가 겹치고 오른쪽 홍채가 더 빠르게 돈다."};narration(s,scenes[factId],{tone:"danger"});effect(s,`${E.facts[factId].label} 오염 심화 +${amount}`,{stat:key,tone:"danger"});
  }
  function corruptFact(s,factId,amount=1){const f=s.facts[factId];if(!f||f.reality==="locked")return false;f.corruptionLevel+=amount;f.bias+=amount;strengthenFactEffect(s,factId,amount);return true;}
  function judgeFact(s,factId,claim){
    if(!["exploration","battle"].includes(s.phase)||!canJudgeFact(s,factId)||!E.facts[factId].claims.some(x=>x.value===claim))return false;
    const f=s.facts[factId];f.playerClaim=claim;f.lastTouched=s.round;f.claimEvidenceCount=activeEvidenceCount(s,factId);f.recheckReady=false;
    if(claim===E.facts[factId].truth){f.knowledge="verified";const scenes={studentCount:"세 건의 서명과 대출대 앞의 세 그림자가 같은 자리에 포개진다.",exitRoute:"북쪽 문틈의 바람과 피난도의 선이 한 방향으로 이어진다.",origin:"미나의 첫 발언과 출입 표시가 바뀐 순간이 한 프레임에 맞물린다."};narration(s,scenes[factId],{tone:"decision"});effect(s,`${E.facts[factId].label} 검증됨 · ${claim}`,{stat:"verified",tone:"success"});}
    else{f.knowledge="misverified";s.misjudgments++;const scenes={studentCount:"화면 속 다섯 번째 이름에 빈 의자가 끌리는 소리가 겹친다.",exitRoute:"서쪽 문을 출구로 적는 순간 북쪽 유도등이 거의 보이지 않게 흐려진다.",origin:"검색 단말기에 원인을 돌리자 미나의 목소리가 짧게 두 번 겹친다."};narration(s,scenes[factId],{tone:"danger"});stabilityChange(s,-1,{source:factId});corruptFact(s,factId,1);if(factId==="origin")addMinaLoad(s,1,"오판");effect(s,`${E.facts[factId].label} 오판 · ${claim}`,{stat:"misverified",tone:"warning"});}
    if(s.conflictReveal>0)s.conflictReveal--;return true;
  }
  function deferJudgment(s,factId){if(!canJudgeFact(s,factId))return false;effect(s,`${E.facts[factId].label} 판단 보류`,{stat:"judgmentHold"});return true;}
  function compareEvidence(s,id){return canJudgeFact(s,id);}
  function buildOrder(s){s.order=aliveIds(s).sort((a,b)=>character(b).game.speed-character(a).game.speed);s.turn=0;s.acted=[];}
  function start(s){if(s.phase!=="exploration"||currentInteraction(s)||s.investigated.length!==E.rules.investigationLimit)return false;s.phase="battle";s.battlePhase="audit";s.round=1;s.patternStep=0;buildOrder(s);if(s.pendingBlueScreen){s.pendingBlueScreen=false;s.minaOfflineRounds=1;}narration(s,"세 조사 기록이 서로 다른 현재값을 주장한다. 결론은 기록이 아니라 대응자가 내려야 한다.",{tone:"transition"});return true;}

  function missingAnchors(s,factId=null){const ids=factId?[factId]:factIds();return ids.flatMap(id=>E.facts[id].anchors.filter(evidenceId=>!s.evidence[evidenceId]).map(evidenceId=>({factId:id,evidenceId})));}
  function canReinvestigate(s,factId){return s.phase==="battle"&&s.facts[factId].reality!=="locked"&&s.reinvestigations[factId]<E.rules.maxReinvestigationsPerFact&&(missingAnchors(s,factId).length>0||s.facts[factId].knowledge==="misverified");}
  function activeFactEffect(s,factId){return !(s.suppressedFact===factId&&s.round<=s.suppressedUntilRound);}
  function consumePhantom(s,factId){if(factId!=="studentCount"||!activeFactEffect(s,factId)||s.factEffects.phantomTargets<=0)return false;s.factEffects.phantomTargets--;narration(s,"아무도 없는 열람석에서 의자가 밀려나며 조사자의 발길을 붙든다.",{tone:"warning"});effect(s,`가짜 이용자 소모 · 잔여 ${s.factEffects.phantomTargets}`,{stat:"phantomTargets",delta:-1,tone:"warning"});return true;}
  function reinvestigateFact(s,factId,all=false,sourceId=currentId(s)){
    if(!canReinvestigate(s,factId))return false;s.pureRecoveryActions++;
    if(consumePhantom(s,factId))return true;
    s.reinvestigations[factId]++;
    if(factId==="exitRoute"&&activeFactEffect(s,factId)&&s.factEffects.routeRisk>0)stabilityChange(s,-1,{source:"routeRisk"});
    const missing=missingAnchors(s,factId),targets=all?missing:missing.slice(0,1);
    targets.forEach(item=>addEvidence(s,item.evidenceId,{recovered:true,protected:sourceId==="epi-minos"}));
    s.facts[factId].recheckReady=true;
    const scenes={studentCount:"대출대와 출입 단말기를 다시 오가며 서로 겹치지 않는 이름을 걷어낸다.",exitRoute:"북쪽과 서쪽 통로를 다시 밟고 문 너머의 바람과 반향을 확인한다.",origin:"미나의 첫 발언과 단말기 수정 시각을 다시 한 화면에 맞춘다."};narration(s,scenes[factId],{accent:sourceId});
    effect(s,targets.length?`${E.facts[factId].label} 자료 확보 · ${targets.map(x=>E.evidenceInfo[x.evidenceId].label).join(" · ")}`:`${E.facts[factId].label} 재판단 가능`,{stat:"evidence",tone:"success"});return true;
  }
  const recoveryRequirement=()=>1;
  function bestRecovery(s,predicate=()=>true){return missingAnchors(s).filter(x=>predicate(E.evidenceInfo[x.evidenceId],x)).sort((a,b)=>Number(s.facts[b.factId].knowledge==="verified")-Number(s.facts[a.factId].knowledge==="verified")||a.evidenceId.localeCompare(b.evidenceId))[0]||null;}
  function normalizeRecovery(){return false;}
  function activeAnchorsReady(s,factId){return E.facts[factId].anchors.every(id=>evidenceActive(s,id));}
  function authoritativeGuard(s,factId){return Object.values(s.evidence).find(ev=>ev.authoritative&&ev.authorityCharges>0&&E.evidenceInfo[ev.id].facts.includes(factId));}
  function stabilityChange(s,amount,meta={}){const before=s.stability;s.stability=clamp(s.stability+amount);const delta=s.stability-before;if(delta<0)narration(s,"서가 끝이 한 박자 늦게 따라 움직이고 바닥의 선이 어긋난다.",{tone:"danger"});else if(delta>0)narration(s,"흔들리던 서가 모서리와 바닥의 선이 다시 맞물린다.",{tone:"recover"});effect(s,`현실 안정도 ${delta>=0?"+":""}${delta} · ${s.stability}/${E.rules.maxStability}`,{stat:"stability",delta,tone:delta>=0?"recover":"danger",...meta});}
  function lowerLoad(s,amount,source){const before=s.minaLoad;s.minaLoad=Math.max(0,s.minaLoad-amount);const delta=s.minaLoad-before;if(delta)narration(s,"미나의 홍채 회전이 느려지고 목소리의 잡음이 옅어진다.",{tone:"recover"});effect(s,`미나 부하 ${delta} · ${s.minaLoad}/${E.rules.maxMinaLoad}`,{source,stat:"minaLoad",delta,tone:"recover"});}
  function addMinaLoad(s,amount,reason){if(s.originMitigation>0){const reduced=Math.min(amount,s.originMitigation);amount-=reduced;s.originMitigation-=reduced;}if(!amount)return;s.minaLoad+=amount;narration(s,"미나의 목소리 끝에 얇은 노이즈가 끼고 오른쪽 눈이 빠르게 회전한다.",{tone:"warning"});effect(s,`미나 부하 +${amount} · ${s.minaLoad}/${E.rules.maxMinaLoad}`,{stat:"minaLoad",delta:amount,tone:"warning"});checkBlueScreen(s);}
  function lockedCount(s){return s.lockOrder.length;}
  function clearFactEffect(s,factId){const rule=E.factEffectRules[factId];s.factEffects[rule.stateKey]=0;}
  function resolveLockConsequence(s,factId,first){
    const rule=E.lockConsequences[factId];clearFactEffect(s,factId);
    if(rule.cost==="raise-route-risk"&&s.facts.exitRoute.reality!=="locked")s.factEffects.routeRisk++;
    if(rule.cost==="raise-origin-pressure"&&s.facts.origin.reality!=="locked"){s.factEffects.correctionBacklash++;addMinaLoad(s,1,"안전 동선 우선 고정");}
    if(rule.benefit==="mitigate-late-patterns"){s.patternMitigation=1;if(first)addMinaLoad(s,rule.costValue,"최초 오염 우선 고정");}
    const scenes={studentCount:"빈 의자 둘이 사라지는 대신 서쪽 서가가 통로 쪽으로 한 칸 밀려난다.",exitRoute:"북쪽 문이 제자리를 찾자 미나의 화면에 정정 요청이 연달아 떠오른다.",origin:"최초 발언이 기록에 박히자 미나가 책상을 짚고 숨을 고른다."};narration(s,scenes[factId],{tone:"warning"});effect(s,`${E.facts[factId].label} 고정 여파`,{stat:"lockConsequence",source:factId,tone:"warning"});
  }
  function lockFact(s,factId){
    const f=s.facts[factId],validClaim=f?.playerClaim===E.facts[factId]?.truth;
    if(!f||f.reality==="locked"||f.knowledge!=="verified"||!validClaim||!activeAnchorsReady(s,factId)||s.minaOfflineRounds)return false;
    const first=s.lockOrder.length===0,originBacklash=factId==="origin"&&s.factEffects.correctionBacklash>0;f.reality="locked";f.current=E.facts[factId].truth;f.corruptionLevel=0;f.bias=0;f.lastTouched=s.round;s.lockOrder.push(factId);
    if(originBacklash)addMinaLoad(s,E.factEffectRules.origin.lockLoad,"원인 정정 반동");
    resolveLockConsequence(s,factId,first);
    if(first){s.battlePhase="collapse";s.patternStep=0;narration(s,"한 문장이 원본에 박히자 남은 두 기록의 글자가 동시에 짙어진다. 서가 양쪽에서 서로 다른 안내 방송이 흘러나온다.",{tone:"danger"});effect(s,"후반 붕괴 시작",{stat:"battlePhase",tone:"warning"});}
    dialogue(s,s.lockOrder.length===3?"세 건 일치. 정정 완료. …이번 문장은 정말 맞습니다.":"확정된 정보로 덮어쓰겠습니다. 이번에는… 틀리지 않았습니다.","제갈 미나",{tone:"success"});
    effect(s,`${E.facts[factId].label} 고정됨 · ${E.facts[factId].truth}`,{stat:"locked",source:factId,tone:"success"});
    if(s.lockOrder.length===3){s.phase="success";narration(s,"출입 표시와 피난 유도등, 검색 기록이 더는 흔들리지 않는다. 북쪽 문 너머로 실제 계단의 바람이 들어온다.",{tone:"success"});}return true;
  }

  const action=(id,label,description,disabled=false)=>({id,label,description,disabled});
  function canPay(m,cost={}){return Object.entries(cost).every(([key,value])=>(m[key]||0)>=value);}
  function lockReason(s,factId){const f=s.facts[factId];if(f.knowledge!=="verified"||f.playerClaim!==E.facts[factId].truth)return"확인된 판단이 필요하다.";if(!activeAnchorsReady(s,factId))return"고정 자료 두 건이 필요하다.";if(s.minaOfflineRounds)return"미나의 응답을 기다려야 한다.";return"확인한 사실을 원본 기록에 고정한다.";}
  function actions(s){
    if(s.phase!=="battle"||!currentId(s))return[];const id=currentId(s),m=member(s,id),result=[];
    for(const factId of factIds())if(canReinvestigate(s,factId))result.push(action(`reinvestigate:${factId}`,`${E.facts[factId].label} 재조사`,`빠진 고정 자료 하나를 다시 확인한다. · ${s.reinvestigations[factId]}/${E.rules.maxReinvestigationsPerFact}`));
    for(const factId of factIds())if(canJudgeFact(s,factId)){for(const [index,claim] of claimOptions(s,factId).entries())result.push(action(`claim:${factId}:${index}`,claim.label,"서로 다른 관측 중 믿을 쪽을 기록한다."));result.push(action(`defer:${factId}`,"판단 보류","현재 관측과 증거를 유지한다."));}
    for(const factId of factIds())if(s.facts[factId].reality!=="locked"){const reason=lockReason(s,factId);result.push(action(`lock:${factId}`,`현실 고정 · ${E.facts[factId].label}`,reason,reason!=="확인한 사실을 원본 기록에 고정한다."));}
    if(s.originTraceUnlocked&&!s.judgmentUnlocks.origin)result.push(action("trace-origin","원인 추적","발언과 검색 기록의 앞뒤를 다시 확인한다."));
    result.push(action("contain","현상 억제","현실 안정도 +1."));
    for(const ability of E.abilities[id]||[]){let label=ability.label;if(id==="hwayoung")label+=` · 열량 ${m.heat}`;if(id==="kang-unshim")label+=` · 정보 ${m.info}`;if(id==="epi-minos")label+=` · 보존 ${m.memory}`;if(id==="mageuna")label+=` · 집행 ${m.rules}회`;if(id==="josangmin")label+=` · 비축 ${m.effort}`;const disabled=!canPay(m,ability.cost)||ability.cooldown&&m[ability.cooldown]>0||ability.ruleCost&&m.rules<ability.ruleCost||ability.hpCost&&m.hp<ability.hpCost||ability.id==="rule"&&s.rewriteBlock;result.push(action(ability.id,label,ability.description,disabled));}
    return result;
  }
  function mostDangerousFact(s){return factIds().filter(id=>s.facts[id].reality!=="locked").sort((a,b)=>Number(s.facts[b].knowledge==="misverified")-Number(s.facts[a].knowledge==="misverified")||s.facts[b].bias-s.facts[a].bias||s.facts[a].lastTouched-s.facts[b].lastTouched||factIds().indexOf(a)-factIds().indexOf(b))[0];}
  function resolveAbility(s,m,a,id){
    if(a.verb==="absorbThreat"){s.factEffectShield++;m.heat++;effect(s,"오염 반동 방호 1회 · 열량 +1",{source:id,stat:"factEffectShield",tone:"guard"});}
    if(a.verb==="gatherIntel"){m.info++;s.conflictReveal++;effect(s,"충돌 관측 +1 · 정보 +1",{source:id,stat:"conflictReveal"});}
    if(a.verb==="snapshotState"){const lost=Object.values(s.evidence).find(ev=>!evidenceActive(s,ev.id));if(lost){lost.disabledUntilRound=0;m.memory++;narration(s,"카오가 삼킨 장면에서 지워졌던 기록 한 장이 다시 펼쳐진다.",{accent:id});effect(s,`${E.evidenceInfo[lost.id].label} 복원`,{source:id,stat:"sourceLoss",tone:"recover"});}else{s.sourceSnapshot=true;effect(s,"출처 보존 1회",{source:id,stat:"sourceSnapshot",tone:"guard"});}}
    if(a.verb==="stabilizeField"){lowerLoad(s,2,id);s.originMitigation++;m.cool=2;}
    if(a.verb==="analyze"){s.systemInsight=true;s.forecastKnown=true;m.cool=2;narration(s,"우주의 화면에서 원본과 현재값이 갈라지고, 다음으로 흔들릴 행이 먼저 점멸한다.",{accent:id});effect(s,"원본 차이 확인 · 다음 오류 예측",{source:id,stat:"forecast",tone:"progress"});}
    if(a.verb==="declareRule"){m.rules--;s.rewriteBlock=true;effect(s,`재작성 차단 · 집행 ${m.rules}회`,{source:id,stat:"rewriteBlock",tone:"guard"});}
    if(a.verb==="purify"){const target=mostDangerousFact(s);s.suppressedFact=target;s.suppressedUntilRound=s.round+1;m.hp=Math.max(0,m.hp-a.hpCost);m.cool=2;narration(s,"가브리엘의 손들이 기록 위에 덧붙은 글자만 얇게 벗겨낸다. 변아리의 장갑 안쪽이 붉게 젖는다.",{accent:id,tone:"damage"});effect(s,`${E.facts[target].label} 오염 억제 · 변아리 HP -${a.hpCost}`,{source:id,stat:"suppressedFact",tone:"guard"});}
    if(a.verb==="conserveAction"){m.effort++;effect(s,`비축 +1 · ${m.effort}`,{source:id,stat:"effort",delta:1});}
    if(a.verb==="decisiveIntervention"){const target=factIds().filter(fid=>canReinvestigate(s,fid)).sort((a,b)=>missingAnchors(s,b).length-missingAnchors(s,a).length||factIds().indexOf(a)-factIds().indexOf(b))[0];if(target)reinvestigateFact(s,target,true,id);else stabilityChange(s,1,{source:id});}
  }
  function payAbility(m,a){if(a.cost)Object.entries(a.cost).forEach(([key,value])=>m[key]-=value);}
  function fail(s,reason){s.phase="failure";s.failureReason=reason;narration(s,reason,{tone:"danger"});effect(s,"대응 실패",{stat:"failure",tone:"danger"});}
  function checkFailure(s){if(s.stability<=0){fail(s,"현실 안정도가 소진되어 도서관의 원본 기준을 유지하지 못했다.");return true;}if(aliveIds(s).length===0){fail(s,"출전 인원이 모두 전투 불능이 되어 도서관에서 철수했다.");return true;}return false;}
  const schedule=s=>s.battlePhase==="collapse"?E.patternScheduleLate:E.patternScheduleEarly;
  function resolveRewriteTarget(s,target){if(s.facts[target]?.reality!=="locked")return target;const start=factIds().indexOf(target);for(let i=1;i<=factIds().length;i++){const id=factIds()[(start+i)%factIds().length];if(s.facts[id].reality!=="locked")return id;}return null;}
  function patternAt(s,offset=0){const list=schedule(s),entry=list[(s.patternStep+offset)%list.length],pattern={...E.patterns.find(x=>x.id===entry.pattern),...entry};if(pattern.pattern==="rewrite"||pattern.id==="rewrite")pattern.fact=resolveRewriteTarget(s,pattern.fact);return pattern;}
  const currentPattern=s=>patternAt(s,0),nextPattern=s=>patternAt(s,1);
  function patternForecast(s){const pattern=nextPattern(s);return{known:s.forecastKnown,pattern:pattern.id,label:pattern.label,target:s.forecastKnown?(pattern.fact||pattern.kind||null):null};}
  function applyPattern(s){
    const p=currentPattern(s);if(s.patternBlock){s.patternBlock=false;narration(s,"후방에서 붙든 기준선 앞에서 흔들리던 글자가 원래 자리로 되튄다.",{tone:"guard"});effect(s,`${p.label} 차단`,{stat:"patternBlock",tone:"guard"});return;}const tier=stabilityRule(s.stability),lateBonus=s.battlePhase==="collapse"?1:0,strength=Math.max(1,1+tier.corruptionBoost+lateBonus-s.patternMitigation);
    if(p.id==="rewrite"){if(!p.fact){effect(s,"재작성 대상 없음",{stat:"rewrite",tone:"guard"});return;}if(s.minaOfflineRounds){effect(s,"재작성 정지",{stat:"rewrite",tone:"guard"});return;}if(s.rewriteBlock){s.rewriteBlock=false;narration(s,"마근아의 직인 위에서 번지던 글자가 붉은 선에 막혀 멎는다.",{accent:"mageuna",tone:"guard"});effect(s,`${E.facts[p.fact].label} 재작성 차단`,{source:"mageuna",stat:"rewriteBlock",tone:"guard"});return;}const guard=authoritativeGuard(s,p.fact);if(guard){guard.authorityCharges--;narration(s,"단말기의 새 문장이 직인 문서와 맞닿자 흔적도 없이 지워진다.",{accent:"mageuna",tone:"guard"});effect(s,`${E.evidenceInfo[guard.id].label} 재작성 거부`,{source:"mageuna",stat:"authoritative",tone:"guard"});return;}corruptFact(s,p.fact,strength);s.patternPressure+=strength;stabilityChange(s,-1);if(tier.rewriteLoad)addMinaLoad(s,tier.rewriteLoad,"불안정 반동");}
    else if(p.id==="source-loss"){let count=Math.max(1,(s.battlePhase==="collapse"?2:1)-s.patternMitigation);if(s.sourceSnapshot){count=Math.max(0,count-1);s.sourceSnapshot=false;}const candidates=Object.values(s.evidence).filter(ev=>evidenceActive(s,ev.id)&&!ev.protected&&E.evidenceInfo[ev.id].kind===p.kind&&!factIds().some(fid=>s.facts[fid].reality==="locked"&&E.facts[fid].anchors.includes(ev.id))).slice(0,count);if(!candidates.length){effect(s,"출처 소실 대상 없음",{stat:"sourceLoss",tone:"guard"});return;}candidates.forEach(ev=>{ev.disabledUntilRound=s.round+1;narration(s,`${E.evidenceInfo[ev.id].label}의 출처란이 희게 지워지고 원문이 흐려진다.`,{tone:"warning"});effect(s,`${E.evidenceInfo[ev.id].label} 출처 소실 · 1라운드`,{stat:"sourceLoss",source:ev.id,tone:"warning"});});}
    else{const target=mostDangerousFact(s);if(!target)return;corruptFact(s,target,strength);s.patternPressure+=strength;stabilityChange(s,-1);}
  }
  function endRound(s){const wasOffline=s.minaOfflineRounds>0;applyPattern(s);s.partyIds.forEach(id=>{if(member(s,id).cool>0)member(s,id).cool--;});if(wasOffline&&s.minaOfflineRounds>0){s.minaOfflineRounds--;if(!s.minaOfflineRounds){s.minaLoad=Math.min(3,s.minaLoad);narration(s,"멎었던 다이아몬드 홍채가 느리게 회전하고 미나가 책상에서 고개를 든다.",{tone:"recover"});effect(s,`미나 복귀 · 부하 ${s.minaLoad}/${E.rules.maxMinaLoad}`,{stat:"minaLoad",tone:"recover"});}}if(checkFailure(s)||s.phase!=="battle")return;s.patternStep++;s.round++;buildOrder(s);}
  function advanceTurn(s,actorId){s.acted.push(actorId);if(checkFailure(s)||s.phase!=="battle")return;const remaining=s.order.filter(id=>member(s,id).hp>0&&!s.acted.includes(id));if(remaining.length){s.turn=s.order.indexOf(remaining[0]);return;}endRound(s);}
  function act(s,id){
    if(s.phase!=="battle")return false;const actorId=currentId(s),m=member(s,actorId),available=actions(s).find(x=>x.id===id&&!x.disabled);if(!actorId||m.hp<=0||!available)return false;s.lastActionId=id;s.lastActionActorId=actorId;s.stageActions++;
    if(id.startsWith("reinvestigate:"))reinvestigateFact(s,id.slice(14),false,actorId);
    else if(id.startsWith("claim:")){const [,factId,index]=id.split(":");judgeFact(s,factId,E.facts[factId].claims[Number(index)].value);}
    else if(id.startsWith("defer:"))deferJudgment(s,id.slice(6));
    else if(id.startsWith("lock:"))lockFact(s,id.slice(5));
    else if(id==="trace-origin"){s.judgmentUnlocks.origin=true;s.facts.origin.recheckReady=true;narration(s,"공유 캡처의 시각을 거슬러 올라가자 미나의 첫 발언이 검색 수정 기록보다 앞에 놓인다.",{tone:"decision"});effect(s,"F3 판단 가능",{stat:"judgmentUnlock",tone:"progress"});}
    else if(id==="contain"){narration(s,"임시 기준선이 충돌하는 관측 사이를 붙든다.",{accent:actorId});stabilityChange(s,1,{source:actorId});}
    else{const a=(E.abilities[actorId]||[]).find(x=>x.id===id);if(!a)return false;const scenes={hwayoung:"화영이 흔들리는 서가 앞에 서서 어깨를 낮춘다.","kang-unshim":"운심의 화면에 흩어진 제보 캡처가 시각순으로 빠르게 늘어선다.","epi-minos":"카오가 부리를 벌리자 지워지기 직전의 장면이 검은 깃 사이에서 펼쳐진다.",inan:"이난이 미나의 손목을 잡고 목덜미에 차가운 손을 댄다.","kim-wooju":"우주의 드론이 단말기 위에 떠서 두 겹의 화면을 갈라낸다.",mageuna:"마근아가 사건 기록지 위에 직인을 곧게 내려놓는다.","byeon-ari":"가브리엘의 수많은 손이 서가와 기록 사이에 위생선을 긋는다.",josangmin:"상민이 누락된 칸 하나만 가리키고 나머지 기록을 밀어낸다."};narration(s,scenes[actorId],{accent:actorId,tone:"ability"});dialogue(s,a.quote,character(actorId).name,{accent:actorId});payAbility(m,a);resolveAbility(s,m,a,actorId);}
    if(checkFailure(s)||s.phase!=="battle")return true;advanceTurn(s,actorId);return true;
  }
  function supportStatus(s){const id=s.supportId,a=E.supportAdapters[id],m=member(s,id);if(s.phase!=="battle")return{available:false,reason:"해결 구간이 아니다."};if(s.supportUses<=0)return{available:false,reason:"사건 전체 지원 횟수를 소진했다."};if(s.supportUsedRound===s.round)return{available:false,reason:"이번 라운드에는 이미 지원을 요청했다."};if(a.ruleCost&&m.rules<a.ruleCost)return{available:false,reason:"남은 집행 횟수가 없다."};return{available:true,reason:"사용 가능"};}
  function useSupport(s){const status=supportStatus(s);if(!status.available)return false;const id=s.supportId,a=E.supportAdapters[id],m=member(s,id);s.supportUses--;s.supportUsedRound=s.round;narration(s,`${character(id).name}의 후방 회선이 도서관 사건 기록표에 연결된다.`,{accent:id,tone:"support"});if(a.verb==="blockRisk")s.patternBlock=true;if(a.verb==="gatherIntel")s.conflictReveal++;if(a.verb==="restoreState")Object.values(s.evidence).forEach(ev=>ev.disabledUntilRound=0);if(a.verb==="stabilizeField")lowerLoad(s,1,id);if(a.verb==="improveEfficiency"){const ev=Object.values(s.evidence).find(x=>!x.protected);if(ev)ev.protected=true;else s.forecastKnown=true;}if(a.verb==="declareRule"){m.rules-=a.ruleCost;s.rewriteBlock=true;}if(a.verb==="createSafeZone"){s.suppressedFact=mostDangerousFact(s);s.suppressedUntilRound=s.round+1;}if(a.verb==="amplifyNextAction"){const target=factIds().find(fid=>canReinvestigate(s,fid));if(target)reinvestigateFact(s,target,true,id);}checkFailure(s);return true;}
  function minaReaction(s){if(s.minaOfflineRounds||s.pendingBlueScreen)return E.dialogue.mina.offline;if(s.minaLoad<=1)return E.dialogue.mina.low;if(s.minaLoad<=3)return E.dialogue.mina.middle;return E.dialogue.mina.high;}
  function resultSummary(s){return`세 번째 사건 해결 · 고정 순서 ${s.lockOrder.map(id=>E.facts[id].label.slice(0,2)).join("→")} · 오판 ${s.misjudgments}회 · 현실 안정도 ${s.stability}/${E.rules.maxStability} · 미나 부하 ${s.minaLoad}/${E.rules.maxMinaLoad} · 관계 ${s.relationshipHistory.join(",")||"없음"}`;}
  function takePresentation(s){const queued=s.presentation.slice();s.presentation.length=0;return queued;}
  return{create,availableCharacterIds,toggle,support,beginBriefing,beginExplore,selectLocation,leaveLocation,investigate,currentInteraction,resolveInteraction,compareEvidence,judgeFact,deferJudgment,claimOptions,canJudgeFact,factConflict,start,actions,act,useSupport,supportStatus,currentPattern,nextPattern,patternForecast,stabilityRule,factStatus,canVerify,evidenceActive,recoveryRequirement,missingAnchors,bestRecovery,normalizeRecovery,canReinvestigate,lockedCount,minaReaction,resultSummary,takePresentation,character,event:E,_applyPattern:applyPattern,_checkBlueScreen:checkBlueScreen,_reinvestigateFact:reinvestigateFact};
})();
