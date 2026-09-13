# Incident 04 Narrative Polish

대상:
- src/data/magnum-incident.js
- src/magnum-engine.js
- src/data/characters.js

작업 기준:
- 성아여고 프로필 통합본 0901의 캐릭터 성격/말투/능력 원리
- BANNED - THE DEFINITIVE GUIDE의 AI 문장 패턴 및 narrator-distance 기준
- GitHub main의 현재 Incident 04 구현

## 수정 원칙

1. 게임 수치, 밸런스, 상태 전이, 승패 조건, 능력 효과는 유지.
2. 내레이터가 의미를 해설하던 문장을 관찰 가능한 행동/물리 변화로 치환.
3. 반복적으로 쓰이기 쉬운 추상어(윤곽, 흔적, 무너짐/흔들림의 무차별 반복 등)를 줄임.
4. 캐릭터 대사는 프로필상의 사고방식으로 구분:
   - 화영: 하오체, 소인, 승부욕과 몸이 먼저 나가는 태도
   - 강운심: SNS/제보/화제 중심의 빠른 말
   - 에피: 소유/보존 어휘, 짧고 눅눅한 태도
   - 이난: 덤덤한 의료적 엉뚱함
   - 김우주: 신호/입력/팝업 등 생존형 기술어
   - 마근아: 규정/집행
   - 변아리: 박리/오염 제거의 위생 어휘
   - 조상민: 최소 행동, 귀찮음, 짧은 문장
   - 제갈 미나: AI 흉내와 현실 확정식 말투
   - 매그넘: 질투, 즉흥성, 소유욕, “재미없어”
5. '진짜 얼굴'처럼 매그넘 설정과 충돌할 수 있는 표현을 피함.
   매그넘의 평상시 인간 외형 자체가 마근아를 복제한 형태이므로,
   서사에서 임의로 고정된 '본래 인간 얼굴'을 상정하지 않음.

## presentation-only 조정

magnum-engine.js에서 조사 시작 시 기존의
`[장소]에서 [캐릭터]의 조사가 시작된다`
형식 대신 이미 데이터에 있던 `choice.approach`를 narration으로 사용하도록 변경.
게임 상태/보상에는 영향 없음.

후방 지원은 Incident 04 문맥에 맞게 Hwayoung / Byeon Ari / Jegal Mina에
사건 전용 quote를 추가하고, support adapter의 quote가 있으면 우선 사용하도록 함.
능력 효과에는 영향 없음.

## 검증

- 세 파일 모두 `node --check` 통과.
- 현재 GitHub 원본을 역복원하여 Git blob SHA가 아래와 정확히 일치함:
  - magnum-incident.js: a5d22d0ade60e6371cb63669b82b5e08aabd2a15
  - magnum-engine.js: 6340976a9fe1b7c4bdb19b2e71fb2427af9d050d
  - characters.js: 590474dd4dd389f168d7c1068afe66af324517b7
  즉, 수정본은 사용자가 지정한 GitHub 최신본을 정확한 기준으로 삼음.

## 적용 권장

ZIP을 저장소 루트에 덮어쓴 뒤:

```powershell
git diff -- src/data/magnum-incident.js src/magnum-engine.js src/data/characters.js
node --check src/data/magnum-incident.js
node --check src/magnum-engine.js
node --check src/data/characters.js
```

플레이테스트에서 특히 확인:
- 조사 지문이 너무 길게 느껴지지 않는지
- 매그넘 복제 반복 시 narration이 과밀하지 않은지
- 파열 제압 대사가 캐릭터별로 충분히 분리되어 들리는지
- 후방 지원 대사가 사건 04 상황과 어긋나지 않는지
