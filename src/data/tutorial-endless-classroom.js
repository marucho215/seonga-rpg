"use strict";

window.SEONGA_TUTORIAL_EVENT = {
  id: "tutorial-endless-classroom",
  title: "방과 후의 끝나지 않는 수업",
  characterPool: ["hwayoung", "kang-unshim", "epi-minos", "inan", "kim-wooju"],
  briefing: "방과 후, 2학년 교실 하나에서 수업이 끝나지 않는다는 신고가 들어왔다. 종은 이미 세 번 울렸지만 문 안쪽에서는 같은 문장을 읽는 소리와 분필 소리가 되풀이된다. 학생은 공격 대상이 아니며, 전원을 정상으로 되돌려 안전하게 이탈시켜야 한다.",
  studentStages: ["정상", "혼란", "반복 고착", "위험"],
  students: [
    { label:"창가의 학생", exitRisk:1, exitHint:"창문에 비친 교실을 계속 돌아본다." },
    { label:"앞줄의 학생", exitRisk:0, exitHint:"목소리를 들으면 바로 움직일 수 있다." },
    { label:"문 곁의 학생", exitRisk:2, exitHint:"문이 좁아질 때마다 발이 굳는다." },
    { label:"교탁 앞의 학생", exitRisk:1, exitHint:"분필 소리가 나면 자리로 돌아가려 한다." },
    { label:"사물함 곁의 학생", exitRisk:2, exitHint:"소지품을 두고 갈 수 없다며 망설인다." }
  ],
  initialStudentStages: [1, 1, 2, 1, 2],
  investigations: [
    { id:"hall", label:"교실 앞 복도", prompt:"닫힌 문과 반복해서 이어지는 복도부터 살핀다.", choices:[
      { id:"hall-route", label:"화영과 출입 동선을 직접 재본다", owner:"hwayoung", clue:"route", result:"복도 모서리와 비상계단까지 몸으로 확인해 안전 동선을 표시했다." },
      { id:"hall-reports", label:"운심과 바닥의 메모·제보 흔적을 맞춘다", owner:"kang-unshim", clue:"reports", result:"복제된 메모 사이에서 가장 먼저 쓰인 신고 시각을 찾아냈다." }
    ]},
    { id:"terminal", label:"복도 방송 단말기", prompt:"종이 멎었는데도 작동 중인 방송 단말기를 조사한다.", choices:[
      { id:"terminal-network", label:"우주에게 신호 패킷 추적을 맡긴다", owner:"kim-wooju", clue:"network", result:"11초마다 수업 시작 상태를 덮어쓰는 비정상 패킷의 발신점을 찾았다." },
      { id:"terminal-record", label:"에피에게 직전 방송 파형을 보존시킨다", owner:"epi-minos", clue:"record", result:"정상 종례 방송에서 잘려나간 마지막 음절을 장면째 보존했다." }
    ]},
    { id:"window", label:"교실 옆 관찰창", prompt:"문을 열지 않고 학생과 칠판의 반복을 관찰한다.", choices:[
      { id:"window-record", label:"에피와 지워지는 칠판 부분을 붙잡는다", owner:"epi-minos", clue:"record", result:"매 반복마다 사라지는 칠판 오른쪽 아래 문장을 보존했다." },
      { id:"window-rhythm", label:"이난과 학생들의 호흡 간격을 잰다", owner:"inan", clue:"rhythm", result:"종소리보다 반 박자 먼저 호흡을 끊으면 고착이 느슨해진다는 걸 확인했다." }
    ]},
    { id:"messages", label:"학생들의 제보 메시지", prompt:"교실 밖 학생들에게 도착한 제보와 단체 채팅 기록을 살핀다.", choices:[
      { id:"messages-reports", label:"운심과 최초 제보자를 역추적한다", owner:"kang-unshim", clue:"reports", result:"복제되지 않은 최초 제보 한 건과 정확한 발생 시각을 확보했다." },
      { id:"messages-rhythm", label:"이난과 반복 문장의 감정 변화를 읽는다", owner:"inan", clue:"rhythm", result:"문장 끝에서 학생의 불안이 치솟고 다음 반복으로 이어지는 리듬을 찾았다." }
    ]},
    { id:"stairs", label:"비상계단과 복도 모서리", prompt:"학생 다섯 명을 실제로 이동시킬 마지막 구간을 살핀다.", choices:[
      { id:"stairs-route", label:"화영과 학생 다섯 명의 이동 간격을 시험한다", owner:"hwayoung", clue:"route", result:"압력이 높은 학생부터 빼낼 수 있는 두 번의 안전 통과 타이밍을 확보했다." },
      { id:"stairs-network", label:"우주의 드론으로 사각과 스피커를 표시한다", owner:"kim-wooju", clue:"network", result:"스피커 반향을 피하는 초록색 드론 경로를 확보했다." }
    ]}
  ],
  clueInfo: {
    network:{ label:"반복 신호 좌표", effect:"첫 구간 압력 -1, 우주의 경로 재설정 해금" },
    reports:{ label:"최초 제보 시각", effect:"운심의 제보 수집량 +1" },
    record:{ label:"누락된 장면", effect:"에피의 장면 회수 목표 진행 +1" },
    rhythm:{ label:"호흡의 빈틈", effect:"교실 진입 시 가장 위태로운 학생 1단계 안정화" },
    route:{ label:"안전 통과 타이밍", effect:"학생 이탈 시 압력 상승을 줄이는 안전 통과 2회" }
  },
  stages: [
    { id:"threshold", title:"첫 대응 · 열리지 않는 문", intro:"손잡이를 당기는 순간 복도 끝이 다시 교실 앞으로 이어진다. 문은 잠긴 것이 아니라 ‘수업 중’이라는 상태를 되풀이하고 있다.", objective:"문턱 고정 해제", needed:4, initialPressure:4 },
    { id:"classroom", title:"두 번째 대응 · 반복되는 수업", intro:"문이 열리자 다섯 학생이 같은 문장을 동시에 읽는다. 칠판의 문장은 끝에 닿을 때마다 처음으로 되감긴다. 학생을 진정시키며 반복의 원인을 복원해야 한다.", objective:"원인 복원 및 학생 정상화", needed:2, initialPressure:4 },
    { id:"evacuation", title:"마지막 대응 · 종이 울리기 전에", intro:"반복 신호는 끊겼지만 마지막 종소리가 교실을 다시 닫으려 한다. 학생의 반응과 현상 압력을 살피며 다섯 명의 이탈 순서를 정해야 한다.", objective:"학생 개별 이탈", needed:5, initialPressure:3 }
  ],
  interludes: [
    "문이 비명을 내듯 열리고, 복도는 비로소 한 방향으로 이어진다. 그러나 교실 안의 학생들은 열린 문을 보지 못한다.",
    "칠판의 마지막 문장이 완성되며 반복 신호가 꺼진다. 그 순간 천장의 스피커가 마지막 종을 준비하고, 열린 문이 다시 좁아지기 시작한다."
  ],
  patterns: [
    { id:"recitation", label:"복창 증폭", description:"칠판에 손댈 때마다 학생들의 복창이 커진다. · 현상 압력 +1" },
    { id:"fixation", label:"시선 고정", description:"학생을 붙들면 교실의 시선이 행동자에게 몰린다. · 현상 압력 +1" },
    { id:"counterpulse", label:"역류 반동", description:"현상을 누른 힘이 행동자의 몸으로 되튄다. · 행동자 HP -1" }
  ],
  rules: { partySize:4, dangerStage:3, pressureEscalateAt:4, investigationLimit:3, supportCharges:2 }
};
