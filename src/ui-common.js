"use strict";

window.SEONGA_UI=(()=>{
  const iconPaths={hwayoung:"assets/icons/hwayoung.png","kang-unshim":"assets/icons/kang-unshim.png","epi-minos":"assets/icons/epi-minos.png",inan:"assets/icons/inan.png","kim-wooju":"assets/icons/kim-wooju.png",mageuna:"assets/icons/mageuna.png","byeon-ari":"assets/icons/byeon-ari.png",josangmin:"assets/icons/josangmin.png","jegal-mina":"assets/icons/jegal-mina.png"};
  const iconMarkup=(id,className="char-icon")=>iconPaths[id]?`<img class="${className}" src="${iconPaths[id]}" alt="" aria-hidden="true">`:"";
  const button=(label,action,{disabled=false,description="",primary=false,classes=""}={})=>`<button type="button" class="action-button ${primary?"primary":""} ${classes}" data-action="${action}" ${disabled?"disabled":""}><strong>${label}</strong>${description?`<small>${description}</small>`:""}</button>`;
  function ensureMinaTheme(){if(document.querySelector('link[data-seonga-jegal-mina-theme]'))return;const link=document.createElement("link");link.rel="stylesheet";link.href="assets/jegal-mina-theme.css";link.dataset.seongaJegalMinaTheme="";document.head.append(link);}
  function bundleEffects(events){const bundled=[];for(const item of events){const previous=bundled[bundled.length-1];if(item.type==="effect"&&previous?.type==="effect"){previous.items.push(item);previous.text=previous.items.map(x=>x.text).join(" · ");if(["danger","damage"].includes(item.tone))previous.tone=item.tone;}else bundled.push(item.type==="effect"?{...item,items:[item]}:item);}return bundled;}
  function createPresentation({event,getEvents,render,setLocked=()=>{}}){
    let active=null,locked=false,queue=[];
    function markup(){if(!active)return"";const x=active,kind=x.type||"narration",commonTone=["damage","danger","success","warning"].includes(x.tone),accentId=x.accent||(!commonTone&&event.characterPool.includes(x.source)?x.source:""),accent=accentId?` accent-${accentId}`:"",tone=x.tone?` tone-${x.tone}`:"",body=kind==="effect"&&x.items?`<ul>${x.items.map(item=>`<li>${item.text}</li>`).join("")}</ul>`:`<strong>${kind==="dialogue"?`“${x.text}”`:x.text}</strong>`;return`<aside class="presentation-layer ${kind}${accent}${tone}" aria-live="assertive">${kind==="dialogue"?iconMarkup(accentId,"presentation-watermark"):""}<span class="presentation-kind">${kind==="dialogue"?x.speaker:kind==="effect"?"RESULT":"SCENE"}</span><div class="presentation-body">${body}</div><button type="button" class="presentation-next" data-action="presentation-next">계속 <b>›</b></button></aside>`;}
    function changeLock(value){locked=value;setLocked(value);}
    function advance(){if(!queue.length){active=null;changeLock(false);render();return;}active=queue.shift();render();}
    function play(){queue.push(...bundleEffects(getEvents()));if(window.SEONGA_TEST_INSTANT_PRESENTATION){queue=[];active=null;changeLock(false);render();return;}if(locked||!queue.length){render();return;}changeLock(true);advance();}
    function flush(){queue=[];getEvents();active=null;changeLock(false);render();}
    return{markup,advance,play,flush,isLocked:()=>locked};
  }
  return{iconPaths,iconMarkup,button,ensureMinaTheme,bundleEffects,createPresentation};
})();
