"use strict";

window.SEONGA_DEBUG_ADAPTERS=(()=>{
  const configure=(state,party,support)=>{state.partyIds=[...party];if("supportId" in state)state.supportId=support;return state;};
  const beginInvestigation=(engine,state)=>engine.beginExplore?engine.beginExplore(state):engine.startExploration(state);
  const applyInvestigation=(engine,state,locationId,choiceId)=>{
    if(state.phase!=="exploration"&&!beginInvestigation(engine,state))return false;
    if(!engine.selectLocation(state,locationId)||!engine.investigate(state,choiceId))return false;
    while(engine.currentInteraction?.(state))engine.resolveInteraction(state,false);
    return true;
  };
  const investigate=(engine,event,state,count)=>{if(state.phase!=="exploration")beginInvestigation(engine,state);for(const location of event.investigations.slice(0,count))applyInvestigation(engine,state,location.id,location.choices[0].id);return state;};
  const adapters={
    "endless-classroom":{label:"사건 01",engine:GameEngine,event:SEONGA_TUTORIAL_EVENT,create:()=>GameEngine.createState(),enterBattle(state){GameEngine.startExploration(state);investigate(GameEngine,SEONGA_TUTORIAL_EVENT,state,2);GameEngine.startBattle(state);return state;},bossAction:null,phaseOptions:["party","briefing","exploration","battle","interlude","success","failure"],metrics:["round","threatPressure","stageIndex","stageProgress","supportCharges"]},
    "cafeteria-containment":{label:"사건 02",engine:CafeteriaEngine,event:SEONGA_CAFETERIA_EVENT,create:()=>CafeteriaEngine.create(),enterBattle(state){investigate(CafeteriaEngine,SEONGA_CAFETERIA_EVENT,state,2);CafeteriaEngine.start(state);return state;},bossAction:null,phaseOptions:["party","briefing","exploration","battle","interlude","success","failure"],metrics:["round","spread","time","stage","progress","supportUses"]},
    "library-reality-audit":{label:"사건 03",engine:LibraryEngine,event:SEONGA_LIBRARY_EVENT,create:()=>LibraryEngine.create(),enterBattle(state){investigate(LibraryEngine,SEONGA_LIBRARY_EVENT,state,3);LibraryEngine.start(state);return state;},bossAction:null,phaseOptions:["party","briefing","exploration","battle","success","failure"],metrics:["round","stability","minaLoad","patternStep","supportUses"]},
    "magnum-mirroring-incident":{label:"사건 04",engine:MagnumEngine,event:SEONGA_MAGNUM_EVENT,create:()=>MagnumEngine.create(),enterBattle(state){investigate(MagnumEngine,SEONGA_MAGNUM_EVENT,state,2);MagnumEngine.start(state);return state;},bossAction:state=>MagnumEngine.bossAction(state),phaseOptions:["party","briefing","exploration","battle","success","failure"],metrics:["round","supportUses","stageActions"]}
  };
  for(const adapter of Object.values(adapters)){
    adapter.configure=(state,party,support)=>configure(state,party,support);
    adapter.applyInvestigation=(state,locationId,choiceId)=>applyInvestigation(adapter.engine,state,locationId,choiceId);
  }
  return adapters;
})();
