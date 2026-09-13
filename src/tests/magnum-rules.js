"use strict";

const assert=require("node:assert/strict");
global.window=global;let saved=JSON.stringify({completed:["endless-classroom","cafeteria-containment","library-reality-audit"]});
global.localStorage={getItem(){return saved;},setItem(key,value){saved=value;}};
require("../data/campaign.js");require("../data/characters.js");require("../data/neutral-abilities.js");require("../data/magnum-incident.js");require("../magnum-engine.js");

const locations=SEONGA_MAGNUM_EVENT.investigations;
function enter(choices=["rumors-unshim","feathers-ari"],party=["hwayoung","kang-unshim","inan","kim-wooju"],support="byeon-ari"){
  const s=MagnumEngine.create();s.partyIds=[...party];s.supportId=support;assert.equal(MagnumEngine.beginExplore(s),true);
  for(const choiceId of choices){const location=locations.find(x=>x.choices.some(c=>c.id===choiceId));assert.equal(MagnumEngine.selectLocation(s,location.id),true);assert.equal(MagnumEngine.investigate(s,choiceId),true);}
  assert.equal(MagnumEngine.start(s),true);MagnumEngine.takePresentation(s);return s;
}

// 1-2. 네 장소 중 두 곳, 모든 조합 전투 진입.
let combinations=0;
for(let i=0;i<locations.length;i++)for(let j=i+1;j<locations.length;j++){const s=enter([locations[i].choices[0].id,locations[j].choices[0].id]);assert.equal(s.phase,"battle");assert.equal(s.investigated.length,2);let turns=40;while(s.phase==="battle"&&!s.magnum.shattered&&turns--)assert.equal(MagnumEngine.act(s,"attack"),true);assert.ok(s.magnum.shattered,`${locations[i].id}/${locations[j].id} 조사 조합은 파열까지 진행 가능해야 한다.`);assert.equal(MagnumEngine.finishBoss(s,s.order[s.turn]),true);assert.equal(s.phase,"success");combinations++;}
assert.equal(combinations,6);
const limited=MagnumEngine.create();MagnumEngine.beginExplore(limited);for(const x of locations.slice(0,2)){MagnumEngine.selectLocation(limited,x.id);MagnumEngine.investigate(limited,x.choices[0].id);}assert.equal(MagnumEngine.selectLocation(limited,locations[2].id),false);

// 3-6. copyQueue 생성·보존·덮어쓰기, 후방 지원 제외.
const queue=enter();queue.order=["kim-wooju","hwayoung","kang-unshim","inan"];queue.turn=0;
assert.equal(MagnumEngine.act(queue,"analyze"),true);assert.equal(queue.magnum.copyQueue.actorId,"kim-wooju");
assert.equal(MagnumEngine.act(queue,"attack"),true);assert.equal(queue.magnum.copyQueue.actorId,"kim-wooju","기본 행동은 queue를 덮지 않는다.");
queue.supportId="epi-minos";assert.equal(MagnumEngine.useSupport(queue),true);assert.equal(queue.magnum.copyQueue.actorId,"kim-wooju","후방 지원은 queue를 덮지 않는다.");
assert.equal(MagnumEngine.act(queue,"spread"),true);assert.equal(queue.magnum.copyQueue.actorId,"kang-unshim","마지막 고유 능력이 queue에 남는다.");

// 7-10. 라운드 종료 복제, queue 소비, 70% 수치와 binary adapter.
assert.equal(MagnumEngine.act(queue,"calm"),true);assert.equal(queue.magnum.copyQueue,null);assert.equal(queue.magnum.lastCopiedActor,"inan");assert.equal(queue.magnum.lastCopiedAbility,"calm");
const numeric=enter();numeric.magnum.hp=5;numeric.magnum.copyQueue={actorId:"epi-minos",abilityId:"snapshot",verb:"snapshotState",power:3,label:"아귀"};MagnumEngine._executeCopy(numeric);assert.equal(numeric.magnum.hp,7,"3의 70% 반올림은 2로 적용한다.");
const dampened=enter(["rumors-unshim","feathers-ari"]);dampened.rewards.mirrorDampenCharges=1;dampened.magnum.hp=5;dampened.magnum.copyQueue={actorId:"epi-minos",abilityId:"snapshot",verb:"snapshotState",power:3,label:"아귀"};MagnumEngine._executeCopy(dampened);assert.equal(dampened.magnum.hp,6,"감쇠된 수치 복제는 1만 적용한다.");
const binary=enter();binary.magnum.copyQueue={actorId:"mageuna",abilityId:"rule",verb:"declareRule",power:4,label:"마그나 카르타"};MagnumEngine._executeCopy(binary);assert.deepEqual(binary.mirroredAbilitySeal,{actorId:"mageuna",abilityId:"rule",untilRound:binary.round+1},"규칙 복제는 복제된 당사자의 해당 능력만 봉인한다.");

// 11-12. 불안정 결정론과 collapse 진입.
const deterministic=enter();deterministic.magnum.copyQueue={actorId:"hwayoung",abilityId:"absorb",verb:"absorbThreat",power:3,label:"사명의 이행"};MagnumEngine._executeCopy(deterministic);assert.equal(deterministic.magnum.instability,2,"조사 초기 불안정 1 + 첫 복제 1");deterministic.magnum.copyQueue={actorId:"inan",abilityId:"calm",verb:"stabilizeField",power:3,label:"강제 진정"};MagnumEngine._executeCopy(deterministic);assert.equal(deterministic.magnum.instability,4,"다른 모사로 교체하면 +2");assert.equal(deterministic.magnum.phase,"collapse");

// 13-18. 재구성 1회, 회복/불안정, 두 번째 0 또는 instability max에서 파열.
const reconstruct=enter(["gym-floor","camera"].map(id=>locations.find(x=>x.id===id).choices[0].id));MagnumEngine._damageBoss(reconstruct,99,"test");assert.equal(reconstruct.magnum.reconstructed,true);assert.equal(reconstruct.magnum.shattered,false);assert.equal(reconstruct.magnum.hp,Math.max(1,Math.ceil(reconstruct.magnum.maxHp*SEONGA_MAGNUM_EVENT.balance.reconstructionHpRatio)-2));assert.equal(reconstruct.magnum.instability,2);assert.equal(reconstruct.magnum.copyQueue,null);MagnumEngine._damageBoss(reconstruct,99,"test");assert.equal(reconstruct.magnum.shattered,true);assert.equal(reconstruct.magnum.phase,"shattered");
const instability=enter();MagnumEngine._increaseInstability(instability,instability.magnum.maxInstability,"test");assert.equal(instability.magnum.shattered,true);assert.equal(instability.magnum.copyQueue,null);

// 19-21. shattered에서는 보스 행동 중단, 모든 생존 캐릭터 제압 성공.
const stopped=enter();MagnumEngine._increaseInstability(stopped,99,"test");const stoppedSnapshot=JSON.stringify(stopped.members);assert.equal(MagnumEngine.bossAction(stopped),false);assert.equal(JSON.stringify(stopped.members),stoppedSnapshot);
for(const id of SEONGA_MAGNUM_EVENT.characterPool){const s=enter();s.partyIds=[id,"hwayoung","inan","kim-wooju"].filter((x,i,a)=>a.indexOf(x)===i).slice(0,4);while(s.partyIds.length<4)s.partyIds.push(["kang-unshim","epi-minos","mageuna","byeon-ari"].find(x=>!s.partyIds.includes(x)));s.order=[...s.partyIds];s.turn=s.partyIds.indexOf(id);s.magnum.shattered=true;s.magnum.phase="shattered";assert.ok(MagnumEngine.actions(s).some(a=>a.id===`finish:${id}`));assert.equal(MagnumEngine.finishBoss(s,id),true);assert.equal(s.phase,"success");}

// 22. 마근아 없는 기본 공격 루트도 성공.
const noMageuna=enter(["rumors-unshim","camera-wooju"],["hwayoung","kang-unshim","inan","kim-wooju"],"byeon-ari");let safety=30;while(noMageuna.phase==="battle"&&!noMageuna.magnum.shattered&&safety--){assert.equal(MagnumEngine.act(noMageuna,"attack"),true);}const noMageunaActions=30-safety;assert.ok(noMageuna.magnum.shattered);assert.equal(MagnumEngine.finishBoss(noMageuna,noMageuna.order[noMageuna.turn]),true);assert.equal(noMageuna.phase,"success");

// 23. 마근아 복제는 빠른 불안정과 강한 위험을 함께 만든다.
const mageuna=enter(undefined,["mageuna","hwayoung","inan","kim-wooju"]);mageuna.magnum.copyQueue={actorId:"mageuna",abilityId:"rule",verb:"declareRule",power:4,label:"마그나 카르타"};const beforeHp=mageuna.partyIds.reduce((n,id)=>n+mageuna.members[id].hp,0);MagnumEngine._executeCopy(mageuna);const afterHp=mageuna.partyIds.reduce((n,id)=>n+mageuna.members[id].hp,0);assert.equal(mageuna.magnum.instability,4);assert.ok(afterHp<beforeHp);mageuna.order=["mageuna","hwayoung","inan","kim-wooju"];mageuna.turn=0;assert.equal(MagnumEngine.actions(mageuna).find(a=>a.id==="rule").disabled,true);mageuna.turn=1;assert.equal(MagnumEngine.actions(mageuna).find(a=>a.id==="absorb").disabled,false,"2페이즈에서도 다른 캐릭터의 고유 능력은 사용 가능해야 한다.");

// 24. 전원 HP 0 실패.
const failure=enter();failure.partyIds=["hwayoung"];failure.order=["hwayoung"];failure.turn=0;failure.members.hwayoung.hp=1;assert.equal(MagnumEngine.act(failure,"attack"),true);assert.equal(failure.phase,"failure");
const passive=enter();let passiveActions=0;while(passive.phase==="battle"&&passiveActions<400){assert.equal(MagnumEngine.act(passive,"brace"),true);passiveActions++;}assert.equal(passive.phase,"failure","방호만 반복하는 실제 편성도 결국 철수해야 한다.");
const reckless=enter(["rumors-unshim","feathers-ari"],["kim-wooju","hwayoung","mageuna","kang-unshim"],"byeon-ari");let recklessActions=0;while(reckless.phase==="battle"&&!reckless.magnum.shattered&&recklessActions<120){const actor=reckless.order[reckless.turn],action=actor==="kang-unshim"?"spread":"brace";assert.equal(MagnumEngine.act(reckless,action),true);recklessActions++;}assert.equal(reckless.phase,"failure","강한 복제를 매 라운드 그대로 넘기는 경로는 실제 패배할 수 있어야 한다.");

// 28-30. 기존 세이브 호환, 사건 완료 후 해금 및 실제 roster 선택.
saved=JSON.stringify({completed:["endless-classroom","cafeteria-containment","library-reality-audit"],records:[{summary:"legacy"}]});assert.deepEqual(CampaignProgress.load(),{completed:["endless-classroom","cafeteria-containment","library-reality-audit"]});assert.ok(!CampaignProgress.unlockedCharacterIds().includes("magnum"));CampaignProgress.complete("magnum-mirroring-incident");assert.ok(CampaignProgress.unlockedCharacterIds().includes("magnum"));const unlocked=MagnumEngine.create();assert.ok(!MagnumEngine.availableCharacterIds().includes("magnum"));assert.equal(MagnumEngine.toggle(unlocked,"kim-wooju"),true);assert.equal(MagnumEngine.toggle(unlocked,"magnum"),false);assert.ok(!unlocked.partyIds.includes("magnum"));assert.equal(MagnumEngine.support(unlocked,"magnum"),false);

console.log(JSON.stringify({investigationCombinations:combinations,allInvestigationCombosClear:true,copyQueue:true,mirrorAdapters:Object.keys(MagnumEngine.mirrorAdapters),reconstruction:true,shatter:true,noMageunaClearActions:noMageunaActions,mageunaRisk:true,recklessFailureActions:recklessActions,passiveFailureActions:passiveActions,magnumSelectable:false},null,2));
