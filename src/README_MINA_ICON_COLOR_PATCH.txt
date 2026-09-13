성아여고 · 제갈 미나 아이콘 / 퍼스널 컬러 패치

추가 asset
- assets/icons/jegal-mina.png
  사용자 제공 PNG를 그대로 복사했습니다. 이미지 생성/재가공 없음.
- assets/jegal-mina-theme.css

퍼스널 컬러
- ink      #35558a
- accent   #4c7fff  (업로드 아이콘의 실제 주색)
- soft     #e9efff
- special  #9fcf55  (미나의 라임 계열 보조색)

수정 파일
- app.js
- cafeteria-app.js
- library-app.js
- hub.js
- ICON_CREDITS.txt

동작
- 네 UI 파일의 ICON_PATHS에 jegal-mina를 추가했습니다.
- 각 UI 파일이 assets/jegal-mina-theme.css를 한 번만 로드합니다.
- 사건 03의 미나 브리핑/현장 상태/결과 박스에 십자별 심볼과 accent-jegal-mina를 연결했습니다.
- 허브에서 jegal-mina가 해금되면 기존 character-card / watermark 양식을 그대로 사용합니다.
- 게임 로직, 수치, 대사는 변경하지 않았습니다.

적용
기존 프로젝트의 같은 이름 JS 파일을 교체하고, assets 폴더의 두 파일을 같은 경로에 추가하세요.
