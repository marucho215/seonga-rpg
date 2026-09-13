"use strict";

window.SEONGA_CAFETERIA_EVENT = {
  id: "cafeteria-containment",
  title: "검은 거품이 넘치는 급식동",
  briefing: "배식 종료 직후 급식동 배수구에서 검은 거품이 역류한다. 거품은 사람보다 환풍기와 배식 카트를 따라 이동하며, 급식실·복도·창고를 동시에 잠그려 한다. 제한 시간 안에 확산 경로를 읽고 무엇을 먼저 지킬지 결정해야 한다.",
  characterPool: ["hwayoung", "kang-unshim", "epi-minos", "inan", "kim-wooju", "mageuna", "byeon-ari", "josangmin"],
  rules: { partySize:4, investigationLimit:2, supportCharges:2, failureSpread:8 },
  clueInfo: {
    flow:{label:"거품의 역류 성분",result:"진입 전에 역류점의 힘을 빼 초기 확산을 낮춘다."},
    current:{label:"배관 흐름 지도",result:"첫 분류 작업의 시작점을 미리 특정한다."},
    timing:{label:"최초 목격 시각",result:"각 구간에서 쓸 수 있는 대응 시간이 늘어난다."},
    testimony:{label:"안정된 조리원 진술",result:"조리원 대피를 택하면 첫 대피조가 이미 준비된다."},
    supplies:{label:"보존 가능 식자재 목록",result:"식자재 보존 우선 경로를 선택할 수 있다."},
    sanitation:{label:"무균 격리선",result:"식자재 보존 경로를 열고 격리 작업의 초기 확산을 낮춘다."},
    vents:{label:"환풍 연쇄도",result:"첫 봉쇄의 반동을 없애고 다음 위험 경로를 표시한다."},
    access:{label:"실제 점검 통로",result:"첫 봉쇄의 반동을 줄일 안전한 진입점을 확보한다."}
  },
  investigations: [
    {id:"drain",label:"급식실 배수구",prompt:"거품이 솟는 배수구와 연결 배관을 가까이서 확인한다.",choices:[
      {id:"drain-purify",owner:"byeon-ari",label:"오염 성분을 직접 박리해 판별한다",clue:"flow",approach:"아리가 배수구 표면의 검은 막을 층별로 벗겨, 진입 전에 약화할 수 있는 역류점을 찾는다.",expectation:"초기 확산 억제에 유리",result:"장갑 끝으로 검은 막을 한 겹씩 벗겨 역류의 핵을 분리했다.",quote:"이건 닦으면 번져요. 가브리엘, 배수구 안쪽부터 벗겨내세요."},
      {id:"drain-scan",owner:"kim-wooju",label:"흐름 센서로 배관 분기를 추적한다",clue:"current",approach:"우주가 배관 센서의 잡음을 지우고 거품이 가장 먼저 차오를 분류 지점을 표시한다.",expectation:"첫 구간 목표 진행에 유리",result:"센서 노이즈를 걷어내고 거품이 먼저 차오를 분기를 표시했다.",quote:"저건 안 만져요. 센서만 넣을게요. 배관 그림 뜨면 그걸로 끝내죠."}
    ]},
    {id:"staff",label:"대피하지 못한 조리원",prompt:"서로 다른 방향을 가리키는 조리원들의 기억을 정리한다.",choices:[
      {id:"staff-crosscheck",owner:"kang-unshim",label:"목격 시각과 동선을 교차검증한다",clue:"timing",approach:"운심이 엇갈린 증언에서 최초 목격 시각을 찾아 아직 안전한 대응 시간대를 계산한다.",expectation:"각 구간의 제한 시간 확보",result:"겹치는 증언에서 최초 역류 시각과 아직 안전한 시간대를 골라냈다.",quote:"한 명씩! 처음 본 시각, 서 있던 자리. 영상 있으면 바로 보내고!"},
      {id:"staff-calm",owner:"inan",label:"호흡을 안정시킨 뒤 진술을 받는다",clue:"testimony",approach:"이난이 패닉 상태의 조리원을 진정시켜 비상문 열쇠와 대피조 위치를 확인한다.",expectation:"조리원 대피 우선 루트에 유리",result:"패닉이 가라앉은 조리원이 비상문 열쇠와 대피조 위치를 정확히 짚었다.",quote:"숨 네 번만 쉬어요. 그래도 말이 안 나오면 라파엘이 조금 진정시킬 거예요. 아주 조금."}
    ]},
    {id:"inventory",label:"식자재 창고와 장부",prompt:"오염되기 시작한 창고에서 살릴 수 있는 물자를 가려낸다.",choices:[
      {id:"inventory-archive",owner:"epi-minos",label:"장부와 현재 배치를 한 장면으로 보존한다",clue:"supplies",unlocksPriority:"supplies",approach:"에피가 장부와 선반의 현재 배치를 함께 저장해, 버리기 전 격리할 품목을 가려낸다.",expectation:"식자재 보존 우선 루트 해금",result:"카오가 장부와 선반 배치를 함께 삼켜 격리 가능한 품목을 남겼다.",quote:"버릴 거면 먼저 보여줘. 장부도 선반도 카오한테 넣어둘래."},
      {id:"inventory-line",owner:"byeon-ari",label:"무균선 안쪽의 품목을 재분류한다",clue:"sanitation",unlocksPriority:"supplies",approach:"아리가 선반 사이에 무균선을 긋고 오염이 닿기 전에 옮길 순서를 정한다.",expectation:"식자재 보존 우선 루트 해금·초기 격리 안정",result:"오염 경계가 선반 사이에 그어지고 보존 작업의 순서가 정리됐다.",quote:"선 안은 아직 식재료예요. 선 밖은 처리 대상이고요."}
    ]},
    {id:"vent",label:"환풍기와 천장 점검구",prompt:"창고와 복도를 잇는 환풍 경로가 검게 물들고 있다.",choices:[
      {id:"vent-predict",owner:"kim-wooju",label:"도면과 실제 기류를 겹쳐 본다",clue:"vents",approach:"우주가 도면과 실제 기류를 겹쳐, 한 경로를 막았을 때 압력이 튈 다음 경로를 계산한다.",expectation:"마지막 봉쇄 순서 판단에 유리",result:"한 경로를 막을 때 압력이 튈 다음 경로까지 계산했다.",quote:"막으면 옆이 터져요. 순서 표시할게요. 빨간 선은 밟지 마세요."},
      {id:"vent-walk",owner:"hwayoung",label:"점검 통로를 직접 통과해 확인한다",clue:"access",approach:"화영이 좁은 점검 통로를 직접 지나 봉쇄 장비를 미리 고정할 수 있는 자리를 찾는다.",expectation:"마지막 첫 봉쇄의 안전 확보",result:"휘어진 점검 통로를 지나 봉쇄 장비를 들일 수 있는 자리를 확보했다.",quote:"도면보다 좁구려. 소인이 한 번 지나가 길을 내겠소."}
    ]}
  ],
  stages: [
    {title:"오염 경로 분류",needed:4,time:4,intro:"검은 거품이 바닥의 낮은 곳을 골라 세 갈래로 나뉜다. 확산을 누르기만 하면 다른 배관으로 숨어드니, 먼저 이동 원리를 분류해야 한다."},
    {title:"서로 다른 우선순위",needed:4,time:4,intro:"복도 쪽 거품과 창고 쪽 거품이 동시에 불어난다. 조리원을 먼저 빼면 식자재가 노출되고, 창고를 먼저 격리하면 대피 시간이 빠듯해진다."},
    {title:"이동 봉쇄선 구축",needed:3,time:4,intro:"핵은 약해졌지만 세 경로가 서로 압력을 넘기기 시작한다. 어느 길을 먼저 준비하고 막을지에 따라 다음 길의 위험이 달라진다."}
  ],
  priorities: {
    staff:{label:"조리원 대피 우선",primaryLabel:"조리원 대피",primaryNeeded:4,secondaryLabel:"식자재 응급 격리",secondaryNeeded:2,secondaryRequired:false,time:4,description:"대피 4회를 끝내면 즉시 다음 구간으로 간다. 식자재를 남기면 마지막 배식 카트 경로가 크게 위험해진다."},
    supplies:{label:"식자재 보존 우선",primaryLabel:"식자재 격리",primaryNeeded:3,secondaryLabel:"조리원 대피",secondaryNeeded:2,secondaryRequired:true,time:3,description:"격리 3회와 대피 2회를 모두 끝내야 한다. 시간이 매우 빠듯하지만 완료하면 마지막 세 경로의 진입 위험이 낮아진다."}
  },
  routes: [
    {id:"drain",label:"급식실 배수구",risk:2,agitates:"vent"},
    {id:"cart",label:"복도 배식 카트",risk:3,agitates:"drain"},
    {id:"vent",label:"창고 환풍구",risk:3,agitates:"cart"}
  ],
  patterns:[
    {id:"surge",label:"역류 가속",description:"목표 진행·복합 행동·봉쇄는 확산을 1 더 일으킨다."},
    {id:"coagulation",label:"응고막",description:"압력 감소·복합 행동의 확산 억제량이 1 줄어든다."},
    {id:"hunger",label:"경로 포식",description:"정보·장면·행동 비축과 사전 고정은 확산을 1 일으킨다."}
  ],
  abilities: {
    hwayoung:[
      {id:"absorb",verb:"absorbThreat",label:"사명의 이행 · 충격 인수",description:"확산 -2, 열량 +1.",quote:"이쪽으로 오시오. 받을 자리는 소인이 정하겠소."},
      {id:"distributed",verb:"blockRisk",label:"해금 · 분산 방호",description:"열량 2를 써 다음 라운드 확산 반동을 차단한다.",cost:{heat:2},quote:"받아 둔 열이 있소. 이번 파도는 여기서 끊겠소."}
    ],
    "kang-unshim":[
      {id:"intel",verb:"gatherIntel",label:"현장 반응 수집",description:"정보 +1.",quote:"잠깐, 지금 튀는 방향 캡처 다 떴어. 이거 묶어서 올리면 반응 온다."},
      {id:"swing",verb:"swingSituation",label:"화제 전환",description:"정보 2를 써 현재 주 목표 +2, 확산 +2.",cost:{info:2},quote:"동선 뿌렸어! 다들 지금 표시된 쪽만 밀어!"},
      {id:"trace",verb:"storeMomentum",label:"해금 · 최초 발화자 역추적",description:"정보 1을 써 구간당 한 번 남은 시간 +1.",cost:{info:1},once:"traceUsed",quote:"최초 신고 시각 잡았다. 아직 한 번 더 움직일 틈 있어!"}
    ],
    "epi-minos":[
      {id:"snapshot",verb:"snapshotState",label:"아귀 · 오염 장면 보존",description:"장면 +1. 장면은 다음 구간에도 남는다.",quote:"카오, 이 흐름 먹어. 다음 방에서도 꺼내게."},
      {id:"restore",verb:"restoreState",label:"보존 장면 복원",description:"장면 2를 써 확산 -1, 현재 주 목표 +1.",cost:{memory:2},quote:"카오, 아까 덜 번진 장면 꺼내. 여기다 겹쳐 놓을래."}
    ],
    inan:[
      {id:"calm",verb:"stabilizeField",mode:"lower",label:"강제 진정 · 현장 안정화",description:"확산 -2. 다음 자기 차례까지 재정비.",cooldown:"cool",quote:"신경계가 있으면 마비시키면 편한데요. 없네요. 일단 눌러볼게요."},
      {id:"cold-zone",verb:"stabilizeField",mode:"block",label:"해금 · 저체온 구역",description:"다음 라운드 확산 반동을 한 번 차단한다.",quote:"바닥 온도 내릴게요. 넘어지면 라파엘이 잡습니다. 촉수가 좀 차가워요."}
    ],
    "kim-wooju":[
      {id:"analyze",verb:"analyze",label:"노이즈 캔슬링 · 경로 최적화",description:"현재 주 목표 +1, 확산 -1. 다음 자기 차례까지 방전.",cooldown:"cool",quote:"노이즈 껐어요. 초록색 선 하나만 봐요. 나머지는 저도 보기 싫어요."},
      {id:"predict",verb:"unlockRoute",label:"해금 · 예측 경로",description:"다음 봉쇄 반동 -1, 이어서 위험해질 경로를 표시한다.",stages:[2],once:"prediction",quote:"다음 튀는 곳까지 보였어요. 지금 순서 바꾸면 덜 아파요."}
    ],
    mageuna:[
      {id:"rule",verb:"declareRule",label:"마그나 카르타 · 통행 규정",description:"집행 1회를 써 다음 라운드 확산 반동을 차단한다.",ruleCost:1,quote:"통행 규정 위반입니다. 해당 경로를 즉시 폐쇄합니다."}
    ],
    "byeon-ari":[
      {id:"purify",verb:"purify",label:"성역 재건",description:"확산 -3, 자신의 HP -1. 사용 뒤 다음 자기 차례까지 재정비.",hpCost:1,cooldown:"cool",quote:"가브리엘, 검은 부분만 도려내세요. 제 손은 끝나고 소독하겠습니다."}
    ],
    josangmin:[
      {id:"conserve",verb:"conserveAction",label:"움직임 보류",description:"비축 +1.",quote:"지금 쓰면 또 움직여야 하잖아. 모아둘래."},
      {id:"decisive-progress",verb:"decisiveIntervention",mode:"progress",label:"결정적 개입 · 목표 가속",description:"비축 1을 써 현재 주 목표 +2.",cost:{effort:1},quote:"두 번 움직일 걸 한 번에 끝내."},
      {id:"decisive-contain",verb:"decisiveIntervention",mode:"contain",label:"결정적 개입 · 확산 억제",description:"비축 1을 써 확산 -3.",cost:{effort:1},quote:"저것만 자르면 조용해져. 먐먀."}
    ]
  },
  supportAdapters: {
    hwayoung:{verb:"blockRisk",label:"문 고정",description:"확산 4 이상일 때 다음 라운드 말 확산과 침식 반동을 한 번 차단한다.",minSpread:4,sourceLabel:"화영의 문 고정"},
    "kang-unshim":{verb:"swingSituation",mode:"support",label:"긴급 확산",description:"1·2단계 주 목표 +1과 확산 +1. 마지막 구간에는 안전 봉쇄 1회를 만든다."},
    "epi-minos":{verb:"restoreState",mode:"support-time",label:"장면 되감기",description:"남은 시간이 2라운드 이하일 때 확산 +1을 감수하고 시간 +1.",maxTime:2,spreadCost:1},
    inan:{verb:"stabilizeField",mode:"support",amount:1,label:"원격 진정",description:"확산 4 이상일 때 확산도를 1 낮춘다.",minSpread:4},
    "kim-wooju":{verb:"unlockRoute",mode:"support",label:"후방 드론",description:"마지막 구간에서 확산 +1을 감수하고 다음 봉쇄 반동 -1.",stages:[2],spreadCost:1},
    mageuna:{verb:"declareRule",label:"긴급 규정",description:"확산 4 이상일 때 공유 집행 1회를 써 다음 라운드 반동을 차단한다.",minSpread:4,ruleCost:1,sourceLabel:"마근아의 긴급 통행 규정"},
    "byeon-ari":{verb:"purify",mode:"support",amount:2,label:"이동 소독",description:"확산 4 이상일 때 확산도를 2 낮춘다.",minSpread:4},
    josangmin:{verb:"conserveAction",mode:"support",label:"최소 개입",description:"남은 시간 1을 써 다음 주 목표 +1 또는 다음 봉쇄 반동 -1을 비축한다.",minTime:2,timeCost:1}
  },
  dialogue: {
    briefing:{
      hwayoung:"바닥을 타고 도망다니는 놈이구려. 좋소. 소인이 앞에서 길부터 밟아두겠소.",
      "kang-unshim":"영상 세 개가 동선이 다 달라. 원본 제보부터 까보자. 재업은 나중에.",
      "epi-minos":"버리기 전에 보여줘. 오염되기 전 배치도 같이 가져갈래.",
      inan:"사람부터 빼죠. 거품은 숨 안 쉬잖아요. 급하면 라파엘로 들고 나가도 되고요.",
      "kim-wooju":"환풍기, 배수구, 카트… 세 개 다 보기 싫어요. 두 군데만 찍어서 경로 줄일게요.",
      mageuna:"급식동 임시 폐쇄를 선언합니다. 출입 경로는 제 지시에 맞추십시오.",
      "byeon-ari":"급식실 안으로 들어오실 거면 제 선 안에서만 움직이세요. 검은 거품 밟으면 신발부터 버립니다.",
      josangmin:"전부 쫓아다니진 마. 서로 만나는 길만 끊으면 되잖아."
    },
    priorityStaff:[
      {id:"byeon-ari",text:"사람이 빠질 때까지 통로는 제가 소독해 둘게요. 창고 쪽은 오래 못 버텨요."},
      {id:"mageuna",text:"대피 인원을 우선 집계합니다. 미확인자는 남기지 마십시오."}
    ],
    prioritySupplies:[
      {id:"josangmin",text:"창고부터 막아. 지금 귀찮게 해두면 나중에 덜 움직여."},
      {id:"inan",text:"대피조 위치는 확인했어요. 창고부터 끝내죠. 늦으면 라파엘로 사람을 묶어서 데리고 나갈게요."}
    ],
    transitions:[
      [{id:"kim-wooju",text:"세 갈래로 고정됐어요. 이제 하나를 택하면 다른 쪽이 움직여요."},{id:"hwayoung",text:"시간이 모자라오. 어느 쪽부터 갈지 정하시오. 소인이 앞장서겠소."}],
      [{id:"mageuna",text:"세 경로가 서로 압력을 전가합니다. 봉쇄 순서를 기록하십시오."},{id:"byeon-ari",text:"그대로 막지 마세요. 거품이 옆 통로로 밀립니다. 제가 닦은 선부터 잠그죠."}]
    ],
    ending:{
      hwayoung:"세 길 모두 잠잠하오. 배식 카트도 다시 제자리로 돌아왔구려.",
      "kang-unshim":"사진은 올리지 마. 조리원들 무사하다는 공지만 먼저 뿌릴게.",
      "epi-minos":"손실된 거 표시했어. 장부랑 배치도는 카오가 갖고 있고.",
      inan:"맥박은 다 봤어요. 남은 사람부터 확인하죠. 거절하면 라파엘로 잡을게요.",
      "kim-wooju":"환풍기 신호 정상. 이제 냄새 알림도… 꺼도 되죠?",
      mageuna:"봉쇄 시각과 손실 항목을 기록했습니다. 재개방은 점검 후입니다.",
      "byeon-ari":"재개방 전에 전부 두 번씩 소독하겠습니다. 내일 아침 배식은 그대로 해요.",
      josangmin:"세 번 막았으면 됐지. 남은 정리는… 깨어나면 할게."
    }
  }
};
