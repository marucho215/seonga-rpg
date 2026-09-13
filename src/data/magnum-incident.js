"use strict";

window.SEONGA_MAGNUM_EVENT={
  id:"magnum-mirroring-incident",
  title:"천사는 그런 얼굴을 하지 않는다",
  characterPool:["hwayoung","kang-unshim","epi-minos","inan","kim-wooju","mageuna","byeon-ari","josangmin","jegal-mina"],
  rules:{partySize:4,investigationLimit:2,supportCharges:2},
  balance:{
    tuningLabel:"BALANCE_TUNING",
    magnumMaxHp:16,
    instabilityMax:8,
    collapseThreshold:4,
    reconstructionHpRatio:.6,
    reconstructionHpReduction:2,
    reconstructionInstabilityGain:2,
    copyInstabilityBase:1,
    copySwitchBonus:1,
    mageunaCopyBonus:2,
    imitationDamage:4,
    collapseDamage:5,
    collapseEchoDamage:1,
    collapseTargets:2,
    mirrorRatio:.7
  },
  briefing:"교내 곳곳에서 올라오던 ‘이상하게 생긴 천사’ 목격담이 마지막으로 체육관을 가리켰다. 학생들은 모두 빠져나갔다. 지도부가 들어서자 매그넘은 주워 붙인 날개를 접고 네 사람을 훑어본다.",
  investigations:[
    {id:"rumors",label:"목격담이 모인 방송실",prompt:"방송 원고 위에 서로 다른 천사 얼굴이 낙서처럼 빼곡하다.",choices:[
      {id:"rumors-unshim",owner:"kang-unshim",clue:"mirror-profile",label:"목격 순서를 시간대로 묶는다",approach:"운심이 사진과 목격 시각을 한 화면에 띄워 얼굴이 바뀐 순서를 맞춘다.",expectation:"복제 예정 효과 상세 확인",result:"변신 직전 사진마다 매그넘의 눈이 다음 대상 쪽으로 먼저 돌아가 있다.",quote:"사진마다 눈부터 돌아가네. 야, 다음 타깃 이걸로 잡겠다."}
    ]},
    {id:"feathers",label:"중앙 계단의 부러진 깃",prompt:"색도 재질도 다른 깃털이 한 뿌리에 억지로 붙어 있다.",choices:[
      {id:"feathers-ari",owner:"byeon-ari",clue:"unstable-seam",label:"붙여 만든 경계만 박리한다",approach:"아리가 핀셋으로 깃털 사이의 접합부만 걷어낸다.",expectation:"초기 복제 불안정 +1",result:"얇은 막이 벗겨지자 붙어 있던 깃들이 제각기 다른 방향으로 벌어진다.",quote:"깃을 덧붙였네요. 이음매만 벗겨내면 됩니다."}
    ]},
    {id:"gym-floor",label:"체육관 바닥의 변신 흔적",prompt:"매트 아래에 사람의 체형을 몇 번이고 고쳐 세운 자국이 눌려 있다.",choices:[
      {id:"floor-hwayoung",owner:"hwayoung",clue:"reconstruction-scar",label:"무너진 자국의 하중을 직접 잰다",approach:"화영이 꺼진 매트를 몇 번 밟아 좌우 발자국의 깊이를 비교한다.",expectation:"첫 재구성 회복량 감소",result:"다시 일어선 뒤의 자국은 오른쪽 발만 유난히 얕다.",quote:"오른발이 제대로 못 버티는구려. 다시 일어나도 저쪽부터 무너지겠소."}
    ]},
    {id:"camera",label:"체육관 복도 CCTV",prompt:"CCTV 속 매그넘은 실제 움직임보다 한 프레임 늦게 같은 동작을 한다.",choices:[
      {id:"camera-wooju",owner:"kim-wooju",clue:"copy-cut",label:"따라오는 프레임을 분리한다",approach:"우주가 원본 동작과 뒤늦게 붙은 한 프레임을 따로 떼어 재생한다.",expectation:"복제 예약 취소 1회",result:"그 한 프레임 동안 매그넘 쪽 추적 신호가 통째로 비어 있다.",quote:"여기 한 프레임 비어요. 그때 입력 끊으면 따라 할 대상이 없어져요."}
    ]}
  ],
  clueInfo:{
    "mirror-profile":{label:"모사 시선 기록",description:"복제 대기의 약화 효과까지 표시한다."},
    "unstable-seam":{label:"날개 접합부",description:"전투 시작 불안정 +1."},
    "reconstruction-scar":{label:"재구성 하중 흔적",description:"첫 재구성 회복량을 낮춘다."},
    "copy-cut":{label:"빈 모사 프레임",description:"사건 전용 행동으로 복제 대기 1회를 취소한다."}
  },
  abilities:{
    hwayoung:[{id:"absorb",verb:"absorbThreat",label:"사명의 이행 · 충격 인수",description:"매그넘 HP -2 · 방호 2.",power:3,quote:"따라 해보시오. 소인은 맞고도 서 있소!"}],
    "kang-unshim":[{id:"spread",verb:"gatherIntel",label:"화제 · 시선 집중",description:"매그넘 HP -3 · 자신의 HP -1.",power:3,quote:"야, 이거 봐! 남의 얼굴 주워 붙인 티가 이렇게 나는데 안 볼 수가 있나!"}],
    "epi-minos":[{id:"snapshot",verb:"snapshotState",label:"아귀 · 모사 장면 보존",description:"매그넘 HP -2 · 보존 +1.",power:3,quote:"그 얼굴 무너지는 장면, 내가 먼저 가질래."},{id:"restore",verb:"restoreState",label:"보존 장면 재현",description:"보존 2 소모 · 매그넘 HP -5.",power:5,cost:{memory:2},quote:"카오, 실패했던 얼굴 다시 꺼내. 저 위에 겹쳐 놓게."}],
    inan:[{id:"calm",verb:"stabilizeField",label:"강제 진정",description:"가장 다친 출전 인원 HP +3.",power:3,cooldown:"cool",quote:"흥분이 심하네요. 운동신경부터 재우면 조용해질까요?"}],
    "kim-wooju":[{id:"analyze",verb:"analyze",label:"노이즈 캔슬링 · 모사 분리",description:"매그넘 HP -2 · 다음 피해 +1.",power:3,cooldown:"cool",quote:"원본 얼굴만 남길게요. 아니, 원본도 보기 싫지만 일단요."}],
    mageuna:[{id:"rule",verb:"declareRule",label:"마그나 카르타 · 모사 금지",description:"집행 1회 · 매그넘 HP -1 · 다음 기본 공격 차단.",power:4,ruleCost:1,quote:"타인의 신분과 능력을 도용하는 행위는 명백한 규정 위반입니다."}],
    "byeon-ari":[{id:"purify",verb:"purify",label:"성역 재건 · 모사 박리",description:"매그넘 HP -4 · 자신의 HP -1.",power:4,hpCost:1,cooldown:"cool",quote:"빌린 얼굴부터 벗겨내겠습니다. 가브리엘, 원본에는 손대지 마세요."}],
    josangmin:[{id:"conserve",verb:"conserveAction",label:"움직임 보류",description:"비축 +1.",power:1,quote:"그걸 지금 따라 해봤자 할 일만 늘어날 텐데."},{id:"decisive",verb:"decisiveIntervention",label:"결정적 개입 · 붕괴점 절단",description:"비축 1 소모 · 매그넘 HP -5.",power:5,cost:{effort:1},quote:"흔들리는 데 하나잖아. 거기만 끊어."}],
    "jegal-mina":[{id:"overwrite",verb:"overwriteReality",label:"할루시네이션 · 현재 형상 지정",description:"매그넘 HP -3 · 복제 방호 제거.",power:4,quote:"현재 대상의 형상은 불완전합니다. 네, 지금 그렇게 됐습니다."}],
    magnum:[{id:"envy",verb:"envyStrike",label:"미러링 · 질투의 파편",description:"매그넘 HP -3.",power:4,quote:"내가 하면 더 예쁠 텐데. 재미없어, 비켜봐."}]
  },
  supportAdapters:{
    hwayoung:{label:"퇴로 방호",description:"출전 인원 전체에 방호 1.",quote:"충격은 뒤로 넘기시오. 소인이 받아 두겠소!"},
    "kang-unshim":{label:"시선 교란",description:"매그넘 불안정 +1."},
    "epi-minos":{label:"직전 장면 회수",description:"가장 다친 출전 인원 HP +2."},
    inan:{label:"원격 진정",description:"출전 인원 전체 HP +1."},
    "kim-wooju":{label:"모사 감쇠",description:"다음 복제 효과를 한 번 약화한다."},
    mageuna:{label:"긴급 모사 금지",description:"다음 매그넘 기본 공격을 차단한다.",ruleCost:1},
    "byeon-ari":{label:"잔재 박리",description:"모사 봉인 상태를 제거하고 매그넘 HP -1.",quote:"붙어 나온 건 제가 걷어내겠습니다. 그대로 계세요."},
    josangmin:{label:"최소 절단",description:"매그넘 HP -2."},
    "jegal-mina":{label:"현재 형상 제한",description:"복제 대기를 취소한다.",quote:"복제 대기는 존재하지 않습니다. 방금 그렇게 됐습니다."},
    magnum:{label:"거울 방해",description:"매그넘 불안정 +1."}
  },
  mirrorDescriptions:{
    absorbThreat:"매그넘 방호 2 · 대상 HP -1",gatherIntel:"기본 공격 피해 +2",snapshotState:"매그넘 HP +2",restoreState:"매그넘 HP +4",stabilizeField:"매그넘 HP +2",analyze:"기본 공격 피해 +2",declareRule:"복제 대상 능력 봉인 · 대상 HP -3",purify:"대상 HP -3",conserveAction:"매그넘 방호 1",decisiveIntervention:"대상 HP -4",overwriteReality:"매그넘 HP +3 · 출전 인원 HP -1",envyStrike:"대상 HP -3"
  },
  finishers:{
    hwayoung:{label:"파열 제압 · 정면 구속",narration:"화영이 떨어지는 깃털 사이로 파고들어 매그넘의 두 팔을 등 뒤로 붙든다.",quote:"잡았소! 이번 판은 소인 승리요."},
    "kang-unshim":{label:"파열 제압 · 시선 고정",narration:"운심이 체육관의 모든 화면을 매그넘의 현재 얼굴 하나로 채운다.",quote:"봐, 화면 전부 지금 네 얼굴이야. 바꿔 봐. 바로 또 올릴 테니까."},
    "epi-minos":{label:"파열 제압 · 붕괴 장면 보존",narration:"카오가 부리를 벌려 재구성 직전의 무너진 형상을 통째로 삼킨다.",quote:"다시 만들 장면은 없어. 실패한 건 이제 내 거야."},
    inan:{label:"파열 제압 · 강제 진정",narration:"라파엘의 투명한 촉수가 벌어진 날개뼈와 팔다리를 차례로 감싼다.",quote:"움직이면 더 아파요. 안 움직여도 조금 아플 거고요."},
    "kim-wooju":{label:"파열 제압 · 입력 차단",narration:"우주의 드론이 매그넘을 향한 카메라와 동작 추적 신호를 하나씩 끊는다.",quote:"입력 전부 차단했어요. 이제 따라 할 것도, 팝업도 없어요."},
    mageuna:{label:"파열 제압 · 형상 집행",narration:"산달폰의 붉은 철사가 매그넘의 팔다리와 날개를 현재 위치에 묶는다.",quote:"규정 위반입니다. 그 불완전한 형상으로 정지하십시오."},
    "byeon-ari":{label:"파열 제압 · 모사 잔재 박리",narration:"가브리엘의 손들이 겹쳐 붙은 깃털과 얼굴 조각을 바깥쪽부터 벗겨낸다.",quote:"붙여 둔 건 전부 떼겠습니다. 남는 건 그 뒤에 확인하시죠."},
    josangmin:{label:"파열 제압 · 붕괴점 절단",narration:"먐먀의 그림자 발톱이 이미 갈라진 중심 한 곳만 짧게 끊고 사라진다.",quote:"한 군데면 됐네. 이제 눕자."},
    "jegal-mina":{label:"파열 제압 · 현재값 확정",narration:"미나가 매그넘을 가리키자 한 프레임씩 어긋나던 몸이 그대로 멎는다.",quote:"현재 형상은 파열 상태입니다. 이의 신청은 받지 않습니다."},
    magnum:{label:"파열 제압 · 거울 파기",narration:"서로 다른 두 미러링이 맞부딪치며 남아 있던 모사 조각을 안쪽에서 깨뜨린다.",quote:"내 흉내까지 내면 재미없잖아. 그러니까 그만해."}
  },
  dialogue:{
    boss:{opening:"천사들 얼굴이 다 예쁘길래 조금씩 가져왔어. 이제 너희 것도 보여줘. 재미없으면 부숴버릴 거야.",collapse:"왜 또 틀어져? 똑같이 했잖아. 보지 마. 한 번 더 하면 돼.",reconstruct:"죽은 척도 재미없네. 몸 하나 다시 만들면 되잖아.",shatter:"잠깐, 이 얼굴 아니야. 이것도 아니고— 뭘 보고 있는 거야?"},
    briefing:{hwayoung:"학생은 모두 나갔소. 이제 저 가짜 날개를 접어드리면 되겠구려.","kang-unshim":"목격담마다 얼굴이 다른 이유가 있었네. 실시간으로 갈아끼우고 있었어.","epi-minos":"저렇게 주워 담아도 자기 건 하나도 없네.",inan:"천사처럼 보이진 않아요. 라파엘도 별로 닮았다고 생각하지 않는대요.","kim-wooju":"제 동작은 보지 말라고 해주세요. 따라 하면 제가 두 명인 것 같아서 싫어요.",mageuna:"또 시작했군요. 이번 도용 행위는 현장에서 직접 집행하겠습니다.","byeon-ari":"가브리엘의 팔 배치를 흉내 냈군요. 위생적이지도, 정확하지도 않습니다.",josangmin:"얼굴을 계속 바꾸면 안 피곤한가. 보기만 해도 귀찮아.","jegal-mina":"관측 결과, 천사가 아닙니다. 본인이 반박해도 결과는 같습니다.",magnum:"가짜가 하나 더 있네. 어느 쪽이 더 재밌는지 해볼까?"}
  }
};
