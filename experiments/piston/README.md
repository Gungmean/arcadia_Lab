# 열역학 제1법칙 · 피스톤 실험실

2022 개정 「역학과 에너지」의 열역학 제1법칙 Q=ΔU+W를 중심으로 다룬다. 화면 상단의 실시간 식과 해설이 받은 열·내부 에너지 변화·기체가 한 일을 연결한다. 팽창 가열, 고정 가열, 냉각 압축의 세 비교 실험으로 양수·음수 부호를 확인한다. 계는 실린더 내부 기체이며 피스톤과 하중은 외부다. 아르카디아 실험 목록의 물리 탭에서 입장한다.

`index.html`은 SVG·스타일·스크립트를 포함한 독립 실행 파일이다. 저장소 루트에서 HTTP 서버를 켜고 `/experiments/piston/`으로 접속하거나 파일을 직접 열 수 있다.

```powershell
node experiments/piston/build.mjs
node experiments/piston/build.mjs --audit
node experiments/piston/build.mjs --dark
node --test experiments/piston/model.test.mjs
```

모델은 단원자 이상기체 0.040 mol, 초기300 K·120 kPa. 자유 이동은 일정한 외부 압력에 대한 준정적 등압 과정, 피스톤 고정은 등적 과정이다. 부호 규약은 기체로 들어오는 열Q, 기체가 외부에 하는 일W를 양수로 하며 Q=ΔU+W이다. 100 J 가열 시 자유 이동은 ΔU=60 J, W=40 J, 고정은 ΔU=100 J, W=0이다.

단열+일정 하중에서는 입력 열이0이므로 상태가 변하지 않는다. 단열 압축·팽창이나 열기관 전체 사이클을 구현한 것은 아니다. 모드·공급할 열 변경은 초기 상태에서 새 경로를 선택하는 동작이며, 진행 중인 기체를 순간적으로 잠그는 물리 과정이 아니다.

입자 수·분자 속도·충돌은 정성 표현이며 실제 시뮬레이션이 아니다. 마찰·열손실·누출·장치 열용량과 운동에너지는 생략한다. 화면의 수직 피스톤 위치·P–V 곡선·계측·에너지 수지는 같은 `stateAt()` 모델에서 계산한다. 절개는 실제 개방 구멍이 아니며, 잠금 손잡이는 이상적인 구속 조건의 표시다. 눈금은 모식 눈금이며 실제 높이는 cm 계측값으로 읽는다.

기하 검사에는 62개 실체, 피스톤 전 이동 구간의 가림 순서와 중간 이동 프레임 검사를 포함한다. 별도의 과학 모델 테스트는 이상기체 상태방정식·열역학 제1법칙·고정 부피·등압·단열·냉각 부호를 검사한다. 브라우저 시나리오 `qa.json`은 Anatomy `scripts/drive.mjs`로 실행한다.

`qa-law.json`은 상단 실시간 식의 수치, 고정 가열의 W=0 해설, 냉각 압축의 Q=−60 J·ΔU=−36 J·W=−24 J, 단열 상태에서 비교 실험 재시작, 열 조절 시 누적량 초기화를 검증한다. 390 px 모바일에서도 동일한 시나리오를 실행한다.

출처: [OpenStax 제1법칙](https://openstax.org/books/university-physics-volume-2/pages/3-3-first-law-of-thermodynamics), [이상기체 열용량](https://openstax.org/books/university-physics-volume-2/pages/3-5-heat-capacities-of-an-ideal-gas).
