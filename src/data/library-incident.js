"use strict";

window.SEONGA_LIBRARY_EVENT={
  id:"library-reality-audit",
  title:"존재하지 않는 도서관 정상 운영 안내",
  briefing:"도서관 폐관 점검 중 서로 모순되는 안내가 동시에 현실이 되었다. 출입 인원, 피난 동선, 최초 오염 원인을 기록과 현장으로 대조하고, 제갈 미나의 현실 덮어쓰기가 더 번지기 전에 세 사실을 원본에 고정해야 한다.",
  characterPool:["hwayoung","kang-unshim","epi-minos","inan","kim-wooju","mageuna","byeon-ari","josangmin"],
  rules:{partySize:4,investigationLimit:3,supportCharges:2,maxStability:7,maxMinaLoad:5,maxReinvestigationsPerFact:2,rejudgmentCost:"action"},
  stabilityThresholds:{
    stable:{min:6,max:7,rewriteLoad:0,corruptionBoost:0},
    unstable:{min:4,max:5,rewriteLoad:1,corruptionBoost:0},
    distorted:{min:2,max:3,rewriteLoad:1,corruptionBoost:1},
    critical:{min:1,max:1,rewriteLoad:1,corruptionBoost:2},
    collapsed:{min:0,max:0,rewriteLoad:0,corruptionBoost:0}
  },
  factEffectRules:{
    studentCount:{stateKey:"phantomTargets",initial:1,rewriteIncrease:1,description:"복구·검증 행동을 가짜 이용자가 순서대로 가로챈다."},
    exitRoute:{stateKey:"routeRisk",initial:1,rewriteIncrease:1,description:"F2 핵심 증거 복구 요구량을 늘린다."},
    origin:{stateKey:"correctionBacklash",initial:0,rewriteIncrease:1,lockLoad:1,description:"원인 추적·현실 고정 시 미나 처리 부하가 추가된다."}
  },
  facts:{
    studentCount:{label:"F1 · 실제 인원",truth:"3명",current:"5명",claims:[{value:"3명",label:"세 명으로 판정"},{value:"5명",label:"다섯 명으로 판정"}],anchors:["counter-memory","official-record"],verify:[["access-log","witness-time"],["access-log","shared-result"],["counter-memory","official-record"]],lock:[["counter-memory","official-record"]],effect:"가짜 이용자 둘이 보호·확인 대상을 가로챈다."},
    exitRoute:{label:"F2 · 안전 동선",truth:"북측 비상구",current:"서측 서가",claims:[{value:"북측 비상구",label:"북측 비상구를 원본으로 판정"},{value:"서측 서가",label:"서측 서가를 원본으로 판정"}],anchors:["physical-route","evacuation-rule"],verify:[["physical-route","evacuation-rule"],["index-mismatch","physical-route"],["official-record","evacuation-rule"]],lock:[["physical-route","evacuation-rule"]],effect:"서쪽에 생긴 가짜 출구가 현장 동선을 비튼다."},
    origin:{label:"F3 · 최초 오염",truth:"미나의 최초 오발",current:"검색 DB 오류",claims:[{value:"미나의 최초 오발",label:"미나의 최초 발언이 원인"},{value:"검색 DB 오류",label:"검색 DB 오류가 원인"}],anchors:["first-statement","mina-load"],verify:[["first-statement","mina-load"],["index-mismatch","first-statement"]],partial:[["witness-time","shared-result"]],lock:[["first-statement","mina-load"]],effect:"원인을 DB 오류로 돌리는 정정 요청이 미나의 부하를 키운다."}
  },
  conflicts:{
    studentCount:[{requires:["access-log","shared-result"],observations:["유효한 출입 서명 3건","현재 화면과 공유 캡처의 이용자 5명"]}],
    exitRoute:[{requires:["physical-route","index-mismatch"],observations:["북측 통로의 외기와 계단 하중","서측을 출구로 표시하는 현재 검색 결과"]}],
    origin:[{requires:["first-statement","index-mismatch"],observations:["미나 발언 직후 변경된 출입 표시","그보다 늦은 검색 DB 수정 시각"]}]
  },
  lockConsequences:{
    studentCount:{benefit:"clear-phantoms",cost:"raise-route-risk",description:"가짜 이용자는 사라지지만 미고정 공간 오염이 강화된다."},
    exitRoute:{benefit:"clear-route-risk",cost:"raise-origin-pressure",description:"현장 접근은 안전해지지만 미고정 원인 정정의 부하가 커진다."},
    origin:{benefit:"mitigate-late-patterns",cost:"first-lock-load",costValue:2,description:"후반 오류 강도는 낮아지지만 첫 고정이면 미나 부하가 즉시 오른다."}
  },
  evidenceInfo:{
    "access-log":{label:"출입 로그",quality:"standard",qualityLabel:"검증 자료",kind:"system",sourceCharacter:"kim-wooju",facts:["studentCount","origin"],summary:"해당 시간대에 유효한 출입 서명은 세 건이다. 현재 화면에는 다섯 명이 표시된다."},
    "witness-time":{label:"제보 시각 대조",quality:"support",qualityLabel:"보조 자료",kind:"testimony",sourceCharacter:"kang-unshim",facts:["studentCount","origin"],summary:"서로 다른 제보의 문장이 같은 시각에 ‘다섯 명’으로 바뀌었다."},
    "counter-memory":{label:"오염 전 대출대 장면",quality:"anchor",qualityLabel:"핵심 증거",kind:"archive",sourceCharacter:"epi-minos",facts:["studentCount","origin"],summary:"보존 장면에는 대출대 앞 세 개의 학생 실루엣과 비어 있는 두 자리의 표식이 함께 남아 있다."},
    "official-record":{label:"공식 이용 기록",quality:"anchor",qualityLabel:"핵심 증거",kind:"record",sourceCharacter:"mageuna",facts:["studentCount","exitRoute"],summary:"직인 문서에는 이용 서명 세 칸과 북측 피난도 승인 번호가 기록돼 있다."},
    "physical-route":{label:"실제 통과 동선",quality:"anchor",qualityLabel:"핵심 증거",kind:"physical",sourceCharacter:"hwayoung",facts:["exitRoute"],summary:"북측 통로에서 외기와 계단 하중이 확인된다. 서측 문 너머에서는 벽면 반사음만 돌아온다."},
    "evacuation-rule":{label:"공식 피난 규정",quality:"anchor",qualityLabel:"핵심 증거",kind:"record",sourceCharacter:"mageuna",facts:["exitRoute"],summary:"승인 번호가 남은 피난도는 북측 표식을 가리키고, 현재 유도등은 서측을 가리킨다."},
    "index-mismatch":{label:"검색 인덱스 불일치",quality:"standard",qualityLabel:"검증 자료",kind:"system",sourceCharacter:"kim-wooju",facts:["exitRoute","origin"],summary:"현재 검색 결과의 생성 시각은 서가 이동 뒤이며, 원본 DB의 수정 시각과 일치하지 않는다."},
    "shared-result":{label:"공유된 오답",quality:"support",qualityLabel:"보조 자료",kind:"testimony",sourceCharacter:"kang-unshim",facts:["studentCount","origin"],summary:"서로 다른 기기와 계정의 캡처에 이용자 다섯 명이라는 같은 문장이 삽입돼 있다."},
    "mina-load":{label:"미나 처리 부하",quality:"anchor",qualityLabel:"핵심 증거",kind:"biometric",sourceCharacter:"inan",facts:["origin"],summary:"첫 정정 발언 종료 직후 체온과 처리 부하가 함께 상승하고, 검색 단말기 변화는 뒤이어 나타난다."},
    "first-statement":{label:"최초 오발 장면",quality:"anchor",qualityLabel:"핵심 증거",kind:"archive",sourceCharacter:"epi-minos",facts:["origin"],summary:"미나의 발언 종료 직후 출입 표시가 셋에서 다섯으로 변경된다. 검색 DB의 수정 시각은 그보다 늦다."}
  },
  relationshipInteractions:[
    {id:"wooju-mina-crosscheck",category:"enhancement",sourceCharacter:"kim-wooju",evidenceKinds:["system"],title:"상호 불신 검증",prompt:"김우주가 원본을 미나가 접근할 수 없는 저장소에 격리하려 한다.",applyLabel:"원본을 격리한다",applyDescription:"출처 소실 면역 · 다음 오류의 표적 공개 · 미나 처리 부하 +1",skipLabel:"그대로 둔다",resolver:"protect-and-forecast"},
    {id:"mageuna-mina-authority",category:"enhancement",sourceCharacter:"mageuna",evidenceKinds:["record"],title:"규정 우선권",prompt:"마근아가 이 기록을 학교의 공식 기준점으로 선언하려 한다.",applyLabel:"규정 우선권 행사",applyDescription:"관련 사실의 재작성 1회 거부 · 미나 처리 부하 +1",skipLabel:"보류한다",resolver:"declare-authority"},
    {id:"unshim-mageuna-cross-examination",category:"comparison",left:{sourceCharacter:"kang-unshim",evidenceKind:"testimony"},right:{sourceCharacter:"mageuna",evidenceKind:"record"},title:"적대적 교차검증",prompt:"운심의 증언 자료와 마근아의 공식 기록이 같은 사실을 두고 충돌한다.",applyLabel:"둘에게 직접 대조시킨다",applyDescription:"공통 사실의 판정 선택지 개방 · 현실 안정도 -1",skipLabel:"각자 기록만 보존한다",resolver:"unlock-common-judgment"}
  ],
  investigations:[
    {id:"access-terminal",label:"도서관 출입 기록 단말기",prompt:"출입 인원은 셋과 다섯 사이를 오가고, CCTV 시각도 서로 맞지 않는다.",choices:[
      {id:"access-wooju",owner:"kim-wooju",label:"출입 로그와 CCTV 타임스탬프 대조",evidence:"access-log",secondary:"system-difference",approach:"우주가 단말기의 현재 표시와 덮어쓰기 전 원본 로그를 분리한다.",expectation:"실제 인원 판정·상호 불신 검증 선택",result:"오프라인 캐시에는 세 개의 출입 서명이, 현재 화면에는 다섯 명 표시가 남았다.",quote:"원본 서명 세 개. 현재 화면 다섯. 미나 선생님, 제 캐시까지 건드리지는 마세요."},
      {id:"access-unshim",owner:"kang-unshim",label:"학생 제보 시간과 단톡방 흔적 대조",evidence:"witness-time",secondary:"origin-trace",approach:"운심이 서로 다른 학생의 제보에서 표현이 동시에 바뀐 시각을 좁힌다.",expectation:"실제 인원·최초 오염의 보조 자료",result:"제보 내용은 달랐지만 ‘다섯 명’으로 바뀐 시각은 정확히 같았다.",quote:"말은 다 다른데 수정된 시각만 똑같아. 누가 한 번에 덮어쓴 거네."}
    ]},
    {id:"counter",label:"대출대와 반납함",prompt:"대출 기록과 눈앞의 줄이 서로 다른 이용자 수를 주장한다.",choices:[
      {id:"counter-epi",owner:"epi-minos",label:"직전 대출대 장면을 보존",evidence:"counter-memory",approach:"에피가 현재 장면 아래 남은 오염 전 대출대 배치를 카오에게 저장한다.",expectation:"F1 잠금용 핵심 증거",result:"현재 장면 아래에서 이용자 셋이 서 있던 이전 배치가 온전히 분리됐다.",quote:"기록물 복제 아니야. 없어지기 전에 내가 가진 것뿐이야."},
      {id:"counter-mageuna",owner:"mageuna",label:"공식 대출·반납 기록 대조",evidence:"official-record",approach:"마근아가 수정 이력이 남은 화면 대신 직인이 찍힌 마감 기록을 확인한다.",expectation:"F1 잠금용 핵심 증거·규정 우선권 선택",result:"마감 기록에는 이용자 셋과 북측 피난 기준이 수정 전 문서로 남아 있었다.",quote:"승인된 업무 기록을 기준으로 삼겠습니다. 검색 결과는 보류하십시오."}
    ]},
    {id:"exit",label:"비상구와 서가 사이 통로",prompt:"서쪽의 새 문은 출구 표지를 달고 있지만 바람도 계단 소리도 통하지 않는다.",choices:[
      {id:"exit-hwayoung",owner:"hwayoung",label:"실제 동선을 직접 통과해 확인",evidence:"physical-route",secondary:"reduce-route-risk",approach:"화영이 양쪽 통로의 압력과 구조를 몸으로 확인해 실제 외부 계단을 찾는다.",expectation:"F2 잠금용 핵심 증거·동선 위험 감소",result:"북측에서는 외기와 계단 하중이, 서측에서는 벽면 반사음이 확인됐다.",quote:"서쪽 문은 밀어도 벽의 감촉뿐이오. 북쪽은 소인의 무게를 제대로 받는구려."},
      {id:"exit-mageuna",owner:"mageuna",label:"시설 규정과 피난도를 현장 대조",evidence:"evacuation-rule",approach:"마근아가 학교 시설도와 비상 유도등의 승인 번호를 대조한다.",expectation:"F2 잠금용 핵심 증거·규정 우선권 선택",result:"승인 번호가 일치하는 피난도는 북측 비상구 하나만 가리켰다.",quote:"검색 결과를 피난 규정보다 우선하지 마십시오."}
    ]},
    {id:"search-terminal",label:"도서관 검색 단말기",prompt:"같은 검색어가 입력될 때마다 결과의 위치와 작성 시각이 달라진다.",choices:[
      {id:"search-wooju",owner:"kim-wooju",label:"검색 인덱스와 원본 DB 대조",evidence:"index-mismatch",secondary:"system-difference",approach:"우주가 검색 인덱스의 생성 시각을 원본 DB와 나란히 놓는다.",expectation:"안전 동선·최초 오염 판정 자료",result:"현재 검색 결과의 생성 시각은 서가 이동 뒤이며 원본 DB 수정 시각과 어긋나 있었다.",quote:"이 파일, 사고 뒤에 생겼어요. 앞에 끼어들지 마세요. 시간순서는 안 바뀝니다."},
      {id:"search-unshim",owner:"kang-unshim",label:"학생들이 공유한 검색 결과 비교",evidence:"shared-result",approach:"운심이 여러 학생이 올린 캡처에서 동일하게 끼어든 오답을 찾는다.",expectation:"실제 인원·최초 오염의 보조 자료",result:"기기와 계정이 달라도 같은 문장이 같은 위치에 삽입돼 있었다.",quote:"복붙도 이렇게 칼같이 안 맞아. 오답 쪽이 사람들을 따라간 거야."}
    ]},
    {id:"mina-desk",label:"미나의 사서 데스크",prompt:"미나는 정상 운영을 반복하지만 목소리의 노이즈와 오른쪽 눈의 회전 속도가 맞지 않는다.",choices:[
      {id:"desk-inan",owner:"inan",label:"미나의 상태와 발언 타이밍 확인",evidence:"mina-load",secondary:"cool-mina",approach:"이난이 미나의 호흡과 홍채 회전, 발언 직후의 신체 반응을 기록한다.",expectation:"F3 잠금용 핵심 증거·초기 부하 완화",result:"정정 발언 종료 직후 체온과 처리 부하가 함께 상승한 기록이 남았다.",quote:"체온 올라갔어요. 손 떨림도 있고요. 미나 선생님, 그건 잉크 아니고 코피예요."},
      {id:"desk-epi",owner:"epi-minos",label:"처음 틀린 말을 한 장면 보존",evidence:"first-statement",approach:"에피가 미나의 최초 발언과 그 직후 움직인 서가를 한 장면으로 묶는다.",expectation:"F3 잠금용 핵심 증거",result:"‘다섯 명’이라는 발언이 끝난 프레임에서 출입 표시가 셋에서 다섯으로 바뀌었다.",quote:"말이 먼저였어. 화면이 바뀐 건 그다음이고. 둘 다 내가 갖고 있어."}
    ]}
  ],
  patterns:[
    {id:"rewrite",label:"재작성",description:"예고된 미고정 사실을 다시 덮어쓴다."},
    {id:"source-loss",label:"출처 소실",description:"예고된 종류의 미보호 증거를 다음 라운드 동안 비활성화한다."},
    {id:"confirmation",label:"확신 편향",description:"가장 오래 남은 오염이 현실 안정도를 깎고 현장 효과를 강화한다."}
  ],
  patternScheduleEarly:[
    {pattern:"rewrite",fact:"studentCount"},{pattern:"source-loss",kind:"system"},
    {pattern:"rewrite",fact:"exitRoute"},{pattern:"confirmation"}
  ],
  patternScheduleLate:[
    {pattern:"confirmation"},{pattern:"rewrite",fact:"origin"},
    {pattern:"source-loss",kind:"record"},{pattern:"confirmation"},
    {pattern:"rewrite",fact:"studentCount"},{pattern:"source-loss",kind:"archive"}
  ],
  abilities:{
    hwayoung:[{id:"absorb",verb:"absorbThreat",label:"사명의 이행 · 현실 충격 인수",description:"다음 사실별 오염 효과를 1회 무효화하고 열량 +1.",quote:"그쪽은 소인이 맡겠소. 오는 충격은 전부 받아내지!"}],
    "kang-unshim":[{id:"trace",verb:"gatherIntel",label:"화제 · 충돌 관측 확산",description:"다음 사실 판정에서 충돌 관측 하나를 더 공개하고 정보 +1.",quote:"제보 캡처 다 올려. 지워진 줄만 모으면 뭐가 끼어든 건지 보이겠지."}],
    "epi-minos":[{id:"archive",verb:"snapshotState",label:"아귀 · 직전 출처 보존",description:"소실 증거 하나를 복원한다. 없으면 다음 출처 소실을 1건 보존한다.",quote:"이번 장면은 못 없애. 이미 카오가 먹었거든."}],
    inan:[{id:"cool-mina",verb:"stabilizeField",label:"강제 진정 · 처리 부하 냉각",description:"미나 처리 부하 -2. 다음 자기 차례까지 재정비.",cooldown:"cool",quote:"체온부터 내릴게요. 계속 떨면 라파엘로 묶어둘 수도 있어요."}],
    "kim-wooju":[{id:"analyze",verb:"analyze",label:"노이즈 캔슬링 · 원본 분리",description:"시스템 증거의 원본/현재 차이를 공개하고 다음 오류 표적을 예측한다. 다음 자기 차례까지 방전.",cooldown:"cool",quote:"현재값 껐어요. 원본만 띄웁니다. 미나 선생님은 제 화면 좀 그만 건드리세요."}],
    mageuna:[{id:"rule",verb:"declareRule",label:"마그나 카르타 · 정정 제한",description:"집행 1회를 써 다음 재작성을 차단한다.",ruleCost:1,quote:"검증 전 정보의 현실 반영은 규정 위반입니다."}],
    "byeon-ari":[{id:"purify",verb:"purify",label:"성역 재건 · 오염 박리",description:"가장 강한 미고정 사실의 오염 효과를 한 라운드 억제하고 자신의 HP -1.",hpCost:1,cooldown:"cool",quote:"글자 위에 붙은 오염부터 긁어낼게요. 원문까지 벗겨지면 두 번 일해야 하니까요."}],
    josangmin:[{id:"conserve",verb:"conserveAction",label:"움직임 보류",description:"비축 +1.",quote:"지금 찾으면 또 찾아야 해. 한 번에 끝날 때 부르든가."},{id:"decisive",verb:"decisiveIntervention",label:"결정적 개입 · 일괄 재조사",description:"비축 1을 써 한 사실의 누락 핵심 증거를 모두 확보한다.",cost:{effort:1},quote:"없어진 건 저 한 칸이네. 그것만 꺼내면 되잖아."}]
  },
  supportAdapters:{
    hwayoung:{verb:"blockRisk",label:"현실 충격 인수",description:"다음 현상 오류를 한 번 차단한다."},
    "kang-unshim":{verb:"gatherIntel",label:"긴급 제보 대조",description:"다음 판정에 충돌 관측 하나를 추가 공개한다."},
    "epi-minos":{verb:"restoreState",label:"소실 자료 복원",description:"비활성화된 증거를 모두 즉시 복구한다."},
    inan:{verb:"stabilizeField",label:"원격 냉각",description:"미나 처리 부하 -1."},
    "kim-wooju":{verb:"improveEfficiency",label:"원본 격리",description:"미보호 증거 하나를 보호 상태로 만든다."},
    mageuna:{verb:"declareRule",label:"긴급 정정 제한",description:"공유 집행 1회를 써 다음 재작성을 차단한다.",ruleCost:1},
    "byeon-ari":{verb:"createSafeZone",label:"기록 오염 박리",description:"가장 위험한 사실의 오염 효과를 한 라운드 억제한다."},
    josangmin:{verb:"amplifyNextAction",label:"최소 개입",description:"한 사실의 누락 핵심 증거를 한 번에 확보한다."}
  },
  dialogue:{
    mina:{
      briefing:"조회 결과, 현재 도서관은 정상 운영 중입니다. 이용자는 다섯 명입니다. 세 명으로 보이신다면 새로고침을 권장합니다.",
      low:"현재값과 검색 결과가 일치합니다. 오류는 없습니다. 이견이 있다면 검색어를 바꿔주십시오.",
      middle:"불일치 두 건이 확인되었습니다. 정상 범위입니다. 방금 정상 범위로 분류했습니다.",
      high:"정정 요청이 너무 많습니다. 한 번에 하나씩— 지지직 —잠깐, 빨간색 잉크가…",
      offline:"바이러스… 침투… 방화벽 손상… 복구를— 삐————"
    },
    briefing:{
      hwayoung:"문과 벽이 자리를 바꿨소? 그럼 밟아보면 되겠구려. 소인이 먼저 가겠소.",
      "kang-unshim":"캡처마다 사람 수가 달라. 최초 제보 시각부터 다시 모아볼게.",
      "epi-minos":"바뀌기 전 장면 남아 있으면 줘. 카오한테 넣어둘게. 잃어버리는 것보단 낫잖아.",
      inan:"미나 선생님 체온부터 볼게요. 쓰러뜨리는 건 그다음으로 미뤄둘게요.",
      "kim-wooju":"현재 화면은 못 믿어요. 원본만 따로 뺄게요. 미나 선생님이 제 모니터에 뭐 띄우면 전 그냥 나갑니다.",
      mageuna:"미검증 안내는 전부 배포 중지입니다. 제갈 미나 선생님, 제 안경에 404 띄우지 마십시오.",
      "byeon-ari":"원문에는 손대지 않겠습니다. 덧씌운 글자만 오염원으로 처리하죠.",
      josangmin:"틀린 세 군데만 고치면 되잖아. 도서관 전부 뒤질 생각은 하지 마."
    },
    ending:{
      hwayoung:"북쪽 문 열렸소! 셋 다 있구려. 이 정도면 승리라 해도 되겠소.",
      "kang-unshim":"정정 공지는 짧게 낼게. ‘다섯 명 아니고 세 명’. 반박은 안 받아.",
      "epi-minos":"처음 장면이랑 지금 장면 둘 다 저장했어. 이번엔 숫자가 똑같네.",
      inan:"체온 내려갔어요. 미나 선생님, 오늘 검색 금지예요. 어기면 재울게요.",
      "kim-wooju":"원본이랑 현재값 맞아요. 백업 끝. 이제 제발 아무도 업데이트하지 마세요.",
      mageuna:"정정 기록과 복구 시각을 공식 문서에 남겼습니다.",
      "byeon-ari":"서가와 단말기 오염은 제거했습니다. 열람 전에는 손부터 소독하세요.",
      josangmin:"세 개 맞췄으면 끝이지? 그럼 조용한 서가에서 잘래."
    }
  }
};
