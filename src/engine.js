"use strict";

window.GameEngine = (() => {
  const event=SEONGA_TUTORIAL_EVENT, chars=SEONGA_CHARACTERS;
  const character=id=>chars.find(c=>c.id===id), member=(s,id)=>s.members[id], stage=s=>event.stages[s.stageIndex];
  const availableCharacterIds=()=>window.CampaignProgress?CampaignProgress.availableCharacterIds(event.id,event.characterPool):[...event.characterPool];
  const subject=name=>{const code=name.charCodeAt(name.length-1)-0xac00;return`${name}${code>=0&&code<=11171&&code%28!==0?"이":"가"}`;};
  function present(s,type,text,meta={}){const item={type,text,message:text,...meta};s.log.push(item);s.presentation.push(item);return item;}
  const dialogue=(s,text,speaker,meta={})=>present(s,"dialogue",text,{speaker,...meta});
  const narration=(s,text,meta={})=>present(s,"narration",text,meta);
  const effect=(s,text,meta={})=>present(s,"effect",text,meta);
  const activeActor=s=>character(s.turnOrder[s.turnIndex]);
  const absentId=s=>event.characterPool.find(id=>!s.partyIds.includes(id)), aliveIds=s=>s.partyIds.filter(id=>member(s,id).hp>0), pattern=s=>event.patterns[(s.round-1)%event.patterns.length];
  const eligibleStudentIndexes=s=>s.students.map((x,i)=>({x,i})).filter(({x})=>s.stageIndex!==2||!x.evacuated).map(({i})=>i);
  const worstIndex=s=>eligibleStudentIndexes(s).reduce((best,i)=>s.students[i].stage>s.students[best].stage?i:best,eligibleStudentIndexes(s)[0]??0);
  const actionLines={
    hwayoung:{advance:"소인이 먼저 가겠소. 뒤는 부탁드리오!",intercept:"거기서 멈추시오. 부딪힐 거면 소인에게 부딪히면 되오!",burst:"충분히 참았소. 우리엘, 이제 돌려줍시다!",steady:"천천히 나오시오. 넘어져도 소인이 받겠소."},
    "kang-unshim":{advance:"패턴 잡았다. 얘 계속 같은 데서 도네. 다음으로 넘겨!",collect:"제보 들어온다. 좋아, 슬슬 불 붙겠는데?",topic:"지금이다. 화력 몰아! 이 반복부터 꺼버리자!",steady:"내 목소리 들려? 수업 끝났어. 폰 보지 말고 나 봐."},
    "epi-minos":{advance:"빠진 장면 찾았어. 이건 내가 챙길게.",archive:"카오, 먹어. 없어지기 전에 전부.",recover:"모아둔 거 꺼내봐. …여기, 반복 안 된 부분이 있어.",steady:"괜찮아. 네가 잊어도 내가 갖고 있을게."},
    inan:{advance:"반복되는 지점 찾았어요. 여기부터 끊어보죠.",calm:"숨 내쉬어요. 천천히. 안 되면 라파엘이 도와줄 거예요.",care:"호흡 괜찮아졌어요. 이제 문 쪽 볼게요.",steady:"수업 끝났어요. 계속 앉아 있으면 근육 이완제를 쓸 수도 있어요."},
    "kim-wooju":{advance:"됐어요. 다음 구간으로 넘겼어요. 팝업은 보지 마세요.",scan:"노이즈 걷을게요. 중심만 보면 돼요.",patch:"길 열었어요. 초록색 선만 따라가요.",steady:"제 목소리보다 화면 화살표만 보세요. 그게 덜 피곤해요."}
  };
  const actionCues={
    hwayoung:"화영이 문턱 앞에 발을 박고 충격이 올 방향으로 어깨를 돌린다.",
    "kang-unshim":"운심의 화면에 흩어진 제보와 반응이 하나의 화제로 겹친다.",
    "epi-minos":"카오의 부리 안에서 보존된 장면 한 조각이 다시 빛난다.",
    inan:"학생의 떨리던 호흡이 이난의 낮은 손짓을 따라 느려진다.",
    "kim-wooju":"복도에 겹친 잡음이 꺼지고 초록색 경로 하나만 남는다."
  };

  function createState(){
    const members={};chars.forEach(c=>members[c.id]={hp:c.game.hp,heat:0,buzz:0,memory:0,meltdown:0,guard:0,strain:0,overheat:0,sedation:0});
    return{phase:"party",partyIds:["hwayoung","kang-unshim","inan","kim-wooju"],members,clues:[],investigated:[],selectedLocation:null,investigationsLeft:event.rules.investigationLimit,students:event.students.map((x,i)=>({...x,stage:event.initialStudentStages[i],evacuated:false})),stageIndex:0,stageProgress:0,threatPressure:0,turnOrder:[],turnIndex:0,round:1,supportUsed:false,supportCharges:event.rules.supportCharges,supportShield:false,lastWorsened:null,rootResolved:false,routeUses:0,lastCategory:null,deferredPressure:0,log:[],presentation:[]};
  }
  function toggleParty(s,id){if(!availableCharacterIds().includes(id))return false;const i=s.partyIds.indexOf(id);if(i>=0&&s.partyIds.length>1)s.partyIds.splice(i,1);else if(i<0&&s.partyIds.length<4)s.partyIds.push(id);else return false;return true;}
  function startBriefing(s){if(s.partyIds.length!==4)return false;s.phase="briefing";effect(s,`출전 4명 · 후방 ${character(absentId(s)).name}`,{stat:"formation"});return true;}
  function startExploration(s){s.phase="exploration";return true;}
  function selectLocation(s,id){if(s.phase!=="exploration"||s.investigated.includes(id)||s.investigationsLeft<=0)return false;if(!event.investigations.some(x=>x.id===id))return false;s.selectedLocation=id;return true;}
  function leaveLocation(s){s.selectedLocation=null;}
  function investigate(s,choiceId){
    if(!s.selectedLocation||s.investigationsLeft<=0)return false;
    const location=event.investigations.find(x=>x.id===s.selectedLocation),choice=location?.choices.find(x=>x.id===choiceId);
    if(!choice||s.clues.includes(choice.clue))return false;
    s.clues.push(choice.clue);s.investigated.push(location.id);s.investigationsLeft--;s.selectedLocation=null;
    const investigator=character(choice.owner);narration(s,`${location.label}에서 ${investigator.name}의 조사가 시작된다.`,{accent:investigator.id});dialogue(s,investigator.voice.explore,investigator.name,{accent:investigator.id});narration(s,choice.result,{accent:investigator.id});effect(s,`단서 확보 · ${event.clueInfo[choice.clue].label}`,{source:investigator.id,stat:"clue"});return true;
  }
  function beginStage(s,index){
    s.stageIndex=index;s.stageProgress=0;s.threatPressure=stage(s).initialPressure-(index===0&&s.clues.includes("network")?1:0);s.turnOrder=s.partyIds.slice().sort((a,b)=>character(b).game.speed-character(a).game.speed);s.turnIndex=0;s.round=1;s.supportUsed=false;s.supportShield=false;s.lastWorsened=null;s.routeUses=index===2&&s.clues.includes("route")?2:0;s.lastCategory=null;s.deferredPressure=0;s.phase="battle";
    if(index===1&&s.clues.includes("rhythm")){stabilize(s,1);narration(s,"맞춰 둔 호흡 간격에 따라 학생 하나의 굳은 어깨가 먼저 풀린다.",{tone:"recover"});effect(s,"호흡 단서 적용",{stat:"clueBonus"});}
    narration(s,stage(s).intro,{tone:"transition"});dialogue(s,character(absentId(s)).voice.stages[index],`${character(absentId(s)).name} · 후방`,{accent:absentId(s)});
  }
  function startBattle(s){if(s.clues.length<2)return false;beginStage(s,0);return true;}
  function continueStage(s){beginStage(s,s.stageIndex+1);}
  function lowerPressure(s,amount){const before=s.threatPressure;s.threatPressure=Math.max(0,s.threatPressure-amount);effect(s,`현상 압력 ${s.threatPressure-before} · ${s.threatPressure}`,{stat:"pressure",delta:s.threatPressure-before,tone:"recover"});}
  function stabilize(s,amount=1){const i=worstIndex(s),target=s.students[i],before=target.stage;target.stage=Math.max(0,target.stage-amount);narration(s,`${target.label}의 끊기던 호흡이 고르게 이어지고 칠판을 향하던 시선이 풀린다.`,{tone:"recover"});effect(s,`${target.label} · ${event.studentStages[target.stage]}`,{source:target.id,stat:"studentState",delta:target.stage-before,tone:"recover"});}
  function addProgress(s,amount=1){const before=s.stageProgress;s.stageProgress=Math.min(stage(s).needed,s.stageProgress+amount);if(before!==s.stageProgress)effect(s,`${stage(s).objective} ${s.stageProgress}/${stage(s).needed}`,{stat:"progress",delta:s.stageProgress-before,tone:"progress"});if(s.stageIndex===1&&s.stageProgress>=stage(s).needed&&!s.rootResolved){s.rootResolved=true;lowerPressure(s,2);narration(s,"칠판의 누락된 문장이 완성되자 교실의 복창이 한순간에 끊긴다.",{tone:"success"});}}
  function finishStageIfReady(s){const allNormal=s.students.filter(x=>!x.evacuated).every(x=>x.stage===0),allEvacuated=s.students.every(x=>x.evacuated);const complete=s.stageIndex===0?s.stageProgress>=stage(s).needed:s.stageIndex===1?s.rootResolved&&allNormal:allEvacuated;if(!complete)return false;if(s.stageIndex<2){s.phase="interlude";narration(s,event.interludes[s.stageIndex],{tone:"transition"});}else{s.phase="success";narration(s,"다섯 학생이 모두 비상계단을 지나 안전 구역에 도착했다.",{tone:"success"});}return true;}
  function checkFailure(s){if(s.students.some(x=>!x.evacuated&&x.stage>=event.rules.dangerStage)){s.phase="failure";narration(s,"학생의 복창이 종소리와 완전히 겹치고, 열린 문이 다시 안쪽으로 닫힌다.",{tone:"danger"});effect(s,"학생 위험 · 대응 중단",{stat:"failure",tone:"danger"});}else if(aliveIds(s).length===0){s.phase="failure";narration(s,"마지막 출전 인원이 주저앉자 후방에서 퇴로를 강제로 연다.",{tone:"danger"});effect(s,"출전 인원 전투 불능 · 후퇴",{stat:"failure",tone:"danger"});}}
  function endRound(s){
    s.lastWorsened=null;
    if(s.threatPressure>=event.rules.pressureEscalateAt){
      if(s.supportShield){s.supportShield=false;narration(s,"복도 바깥에서 고정된 문이 현상 반동을 받아내며 크게 울린다.",{accent:"hwayoung",tone:"guard"});effect(s,"현상 반동 차단",{source:"hwayoung",stat:"block",tone:"guard"});}
      else{const activeHwa=s.partyIds.includes("hwayoung")&&member(s,"hwayoung").guard>0,exposed=aliveIds(s);exposed.forEach(id=>{if(!(activeHwa&&id!=="hwayoung"))member(s,id).hp=Math.max(0,member(s,id).hp-1);});narration(s,activeHwa?"화영이 충격선 안으로 한 걸음 들어가 파동을 어깨로 받아낸다.":"교실 전체를 훑은 역류가 출전 인원의 호흡을 끊는다.",{accent:activeHwa?"hwayoung":undefined,tone:"damage"});effect(s,activeHwa?"화영 HP -1":"출전 인원 HP -1",{source:activeHwa?"hwayoung":undefined,stat:"hp",delta:-1,tone:"damage"});exposed.filter(id=>member(s,id).hp===0).forEach(id=>effect(s,`${subject(character(id).name)} 전투 불능`,{source:id,stat:"incapacitated",tone:"danger"}));if(activeHwa){const h=member(s,"hwayoung");h.guard--;h.heat=Math.min(4,h.heat+1);dialogue(s,character("hwayoung").voice.hit,"화영",{accent:"hwayoung"});}else{const reactor=character(s.turnOrder[(s.round-1)%s.turnOrder.length]);dialogue(s,reactor.voice.hit,reactor.name,{accent:reactor.id});}if(s.stageIndex>0&&eligibleStudentIndexes(s).length){const i=worstIndex(s);s.students[i].stage++;s.lastWorsened={stageIndex:s.stageIndex,studentIndex:i};narration(s,`${s.students[i].label}의 시선이 다시 칠판에 붙고 입술이 같은 문장을 되풀이한다.`,{tone:"danger"});effect(s,`${s.students[i].label} · ${event.studentStages[s.students[i].stage]}`,{source:s.students[i].id,stat:"studentState",delta:1,tone:"danger"});const reactor=character(s.turnOrder[s.round%s.turnOrder.length]);dialogue(s,reactor.voice.worsen,reactor.name,{accent:reactor.id});}}
    }
    if(s.deferredPressure){s.threatPressure+=s.deferredPressure;narration(s,"방출했던 열이 교실 벽을 타고 돌아와 종소리를 다시 울린다.",{tone:"warning"});effect(s,`현상 압력 +${s.deferredPressure} · ${s.threatPressure}`,{stat:"pressure",delta:s.deferredPressure,tone:"warning"});s.deferredPressure=0;}
    s.partyIds.forEach(id=>{const m=member(s,id);["meltdown","strain","overheat","sedation"].forEach(key=>{if(m[key]>0)m[key]--;});});s.round++;checkFailure(s);
  }
  function nextTurn(s){do{s.turnIndex=(s.turnIndex+1)%s.turnOrder.length;}while(member(s,s.turnOrder[s.turnIndex]).hp<=0);if(s.turnIndex===0)endRound(s);}
  const action=(id,label,description,disabled=false,primary=false)=>({id,label,description,disabled,primary});
  function availableActions(s){
    const c=activeActor(s),m=member(s,c.id),studentsNeedCare=s.stageIndex>0&&!s.students.filter(x=>!x.evacuated).every(x=>x.stage===0),actions=[];
    if(s.stageIndex<2){const label=s.stageIndex===0?"문턱 분석":s.rootResolved?"학생 깨우기":"반복 관찰";actions.push(action("advance",label,studentsNeedCare&&s.rootResolved?"가장 불안한 학생을 한 단계 안정화한다.":`${stage(s).objective}를 1 진행한다.`));}
    if(s.stageIndex===2){s.students.forEach((student,i)=>actions.push(action(`evacuate-${i}`,`${student.label} 이탈`,`압력 +${student.exitRisk}. ${student.exitHint}`,student.evacuated||student.stage>0,false)));}
    if(!(s.stageIndex===1&&s.rootResolved))actions.push(action("steady","학생 안정화","가장 위태로운 미이탈 학생을 한 단계 진정시킨다.",s.stageIndex===0||!studentsNeedCare));
    if(c.id==="hwayoung"){actions.push(action("intercept","사명의 이행 · 전열 차단",s.stageIndex===1?"압력 2 감소·학생 1단계 안정·반동 방호. 다음 차례 재정비.":"압력 2 감소·반동 방호. 사용 뒤 다음 차례까지 재정비.",m.strain>0));actions.push(action("burst",`축적 열량 방출 (${m.heat}/2)`,"열량 2 소모·압력 4 감소. 라운드 종료 시 압력 1 반동.",m.heat<2,true));}
    if(c.id==="kang-unshim"){actions.push(action("collect",`제보 수집 (${m.buzz})`,"제보를 모은다. 최초 제보 단서가 있으면 2 획득.",s.stageIndex===2));actions.push(action("topic",`화제 · 확산 (${m.buzz}/3)`,s.stageIndex===1?"제보 3 소모·압력 3 감소·목표 1 진행·학생 1단계 안정·HP 1 소모.":"제보 3 소모·압력 3 감소·목표 1 진행·HP 1 소모. 다음 차례 과열.",m.buzz<3||s.stageIndex===2||m.overheat>0,true));}
    if(c.id==="epi-minos"){actions.push(action("archive",`아귀 · 장면 보존 (${m.memory})`,"장면 기억 1 저장.",s.stageIndex===2));actions.push(action("recover",`보존 장면 회수 (${m.memory}/2)`,"기억 2 소모·학생 안정화·목표 진행. 공허 반동으로 압력 +1.",m.memory<2||s.stageIndex===2,true));}
    if(c.id==="inan"){actions.push(action("calm","강제 진정",s.stageIndex===0?"압력 2 감소. 사용 뒤 다음 차례까지 재정비.":"학생 2단계 진정. 사용 뒤 다음 차례까지 재정비.",s.stageIndex>0&&!studentsNeedCare||m.sedation>0,true));actions.push(action("care","라파엘 · 보호막","현상 압력 1 감소."));}
    if(c.id==="kim-wooju"){actions.push(action("scan","노이즈 캔슬링 · 분석",s.stageIndex===2?"압력 2 감소·다음 차례 방전.":s.stageIndex===1?"목표 1 진행·학생 1단계 안정·다음 차례 방전.":"목표 1 진행·다음 차례 방전.",m.meltdown>0,true));actions.push(action("patch","경로 재설정",s.stageIndex===2?"안전 통과 1회·압력 2 감소·다음 차례 방전.":"압력 3 감소·목표 1 진행·다음 차례 방전.",!s.clues.includes("network")||m.meltdown>0,true));}
    return actions;
  }
  function evacuate(s,index){const student=s.students[index];if(!student||student.evacuated||student.stage>0)return false;let risk=student.exitRisk;if(s.routeUses>0&&risk>0){risk=Math.max(0,risk-1);s.routeUses--;effect(s,`안전 통과 사용 · 잔여 ${s.routeUses}`,{stat:"routeUses",delta:-1});}student.evacuated=true;s.stageProgress++;s.threatPressure+=risk;narration(s,`${student.label}이 비상계단의 초록선을 따라 교실을 빠져나간다.`,{tone:"success"});effect(s,`${student.label} 이탈 · 압력 +${risk} · 잔여 ${s.students.filter(x=>!x.evacuated).length}명`,{source:student.id,stat:"pressure",delta:risk,tone:risk?"warning":"success"});return true;}
  function actionCategory(id){if(id==="advance")return"progress";if(id==="steady"||id==="calm")return"protect";if(["intercept","burst","care","scan"].includes(id))return"pressure";if(id==="collect"||id==="archive")return"resource";if(["topic","recover","patch"].includes(id))return"hybrid";if(id.startsWith("evacuate-"))return"evacuate";return"other";}
  function applyPhenomenonReaction(s,id,actor){
    const category=actionCategory(id),current=pattern(s);
    if(s.lastCategory===category&&category!=="other"){s.threatPressure++;narration(s,"같은 대응의 틈을 외운 현상이 한 박자 먼저 움직인다.",{tone:"danger"});effect(s,"반복 노출 · 현상 압력 +1",{stat:"pressure",delta:1,tone:"danger"});}
    if(current.id==="recitation"&&["progress","hybrid"].includes(category)){s.threatPressure++;narration(s,"한 줄을 고칠 때마다 학생들의 복창이 더 큰 목소리로 따라붙는다.",{tone:"warning"});effect(s,"복창 증폭 · 현상 압력 +1",{stat:"pressure",delta:1,tone:"warning"});}
    if(current.id==="fixation"&&category==="protect"){s.threatPressure++;narration(s,"칠판을 향하던 학생들의 시선이 보호 행동자에게 일제히 돌아간다.",{tone:"warning"});effect(s,"시선 고정 · 현상 압력 +1",{stat:"pressure",delta:1,tone:"warning"});}
    if(current.id==="counterpulse"&&["pressure","hybrid"].includes(category)){member(s,actor.id).hp=Math.max(0,member(s,actor.id).hp-1);narration(s,"눌러 둔 파동이 바닥에서 되튀어 행동자의 몸을 친다.",{tone:"damage"});effect(s,`${actor.name} HP -1 · ${member(s,actor.id).hp}`,{source:actor.id,stat:"hp",delta:-1,tone:"damage"});if(member(s,actor.id).hp===0)effect(s,`${actor.name} 전투 불능`,{source:actor.id,stat:"incapacitated",tone:"danger"});}
    s.lastCategory=category;
  }
  function act(s,id){
    if(s.phase!=="battle")return false;const c=activeActor(s),m=member(s,c.id);if(!availableActions(s).some(a=>a.id===id&&!a.disabled))return false;narration(s,actionCues[c.id],{accent:c.id});dialogue(s,actionLines[c.id][id]||actionLines[c.id].advance,c.name,{accent:c.id});
    if(id==="advance"){if(s.stageIndex===1&&s.rootResolved&&s.students.some(x=>x.stage>0))stabilize(s);else addProgress(s);}
    if(id.startsWith("evacuate-"))evacuate(s,Number(id.split("-")[1]));
    if(id==="steady")stabilize(s);if(id==="intercept"){lowerPressure(s,2);if(s.stageIndex===1&&s.students.some(x=>x.stage>0))stabilize(s);m.guard=1;m.strain=2;}if(id==="burst"){m.heat-=2;lowerPressure(s,4);s.deferredPressure++;effect(s,"후속 반동 +1",{source:c.id,stat:"deferredPressure",delta:1,tone:"warning"});}if(id==="collect"){const gained=s.clues.includes("reports")?2:1;m.buzz+=gained;effect(s,`제보 +${gained} · ${m.buzz}`,{source:c.id,stat:"buzz",delta:gained});}if(id==="topic"){m.buzz-=3;lowerPressure(s,3);addProgress(s);if(s.stageIndex===1&&s.students.some(x=>x.stage>0))stabilize(s);m.hp=Math.max(0,m.hp-1);m.overheat=2;narration(s,"한꺼번에 퍼진 제보의 열기가 운심의 팔을 타고 되돌아온다.",{accent:c.id,tone:"damage"});effect(s,`강운심 HP -1 · ${m.hp}`,{source:c.id,stat:"hp",delta:-1,tone:"damage"});if(m.hp===0)effect(s,"강운심 전투 불능",{source:c.id,stat:"incapacitated",tone:"danger"});}if(id==="archive"){m.memory++;effect(s,`보존 장면 +1 · ${m.memory}`,{source:c.id,stat:"memory",delta:1});}if(id==="recover"){m.memory-=2;if(s.stageIndex>0)stabilize(s);addProgress(s,s.clues.includes("record")?2:1);s.threatPressure++;narration(s,"되돌린 장면의 빈자리가 교실 벽을 잡아당겨 종을 한 번 울린다.",{accent:c.id,tone:"warning"});effect(s,`현상 압력 +1 · ${s.threatPressure}`,{source:c.id,stat:"pressure",delta:1,tone:"warning"});}if(id==="calm"){if(s.stageIndex===0)lowerPressure(s,2);else stabilize(s,2);m.sedation=2;}if(id==="care")lowerPressure(s,1);if(id==="scan"){if(s.stageIndex===2)lowerPressure(s,2);else{addProgress(s);if(s.stageIndex===1&&s.students.some(x=>x.stage>0))stabilize(s);}m.meltdown=2;}if(id==="patch"){if(s.stageIndex===2){s.routeUses++;effect(s,`안전 통과 +1 · ${s.routeUses}`,{source:c.id,stat:"routeUses",delta:1});lowerPressure(s,2);}else{lowerPressure(s,3);addProgress(s);}m.meltdown=2;}
    applyPhenomenonReaction(s,id,c);
    checkFailure(s);if(s.phase==="battle"&&!finishStageIfReady(s))nextTurn(s);return true;
  }
  function useSupport(s){
    if(s.phase!=="battle"||s.supportUsed||s.supportCharges<=0)return false;const id=absentId(s),c=character(id);s.supportUsed=true;s.supportCharges--;narration(s,`${c.name}의 후방 회선이 현장에 연결된다.`,{accent:id,tone:"support"});dialogue(s,c.support.quote,`${c.name} · 후방 지원`,{accent:id});
    if(id==="hwayoung"){s.supportShield=true;effect(s,"현상 반동 차단 대기",{source:id,stat:"supportShield",tone:"guard"});}if(id==="kang-unshim"){if(s.stageIndex<2)addProgress(s);else{s.routeUses++;effect(s,`안전 통과 +1 · ${s.routeUses}`,{source:id,stat:"routeUses",delta:1});}s.threatPressure++;narration(s,"복도 밖으로 퍼진 제보에 교실 안의 복창도 한 음 높아진다.",{accent:id,tone:"warning"});effect(s,`현상 압력 +1 · ${s.threatPressure}`,{source:id,stat:"pressure",delta:1,tone:"warning"});}if(id==="epi-minos"){if(s.lastWorsened&&s.lastWorsened.stageIndex===s.stageIndex){const target=s.students[s.lastWorsened.studentIndex];target.stage=Math.max(0,target.stage-1);narration(s,"직전 장면이 겹쳐지며 학생의 굳은 자세가 한 박자 전으로 돌아간다.",{accent:id,tone:"recover"});effect(s,`${target.label} 악화 되감기`,{source:id,stat:"studentState",delta:-1,tone:"recover"});s.lastWorsened=null;}else if(s.stageIndex<2)addProgress(s);else{s.routeUses++;effect(s,`안전 통과 +1 · ${s.routeUses}`,{source:id,stat:"routeUses",delta:1});}}if(id==="inan"){if(s.stageIndex>0&&s.students.some(x=>!x.evacuated&&x.stage>0))stabilize(s);else lowerPressure(s,1);}if(id==="kim-wooju"){lowerPressure(s,2);if(s.stageIndex===2){s.routeUses++;effect(s,`안전 통과 +1 · ${s.routeUses}`,{source:id,stat:"routeUses",delta:1});}}finishStageIfReady(s);return true;
  }
  function takePresentation(s){const queued=s.presentation.slice();s.presentation.length=0;return queued;}
  return{createState,character,absentId,availableCharacterIds,toggleParty,startBriefing,startExploration,selectLocation,leaveLocation,investigate,startBattle,continueStage,availableActions,act,useSupport,takePresentation};
})();
