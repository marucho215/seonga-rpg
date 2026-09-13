"use strict";

window.SEONGA_NEUTRAL_KITS = {
  hwayoung:{principle:"받은 위협을 자원으로 전환",verbs:["absorbThreat","blockRisk","releaseStoredForce"]},
  "kang-unshim":{principle:"정보와 반응을 축적해 상황을 크게 변화",verbs:["gatherIntel","storeMomentum","swingSituation"]},
  "epi-minos":{principle:"장면과 상태를 저장한 뒤 복원·재사용",verbs:["snapshotState","restoreState","reuseInformation"]},
  inan:{principle:"보호 대상과 상황을 빠르게 안정화",verbs:["stabilizeTarget","removeCondition","stabilizeField"]},
  "kim-wooju":{principle:"분석을 통해 경로와 효율적인 선택을 개방",verbs:["analyze","unlockRoute","improveEfficiency"]},
  mageuna:{principle:"합당한 규칙을 선언해 위험 행동을 제한",verbs:["declareRule","blockRisk","controlTiming"],limit:3},
  "byeon-ari":{principle:"오염을 제거하고 안전 구역을 만드는 대신 부담 축적",verbs:["purify","createSafeZone","takeBurden"]},
  josangmin:{principle:"행동을 보류해 최소 동작의 결정적 개입으로 전환",verbs:["conserveAction","amplifyNextAction","decisiveIntervention"]},
  "jegal-mina":{principle:"주장한 정보를 현실에 덮어쓰기",verbs:["overwriteReality"]},
  magnum:{principle:"타인의 외형과 능력을 약화된 형태로 훔쳐 사용",verbs:["envyStrike","mirrorAbility"]}
};

window.SEONGA_UNLOCKS = {
  hwayoung:{id:"distributed-guard",name:"분산 방호",description:"축적 열량 2를 소비해 다음 라운드 종료의 확산 반동을 한 번 차단한다."},
  "kang-unshim":{id:"source-trace",name:"최초 발화자 역추적",description:"정보 1을 소비해 구간당 한 번 남은 대응 시간을 1라운드 늘린다."},
  "epi-minos":{id:"selective-archive",name:"선별 보존",description:"저장한 장면 중 하나를 다음 구간까지 유지한다."},
  inan:{id:"cold-zone",name:"저체온 구역",description:"즉시 안정화 대신 다음 라운드 종료의 확산 반동을 한 번 차단한다."},
  "kim-wooju":{id:"predictive-route",name:"예측 경로",description:"다음 봉쇄가 일으킬 연쇄 위험을 표시하고 그 봉쇄 반동을 1 줄인다."}
};
