"use strict";
window.CampaignProgress={
  key:"seonga-rpg-progress-v1",
  eventCatalog:[
    {id:"endless-classroom",number:"01",title:"방과 후의 끝나지 않는 수업",href:"tutorial.html",summary:"반복 현상 속 학생을 보호하고 원인을 복원한 뒤 안전하게 이탈시킨다.",requires:null,lockedHint:""},
    {id:"cafeteria-containment",number:"02",title:"검은 거품이 넘치는 급식동",href:"cafeteria.html",summary:"제한 시간 안에 오염 경로를 분류하고, 서로 충돌하는 구역 목표의 우선순위를 정한다.",requires:"endless-classroom",lockedHint:"첫 사건을 해결하면 개방됩니다."},
    {id:"library-reality-audit",number:"03",title:"존재하지 않는 도서관 정상 운영 안내",href:"library.html",summary:"세 종류의 증거를 대조하고, 덮어쓴 현실을 원래 사실에 다시 고정한다.",requires:"cafeteria-containment",lockedHint:"두 번째 사건을 해결하면 개방됩니다."},
    {id:"magnum-mirroring-incident",number:"04",title:"천사는 그런 얼굴을 하지 않는다",href:"magnum.html",summary:"마지막 고유 능력을 따라 하는 매그넘의 미러링을 흔들어 체육관에서 제압한다.",requires:"library-reality-audit",lockedHint:"세 번째 사건을 해결하면 개방됩니다."}
  ],
  rosterUnlocks:{
    initial:["hwayoung","kang-unshim","epi-minos","inan","kim-wooju"],
    "endless-classroom":["mageuna","byeon-ari","josangmin"],
    "library-reality-audit":["jegal-mina"],
    "magnum-mirroring-incident":["magnum"]
  },
  load(){try{const data=JSON.parse(localStorage.getItem(this.key))||{},completed=Array.isArray(data.completed)?data.completed:[];return{completed};}catch{return{completed:[]};}},
  save(data){localStorage.setItem(this.key,JSON.stringify(data));},
  complete(eventId){const data=this.load();if(!data.completed.includes(eventId))data.completed.push(eventId);this.save(data);},
  eventInfo(eventId){return this.eventCatalog.find(x=>x.id===eventId)||null;},
  isUnlocked(eventId){const info=this.eventInfo(eventId);return Boolean(info&&(!info.requires||this.load().completed.includes(info.requires)));},
  unlockedCharacterIds(){const completed=this.load().completed;return Object.entries(this.rosterUnlocks).flatMap(([gate,ids])=>gate==="initial"||completed.includes(gate)?ids:[]).filter((id,index,all)=>all.indexOf(id)===index);},
  availableCharacterIds(eventId,characterPool=[]){if(!this.eventInfo(eventId))return[];const unlocked=new Set(this.unlockedCharacterIds());return characterPool.filter(id=>unlocked.has(id));}
};
