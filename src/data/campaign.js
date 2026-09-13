"use strict";
window.CampaignProgress={
  key:"seonga-rpg-progress-v1",
  rosterUnlocks:{
    initial:["hwayoung","kang-unshim","epi-minos","inan","kim-wooju"],
    "endless-classroom":["mageuna","byeon-ari","josangmin"],
    "library-reality-audit":["jegal-mina"]
  },
  load(){try{const data=JSON.parse(localStorage.getItem(this.key))||{};return{...data,completed:Array.isArray(data.completed)?data.completed:[],records:Array.isArray(data.records)?data.records:[]};}catch{return{completed:[],records:[]};}},
  save(data){localStorage.setItem(this.key,JSON.stringify(data));},
  complete(eventId,summary){const data=this.load();if(!data.completed.includes(eventId))data.completed.push(eventId);data.records.unshift({eventId,summary,date:new Date().toLocaleDateString("ko-KR")});data.records=data.records.slice(0,12);this.save(data);},
  isUnlocked(eventId){const completed=this.load().completed;if(eventId==="endless-classroom")return true;if(eventId==="cafeteria-containment")return completed.includes("endless-classroom");if(eventId==="library-reality-audit")return completed.includes("cafeteria-containment");return false;},
  unlockedCharacterIds(){const completed=this.load().completed;return Object.entries(this.rosterUnlocks).flatMap(([gate,ids])=>gate==="initial"||completed.includes(gate)?ids:[]).filter((id,index,all)=>all.indexOf(id)===index);}
};
