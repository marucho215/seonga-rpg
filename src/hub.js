"use strict";

const hub=document.querySelector("#hub"),progress=CampaignProgress.load();
const unlocked=CampaignProgress.unlockedCharacterIds().map(id=>SEONGA_CHARACTERS.find(c=>c.id===id)).filter(Boolean);
SEONGA_UI.ensureMinaTheme();
const iconMarkup=id=>SEONGA_UI.iconMarkup(id,"hub-character-watermark");
const incidentCards=CampaignProgress.eventCatalog.map(event=>{
  const done=progress.completed.includes(event.id),available=CampaignProgress.isUnlocked(event.id);
  return`<article class="approach-card ${available?"":"locked"}"><p class="chapter">사건 ${event.number} · ${done?"완료":available?"진행 가능":"잠김"}</p><h3>${event.title}</h3><p>${event.summary}</p>${available?`<a class="action-button primary" href="${event.href}">${done?"다시 대응":"사건 시작"}</a>`:`<p class="hint">${event.lockedHint}</p>`}</article>`;
}).join("");
const anyIncidentDone=progress.completed.length>0;

hub.innerHTML=`<section class="panel"><h2>사건 대응</h2><div class="approach-grid">${incidentCards}</div></section><section class="panel"><h2>대응 인원 · ${unlocked.length}명</h2><div class="character-grid">${unlocked.map(c=>`<article class="character-card accent-${c.id}">${iconMarkup(c.id)}<div class="character-card-head"><div><h3>${c.name}</h3><p class="role">${c.game.role}</p></div></div><p>${SEONGA_NEUTRAL_KITS[c.id].principle}</p>${anyIncidentDone&&SEONGA_UNLOCKS[c.id]?`<p class="source">해금: ${SEONGA_UNLOCKS[c.id].name}<br>${SEONGA_UNLOCKS[c.id].description}</p>`:""}</article>`).join("")}</div></section>`;
