"use strict";

window.CafeteriaEngine = (() => {
  const E=SEONGA_CAFETERIA_EVENT,C=SEONGA_CHARACTERS;
  const character=id=>C.find(x=>x.id===id),member=(s,id)=>s.members[id];
  const availableCharacterIds=()=>window.CampaignProgress?CampaignProgress.availableCharacterIds(E.id,E.characterPool):[...E.characterPool];
  const subject=name=>{const code=name.charCodeAt(name.length-1)-0xac00;return`${name}${code>=0&&code<=11171&&code%28!==0?"이":"가"}`;};
  function present(s,type,text,meta={}){const item={type,text,message:text,...meta};s.log.push(item);s.presentation.push(item);return item;}
  const dialogue=(s,text,speaker,meta={})=>present(s,"dialogue",text,{speaker,...meta});
  const narration=(s,text,meta={})=>present(s,"narration",text,meta);
  const effect=(s,text,meta={})=>present(s,"effect",text,meta);
  const aliveIds=s=>s.partyIds.filter(id=>member(s,id).hp>0);
  const currentId=s=>s.order[s.turn];
  const clampSpread=s=>{s.spread=Math.max(0,s.spread);};

  function create(){
    const members={};
    C.forEach(x=>members[x.id]={hp:x.game.hp,heat:0,info:0,memory:0,cool:0,effort:0,rules:SEONGA_NEUTRAL_KITS[x.id]?.limit||0});
    const pool=availableCharacterIds(),supportId=pool.includes("byeon-ari")?"byeon-ari":pool.find(id=>!["hwayoung","kang-unshim","inan","kim-wooju"].includes(id))||"epi-minos";
    return{
      phase:"party",partyIds:["hwayoung","kang-unshim","inan","kim-wooju"],supportId,members,
      clues:[],investigated:[],selectedLocation:null,investigationsLeft:E.rules.investigationLimit,unlocks:{suppliesPriority:false},
      stage:0,progress:0,secondary:0,priority:null,spread:3,time:0,round:1,order:[],turn:0,acted:[],
      supportUses:E.rules.supportCharges,supportUsed:false,blockEffect:null,traceUsed:false,prediction:false,predictedChain:null,safeSeal:0,reserveBoost:0,
      routes:E.routes.map(x=>({...x,currentRisk:x.risk,prepared:false,sealed:false})),routeOrder:[],
      outcomes:{staff:"unresolved",supplies:"unresolved"},stageActions:[0,0,0],lastActionId:null,lastActionActorId:null,repeatCount:0,actionMemory:{},actionContext:null,failureReason:"",log:[],presentation:[]
    };
  }

  function toggle(s,id){
    const pool=availableCharacterIds();if(!pool.includes(id)||s.phase!=="party")return false;
    const index=s.partyIds.indexOf(id);
    if(index>=0){if(s.partyIds.length<=1)return false;s.partyIds.splice(index,1);}
    else if(s.partyIds.length<E.rules.partySize){s.partyIds.push(id);}
    else return false;
    if(s.partyIds.includes(s.supportId)){const replacement=pool.find(x=>!s.partyIds.includes(x));if(replacement)s.supportId=replacement;}
    return true;
  }
  function support(s,id){if(s.phase!=="party"||s.partyIds.includes(id)||!availableCharacterIds().includes(id))return false;s.supportId=id;return true;}
  function beginBriefing(s){if(s.partyIds.length!==E.rules.partySize||s.partyIds.includes(s.supportId)||!availableCharacterIds().includes(s.supportId))return false;s.phase="briefing";return true;}
  function beginExplore(s){if(!["party","briefing"].includes(s.phase)||s.partyIds.length!==E.rules.partySize)return false;s.phase="exploration";return true;}
  function selectLocation(s,id){if(s.phase!=="exploration"||s.investigationsLeft<=0||s.investigated.includes(id)||!E.investigations.some(x=>x.id===id))return false;s.selectedLocation=id;return true;}
  function leaveLocation(s){if(s.phase!=="exploration")return false;s.selectedLocation=null;return true;}
  function investigate(s,choiceId){
    if(s.phase!=="exploration"||!s.selectedLocation||s.investigationsLeft<=0)return false;
    const location=E.investigations.find(x=>x.id===s.selectedLocation),choice=location?.choices.find(x=>x.id===choiceId);
    if(!choice)return false;
    s.clues.push(choice.clue);s.investigated.push(location.id);s.investigationsLeft--;s.selectedLocation=null;if(choice.unlocksPriority)s.unlocks[`${choice.unlocksPriority}Priority`]=true;
    narration(s,`${location.label}에서 ${character(choice.owner).name}의 조사가 시작된다.`,{accent:choice.owner});dialogue(s,choice.quote,character(choice.owner).name,{accent:choice.owner});narration(s,choice.result,{accent:choice.owner});effect(s,`단서 확보 · ${E.clueInfo[choice.clue].label}`,{source:choice.owner,stat:"clue"});
    return true;
  }

  function buildOrder(s){s.order=aliveIds(s).sort((a,b)=>character(b).game.speed-character(a).game.speed);s.turn=0;s.acted=[];}
  function stageTime(s,index){if(index===1&&s.priority)return E.priorities[s.priority].time+(s.clues.includes("timing")?1:0);return E.stages[index].time+(s.clues.includes("timing")?1:0);}
  function beginStage(s,index){
    s.stage=index;s.progress=0;s.secondary=0;s.round=1;s.supportUsed=false;s.blockEffect=null;s.traceUsed=false;s.prediction=false;s.predictedChain=null;s.safeSeal=index===2&&s.clues.includes("vents")?1:0;s.lastActionId=null;s.lastActionActorId=null;s.repeatCount=0;s.actionMemory={};s.actionContext=null;
    if(index===0){s.spread=4-(s.clues.includes("flow")?1:0);if(s.clues.includes("current"))s.progress=1;}
    else{s.spread=Math.max(3,s.spread);}
    if(index===2){
      s.routes=E.routes.map(x=>({...x,currentRisk:x.risk,prepared:false,sealed:false}));s.routeOrder=[];
      if(s.priority==="staff"&&s.outcomes.supplies!=="preserved")s.routes.find(x=>x.id==="cart").currentRisk+=2;
      if(s.priority==="supplies")s.routes.forEach(x=>x.currentRisk=Math.max(0,x.currentRisk-1));
      if(s.clues.includes("access"))s.routes.find(x=>x.id==="drain").prepared=true;
    }
    s.time=stageTime(s,index);buildOrder(s);s.phase="battle";narration(s,E.stages[index].intro,{tone:"transition"});
  }
  function start(s){if(s.phase!=="exploration"||s.investigated.length!==E.rules.investigationLimit)return false;beginStage(s,0);return true;}
  function nextStage(s){if(s.phase!=="interlude"||s.stage>=E.stages.length-1)return false;beginStage(s,s.stage+1);return true;}

  function pattern(s){const openingOffset=s.stage===0?1:0;return E.patterns[(s.round-1+openingOffset)%E.patterns.length];}
  function adjustedAmount(s,amount,type){
    let result=amount;const context=s.actionContext;
    if(context?.repeat>=3&&((type==="progress"&&["progress","hybrid"].includes(context.category))||(type==="pressure"&&["pressure","hybrid"].includes(context.category))))result--;
    if(type==="pressure"&&context&&pattern(s).id==="coagulation"&&["pressure","hybrid"].includes(context.category))result--;
    return Math.max(0,result);
  }
  function lowerSpread(s,amount){const before=s.spread,actual=adjustedAmount(s,amount,"pressure");s.spread=Math.max(0,s.spread-actual);if(actual)narration(s,"바닥 틈을 메우던 검은 거품이 위생선 안쪽으로 밀려나며 얇아진다.",{tone:"recover"});else narration(s,"검은 막이 방금 닫은 틈의 모양을 흉내 내며 그대로 버틴다.",{tone:"warning"});effect(s,actual?`확산도 -${actual} · ${s.spread}`:"확산 억제 무효",{source:s.actionContext?.actorId,stat:"spread",delta:-actual,tone:actual?"recover":"warning"});}
  function addProgress(s,amount=1){
    const max=s.stage===1&&s.priority?E.priorities[s.priority].primaryNeeded:E.stages[s.stage].needed;
    const adjusted=adjustedAmount(s,amount,"progress"),boost=s.reserveBoost>0?1:0;if(boost){s.reserveBoost--;effect(s,"비축 개입 사용",{source:"josangmin",stat:"reserveBoost",delta:-1});}
    s.progress=Math.min(max,s.progress+adjusted+boost);effect(s,adjusted+boost?`${objectiveInfo(s).primaryLabel} ${s.progress}/${max}`:"주 목표 진전 없음",{source:s.actionContext?.actorId,stat:"progress",delta:adjusted+boost,tone:adjusted+boost?"progress":"warning"});
  }
  function addSecondary(s,amount=1){const p=E.priorities[s.priority],adjusted=adjustedAmount(s,amount,"progress");s.secondary=Math.min(p.secondaryNeeded,s.secondary+adjusted);effect(s,adjusted?`${p.secondaryLabel} ${s.secondary}/${p.secondaryNeeded}`:"보조 목표 진전 없음",{source:s.actionContext?.actorId,stat:"secondary",delta:adjusted,tone:adjusted?"progress":"warning"});}
  function objectiveInfo(s){
    if(s.stage===0)return{primaryLabel:"오염 경로 분류",primaryNeeded:E.stages[0].needed};
    if(s.stage===1&&s.priority)return E.priorities[s.priority];
    if(s.stage===2)return{primaryLabel:"봉쇄 완료",primaryNeeded:E.stages[2].needed};
    return{primaryLabel:"우선순위 결정",primaryNeeded:0};
  }
  function stageComplete(s){
    if(s.stage===0)return s.progress>=E.stages[0].needed;
    if(s.stage===1){if(!s.priority)return false;const p=E.priorities[s.priority];return s.progress>=p.primaryNeeded&&(!p.secondaryRequired||s.secondary>=p.secondaryNeeded);}
    return s.routes.every(x=>x.sealed);
  }
  function captureOutcomes(s){
    if(s.stage!==1)return;
    s.outcomes.staff="safe";
    if(s.priority==="supplies")s.outcomes.supplies="preserved";
    else s.outcomes.supplies=s.secondary>=E.priorities.staff.secondaryNeeded?"preserved":"contaminated";
  }
  function finishStage(s){
    if(!stageComplete(s))return false;
    if(s.stage===1)captureOutcomes(s);
    if(s.stage===2){s.phase="success";narration(s,"세 경로의 압력 이동이 멎고 급식동 봉쇄선이 닫혔다.",{tone:"success"});return true;}
    s.phase="interlude";narration(s,s.stage===0?"배수구에서 솟던 거품 줄기가 가늘어지고, 복도와 창고로 갈라진 흔적이 드러난다.":"조리원과 식자재의 이동이 끝나자 남은 거품이 세 경로로 몰린다.",{tone:"transition"});return true;
  }
  function fail(s,reason){s.phase="failure";s.failureReason=reason;narration(s,reason,{tone:"danger"});effect(s,"대응 실패",{stat:"failure",tone:"danger"});}
  function checkFailure(s){
    if(aliveIds(s).length===0){fail(s,"출전 인원이 모두 전투 불능이 되어 급식동에서 철수했다.");return true;}
    if(s.time<=0){fail(s,"대응 시간이 소진되어 봉쇄선을 포기하고 철수했다.");return true;}
    if(s.spread>=E.rules.failureSpread){fail(s,"확산도가 통제 한계에 도달해 급식동에서 철수했다.");return true;}
    return false;
  }
  function setBlock(s,sourceId,type,label){s.blockEffect={sourceId,type,label};effect(s,`${label} · 반동 차단 대기`,{source:sourceId,stat:"block",tone:"guard"});}
  function endRound(s){
    s.time--;
    if(s.blockEffect){const blocked=s.blockEffect;s.blockEffect=null;narration(s,`${blocked.label} 앞에서 검은 거품의 파도가 갈라져 배수구 쪽으로 되밀린다.`,{accent:blocked.sourceId});effect(s,"확산·침식 반동 차단",{source:blocked.sourceId,stat:"block",tone:"guard"});}
    else{
      s.spread++;
      narration(s,"봉쇄되지 않은 거품이 바닥 틈을 타고 복도 쪽으로 한 줄 더 번진다.",{tone:"danger"});effect(s,`확산도 +1 · ${s.spread}`,{stat:"spread",delta:1,tone:"danger"});
      if(s.spread>=6){const exposed=aliveIds(s);exposed.forEach(id=>member(s,id).hp=Math.max(0,member(s,id).hp-1));narration(s,"검은 거품이 바닥에서 일제히 튀어 올라 출전 인원의 팔다리를 후려친다.",{tone:"damage"});effect(s,"출전 인원 HP -1",{stat:"hp",delta:-1,tone:"damage"});exposed.filter(id=>member(s,id).hp===0).forEach(id=>effect(s,`${subject(character(id).name)} 전투 불능`,{source:id,stat:"incapacitated",tone:"danger"}));}
    }
    s.partyIds.forEach(id=>{if(member(s,id).cool>0)member(s,id).cool--;});s.round++;
    if(!checkFailure(s))buildOrder(s);
  }
  function advanceTurn(s,actorId){
    s.acted.push(actorId);
    if(checkFailure(s)||s.phase!=="battle")return;
    const remaining=s.order.filter(id=>member(s,id).hp>0&&!s.acted.includes(id));
    if(remaining.length){s.turn=s.order.indexOf(remaining[0]);return;}
    endRound(s);
  }

  const action=(id,label,description,disabled=false)=>({id,label,description,disabled});
  function canPay(m,cost={}){return Object.entries(cost).every(([key,value])=>(m[key]||0)>=value);}
  function abilityDisabled(s,m,ability){
    if(ability.stages&&!ability.stages.includes(s.stage))return true;
    if(!canPay(m,ability.cost))return true;
    if(ability.cooldown&&m[ability.cooldown]>0)return true;
    if(ability.once&&s[ability.once])return true;
    if(ability.ruleCost&&m.rules<ability.ruleCost)return true;
    if(ability.hpCost&&m.hp<ability.hpCost)return true;
    if((ability.verb==="blockRisk"||ability.verb==="declareRule"||ability.mode==="block")&&s.blockEffect)return true;
    if(s.stage===2&&(["swingSituation","restoreState","analyze"].includes(ability.verb)||(ability.verb==="decisiveIntervention"&&ability.mode==="progress")))return true;
    return false;
  }
  function actions(s){
    if(s.phase!=="battle"||!currentId(s))return[];
    const id=currentId(s),m=member(s,id),result=[];
    if(s.stage===1&&!s.priority){
      result.push(action("priority-staff",E.priorities.staff.label,E.priorities.staff.description));
      const suppliesOpen=priorityAvailable(s,"supplies");
      result.push(action("priority-supplies",E.priorities.supplies.label,E.priorities.supplies.description,!suppliesOpen));
      return result;
    }
    if(s.stage===0)result.push(action("progress-primary","경로 표식 확정","주 목표 +1, 확산 +1."));
    if(s.stage===1){
      const p=E.priorities[s.priority];
      result.push(action("progress-primary",p.primaryLabel,s.priority==="staff"?"대피 +1, 확산 +1.":"격리 +1. 확산은 오르지 않는다.",s.progress>=p.primaryNeeded));
      result.push(action("progress-secondary",p.secondaryLabel,s.priority==="staff"?"응급 격리 +1. 확산은 오르지 않지만 대피가 한 행동 늦어진다.":"대피 +1, 확산 +1. 완료에 필수다.",s.secondary>=p.secondaryNeeded));
    }
    if(s.stage===2)s.routes.forEach((route,index)=>{
      if(route.sealed)return;
      const preparedReduction=route.prepared?1:0,predictionReduction=s.prediction?1:0,safeReduction=s.safeSeal>0?1:0;
      const risk=Math.max(0,route.currentRisk-preparedReduction-predictionReduction-safeReduction);
      if(!route.prepared)result.push(action(`prepare-${index}`,`${route.label} 사전 고정`,`한 행동을 써 이 경로의 봉쇄 반동을 1 줄인다.`));
      const target=s.routes.find(x=>x.id===route.agitates);
      const chain=s.prediction&&target&&!target.sealed?` 봉쇄 뒤 ${target.label} 위험 +1.`:"";
      result.push(action(`seal-${index}`,`${route.label} 봉쇄`,`현재 반동 +${risk}.${chain}`));
    });
    result.push(action("contain","임시 차단","확산 -1."));
    for(const ability of E.abilities[id]||[]){
      let label=ability.label;
      if(ability.id==="intel")label+=` (${m.info})`;
      if(ability.id==="snapshot")label+=` (${m.memory})`;
      if(ability.id==="conserve")label+=` (${m.effort})`;
      if(ability.ruleCost)label+=` · 집행 ${m.rules}회`;
      result.push(action(ability.id,label,ability.description,abilityDisabled(s,m,ability)));
    }
    return result;
  }

  const abilityCues={
    hwayoung:"화영이 거품의 충격선 앞에 몸을 세운다.",
    "kang-unshim":"운심의 화면에서 흩어진 제보가 한 지점으로 모인다.",
    "epi-minos":"카오의 검은 부리 안에서 조금 전 장면이 다시 펼쳐진다.",
    inan:"바닥을 덮던 떨림이 이난의 발끝부터 잦아든다.",
    "kim-wooju":"겹치던 잡음이 꺼지고 한 줄의 경로만 선명해진다.",
    mageuna:"붉은 철사가 경계선을 따라 팽팽하게 당겨진다.",
    "byeon-ari":"수십 개의 손이 오염 경계를 안쪽부터 벗겨낸다.",
    josangmin:"상민의 그림자에서 먐먀의 발톱 하나가 느리게 나온다."
  };
  const ABILITY_RESOLVERS={
    absorbThreat(s,m){lowerSpread(s,2);m.heat++;},
    blockRisk(s,m,a,cid){setBlock(s,cid,a.id,a.id==="distributed"?"화영의 분산 방호":"이난의 저체온 구역");},
    gatherIntel(s,m){m.info++;effect(s,`현장 정보 +1 · ${m.info}`,{source:"kang-unshim",stat:"info",delta:1});},
    swingSituation(s,m){addProgress(s,2);s.spread+=2;},
    storeMomentum(s){s.time++;s.traceUsed=true;effect(s,`남은 시간 +1 · ${s.time}`,{source:"kang-unshim",stat:"time",delta:1});},
    snapshotState(s,m){m.memory++;effect(s,`보존 장면 +1 · ${m.memory}`,{source:"epi-minos",stat:"memory",delta:1});},
    restoreState(s){lowerSpread(s,1);addProgress(s,1);},
    stabilizeField(s,m,a,cid){if(a.mode==="block")setBlock(s,cid,a.id,"이난의 저체온 구역");else{lowerSpread(s,2);m.cool=2;}},
    analyze(s,m){lowerSpread(s,1);addProgress(s,1);m.cool=2;},
    unlockRoute(s){s.prediction=true;s.predictedChain=true;},
    declareRule(s,m,a,cid){m.rules--;setBlock(s,cid,a.id,"마근아의 통행 규정");effect(s,`집행 ${m.rules}회`,{source:cid,stat:"rules",delta:-1});},
    purify(s,m,a,cid){lowerSpread(s,3);m.hp=Math.max(0,m.hp-a.hpCost);m.cool=2;narration(s,"장갑 안쪽으로 검은 얼룩이 번지고 손끝이 잠시 굳는다.",{accent:cid,tone:"damage"});effect(s,`${character(cid).name} HP -${a.hpCost} · ${m.hp}`,{source:cid,stat:"hp",delta:-a.hpCost,tone:"damage"});if(m.hp===0)effect(s,`${character(cid).name} 전투 불능`,{source:cid,stat:"incapacitated",tone:"danger"});},
    conserveAction(s,m){m.effort++;effect(s,`비축 +1 · ${m.effort}`,{source:"josangmin",stat:"effort",delta:1});},
    decisiveIntervention(s,m,a){if(a.mode==="progress")addProgress(s,2);else lowerSpread(s,3);}
  };
  function payAbility(m,a){if(a.cost)Object.entries(a.cost).forEach(([key,value])=>m[key]-=value);}
  function priorityAvailable(s,id){return id==="staff"||id==="supplies"&&s.unlocks.suppliesPriority;}
  function choosePriority(s,id){
    const selected=id.endsWith("staff")?"staff":"supplies";if(!priorityAvailable(s,selected))return false;s.priority=selected;const p=E.priorities[s.priority];s.time=p.time+(s.clues.includes("timing")?1:0);
    if(s.priority==="staff"&&s.clues.includes("testimony"))s.progress=1;
    if(s.priority==="supplies"&&s.clues.includes("sanitation"))s.spread=Math.max(0,s.spread-1);
    narration(s,s.priority==="staff"?"비상문 쪽 유도등이 켜지고 창고 셔터가 뒤로 밀린다.":"창고 무균선이 닫히고 조리원 대피 표지가 짧게 점멸한다.",{tone:"decision"});effect(s,`${p.label} 선택`,{stat:"priority",value:s.priority});
    const lines=s.priority==="staff"?E.dialogue.priorityStaff:E.dialogue.prioritySupplies;
    lines.filter(x=>s.partyIds.includes(x.id)||s.supportId===x.id).forEach(x=>dialogue(s,x.text,character(x.id).name,{accent:x.id}));
    return true;
  }
  function prepareRoute(s,index){const route=s.routes[index];if(!route||route.sealed||route.prepared)return false;route.prepared=true;narration(s,`${route.label} 양쪽에 고정 장치가 맞물리고 흔들리던 배관이 멎는다.`,{tone:"guard"});effect(s,`${route.label} 준비 · 봉쇄 반동 -1`,{stat:"routePrepared",source:route.id});return true;}
  function sealRoute(s,index){
    const route=s.routes[index];if(!route||route.sealed)return false;
    let risk=route.currentRisk-(route.prepared?1:0)-(s.prediction?1:0)-(s.safeSeal>0?1:0);risk=Math.max(0,risk);
    if(s.prediction){s.prediction=false;s.predictedChain=null;narration(s,"우주의 표시선을 따라 압력이 튈 지점을 먼저 조인다.",{accent:"kim-wooju"});effect(s,"봉쇄 반동 -1",{source:"kim-wooju",stat:"routeRisk",delta:-1});}
    if(s.safeSeal>0){s.safeSeal--;narration(s,"미리 그어 둔 위생선이 튀어 오르던 압력을 한 번 받아낸다.",{tone:"guard"});effect(s,"안전 봉쇄 사용",{stat:"safeSeal",delta:-1});}
    if(s.reserveBoost>0){s.reserveBoost--;risk=Math.max(0,risk-1);narration(s,"상민이 남겨 둔 고정핀 하나가 마지막 흔들림을 붙든다.",{accent:"josangmin"});effect(s,"봉쇄 반동 -1",{source:"josangmin",stat:"routeRisk",delta:-1});}
    route.sealed=true;s.routeOrder.push(route.id);s.spread+=risk;s.progress++;
    narration(s,`${route.label}의 검은 흐름이 끊기고 표시등이 녹색으로 바뀐다.`,{tone:"success"});effect(s,`${route.label} 봉쇄 · 확산도 +${risk} · ${s.progress}/${E.stages[2].needed}`,{source:route.id,stat:"spread",delta:risk,tone:risk?"warning":"success"});
    const target=s.routes.find(x=>x.id===route.agitates);
    if(target&&!target.sealed){target.currentRisk+=2;narration(s,`막힌 거품이 방향을 틀어 ${target.label} 쪽으로 솟구친다.`,{tone:"danger"});effect(s,`${target.label} 봉쇄 위험 +2`,{source:route.id,stat:"routeRisk",delta:2,tone:"danger"});}
    return true;
  }
  function actionCategory(id,ability){
    if(id.startsWith("priority-"))return"decision";if(id.startsWith("progress-"))return"progress";if(id==="contain")return"pressure";if(id.startsWith("prepare-"))return"setup";if(id.startsWith("seal-"))return"seal";
    if(!ability)return"other";if(["gatherIntel","snapshotState","conserveAction","storeMomentum"].includes(ability.verb))return"resource";if(["swingSituation","restoreState","analyze"].includes(ability.verb)||ability.mode==="progress")return"hybrid";if(["absorbThreat","purify"].includes(ability.verb)||ability.mode==="contain"||ability.mode==="lower")return"pressure";if(ability.verb==="unlockRoute")return"setup";return"defense";
  }
  function beginActionResolution(s,id,ability,actorId){const previous=s.actionMemory[actorId],repeat=previous?.id===id?previous.repeat+1:1,category=actionCategory(id,ability);s.actionMemory[actorId]={id,repeat};s.lastActionId=id;s.lastActionActorId=actorId;s.repeatCount=repeat;s.actionContext={id,repeat,category,actorId};return s.actionContext;}
  function applyPhenomenonReaction(s,context){
    if(context.category==="decision")return;
    if(context.repeat>=2){s.spread++;narration(s,"검은 막이 방금 전 움직임을 흉내 내며 대응을 비껴간다.",{tone:"danger"});effect(s,"반복 노출 · 확산도 +1",{stat:"spread",delta:1,tone:"danger"});}
    const current=pattern(s);
    if(current.id==="surge"&&["progress","hybrid","seal"].includes(context.category)){s.spread++;narration(s,"목표 지점의 틈을 타 검은 거품이 한 칸 더 기어오른다.",{tone:"warning"});effect(s,"역류 가속 · 확산도 +1",{stat:"spread",delta:1,tone:"warning"});}
    if(current.id==="hunger"&&["resource","setup"].includes(context.category)){s.spread++;narration(s,"준비하는 사이 거품이 비어 있는 경로를 삼킨다.",{tone:"warning"});effect(s,"경로 포식 · 확산도 +1",{stat:"spread",delta:1,tone:"warning"});}
  }
  function act(s,id){
    if(s.phase!=="battle")return false;
    const actorId=currentId(s),m=member(s,actorId),available=actions(s).find(x=>x.id===id&&!x.disabled);if(!actorId||m.hp<=0||!available)return false;const ability=(E.abilities[actorId]||[]).find(x=>x.id===id),context=beginActionResolution(s,id,ability,actorId);
    s.stageActions[s.stage]++;
    if(id.startsWith("priority-"))choosePriority(s,id);
    else if(id==="progress-primary"){narration(s,s.stage===0?"바닥의 오염 표식 하나가 확정된다.":s.priority==="staff"?"조리원 한 무리가 비상문을 통과한다.":"식자재 한 구역이 무균선 안으로 옮겨진다.",{accent:actorId});addProgress(s,1);if(s.stage===0||s.priority==="staff")s.spread++;}
    else if(id==="progress-secondary"){narration(s,s.priority==="staff"?"남은 식자재가 임시 격리선 안으로 밀려난다.":"뒤처진 조리원이 좁은 통로를 빠져나간다.",{accent:actorId});addSecondary(s,1);if(s.priority==="supplies")s.spread++;}
    else if(id==="contain"){narration(s,"임시 차단막이 번지는 거품의 앞을 가로막는다.",{accent:actorId});lowerSpread(s,1);}
    else if(id.startsWith("prepare-"))prepareRoute(s,Number(id.split("-")[1]));
    else if(id.startsWith("seal-"))sealRoute(s,Number(id.split("-")[1]));
    else{
      if(!ability)return false;
      narration(s,abilityCues[actorId],{accent:actorId,tone:"ability"});dialogue(s,ability.quote,character(actorId).name,{accent:actorId});payAbility(m,ability);ABILITY_RESOLVERS[ability.verb](s,m,ability,actorId);if(ability.once)s[ability.once]=true;
    }
    applyPhenomenonReaction(s,context);s.actionContext=null;clampSpread(s);
    if(checkFailure(s))return true;
    if(finishStage(s))return true;
    advanceTurn(s,actorId);return true;
  }

  const SUPPORT_RESOLVERS={
    blockRisk(s,a,id){setBlock(s,id,a.verb,a.sourceLabel);},
    swingSituation(s){if(s.stage===2){s.safeSeal++;effect(s,"제보 동선 · 안전 봉쇄 +1",{source:"kang-unshim",stat:"safeSeal",delta:1});}else{addProgress(s,1);s.spread++;narration(s,"운심의 제보가 사람들을 움직이는 동안 거품도 열린 통로를 따라 번진다.",{accent:"kang-unshim",tone:"warning"});effect(s,`확산도 +1 · ${s.spread}`,{source:"kang-unshim",stat:"spread",delta:1,tone:"warning"});}},
    restoreState(s){s.time++;narration(s,"카오가 삼킨 장면이 펼쳐지고, 직전에 닫힌 통로가 잠시 다시 열린다.",{accent:"epi-minos"});effect(s,`남은 시간 +1 · ${s.time}`,{source:"epi-minos",stat:"time",delta:1});},
    stabilizeField(s,a){lowerSpread(s,a.amount);},
    unlockRoute(s){s.safeSeal++;effect(s,"안전 진입로 +1",{source:"kim-wooju",stat:"safeSeal",delta:1});},
    declareRule(s,a,id){const m=member(s,id);m.rules-=a.ruleCost;setBlock(s,id,a.verb,a.sourceLabel);effect(s,`집행 ${m.rules}회`,{source:id,stat:"rules",delta:-a.ruleCost});},
    purify(s,a){lowerSpread(s,a.amount);},
    conserveAction(s){s.reserveBoost++;effect(s,"최소 개입 비축 +1",{source:"josangmin",stat:"reserveBoost",delta:1});}
  };
  function supportStatus(s){
    const id=s.supportId,a=E.supportAdapters[id],m=member(s,id);if(s.phase!=="battle")return{available:false,reason:"전투 구간이 아니다."};if(!a)return{available:false,reason:"지원 효과가 없다."};if(s.supportUsed)return{available:false,reason:"이 구간에는 이미 지원을 요청했다."};if(s.supportUses<=0)return{available:false,reason:"사건 전체 지원 횟수를 소진했다."};if(a.stages&&!a.stages.includes(s.stage))return{available:false,reason:"이 지원은 마지막 봉쇄 구간에서만 사용할 수 있다."};if(a.minSpread&&s.spread<a.minSpread)return{available:false,reason:`확산 ${a.minSpread} 이상에서 사용할 수 있다.`};if(a.maxTime&&s.time>a.maxTime)return{available:false,reason:`남은 시간 ${a.maxTime} 이하에서 사용할 수 있다.`};if(a.minTime&&s.time<a.minTime)return{available:false,reason:`남은 시간 ${a.minTime} 이상이 필요하다.`};if(a.ruleCost&&m.rules<a.ruleCost)return{available:false,reason:"남은 집행 횟수가 없다."};if(["blockRisk","declareRule"].includes(a.verb)&&s.blockEffect)return{available:false,reason:"이미 차단 효과가 대기 중이다."};return{available:true,reason:"사용 가능"};
  }
  function useSupport(s){
    const status=supportStatus(s);if(!status.available)return false;
    const id=s.supportId,a=E.supportAdapters[id],m=member(s,id);s.supportUsed=true;s.supportUses--;
    narration(s,`${character(id).name}의 후방 회선이 현장에 연결된다.`,{accent:id,tone:"support"});dialogue(s,character(id).support.quote,`${character(id).name} · 후방`,{accent:id});
    if(a.spreadCost){s.spread+=a.spreadCost;narration(s,"후방 회선이 열리는 사이 검은 거품이 비어 있는 바닥 틈으로 번진다.",{tone:"warning"});effect(s,`확산도 +${a.spreadCost} · ${s.spread}`,{source:id,stat:"spread",delta:a.spreadCost,tone:"warning"});}
    if(a.timeCost){s.time-=a.timeCost;narration(s,"지원 장비가 도착할 때까지 봉쇄조의 움직임이 잠시 멈춘다.",{tone:"warning"});effect(s,`남은 시간 -${a.timeCost} · ${s.time}`,{source:id,stat:"time",delta:-a.timeCost,tone:"warning"});}
    SUPPORT_RESOLVERS[a.verb](s,a,id);clampSpread(s);if(!checkFailure(s))finishStage(s);return true;
  }
  function takePresentation(s){const queued=s.presentation.slice();s.presentation.length=0;return queued;}
  function transitionDialogue(s){return(E.dialogue.transitions[s.stage]||[]).filter(x=>s.partyIds.includes(x.id)||s.supportId===x.id);}
  function supportAvailable(s){return supportStatus(s).available;}

  return{create,availableCharacterIds,toggle,support,beginBriefing,beginExplore,selectLocation,leaveLocation,investigate,start,nextStage,actions,act,useSupport,supportAvailable,supportStatus,priorityAvailable,currentPattern:pattern,transitionDialogue,objectiveInfo,takePresentation,character,event:E};
})();
