# 열량계·반응 엔탈피 실험실

2022 개정 「물질과 에너지」의 반응 엔탈피 학습용 실험실이다. 아르카디아의 화학 실험 목록에서 진입한다. `index.html`은 실험용 SVG·스크립트를 내장하고 공통 브랜드 스타일·Gmarket Sans·로고를 `assets/`에서 불러온다. 저장소의 상대 경로 구조를 유지해 실행한다.

기본 디자인은 아르카디아 랩의 검정 배경·인디고 패널·스카이 블루 강조색이다. `assets/arcadia.css`와 `assets/arcadia-instrument.css`를 공유하고 밝은 테마 전환을 지원한다. 기본 빌드는 다크 테마의 `index.html`, `--light`는 검토용 `light.html`을 생성한다.

두 실험을 같은 64개 부품의 장치에서 연결한다.

- 열량계 보정: 물 100 g을 20 W로 60 s 가열하고 `C열량계 = E/ΔT − mc`로 장치 열용량을 추정한다. 채택한 값을 반응 실험으로 가져간다.
- 반응 엔탈피: 용액과 장치가 받은 열을 더한 뒤 부호를 바꿔 반응열을 추정한다. 반응 완료 후 `ΔᵣH = q반응/ξ`로 몰 반응 엔탈피를 구한다. 반응 진행량은 1:1 반응의 제한 반응물 양이다.

기본 중화 조건: HCl·NaOH 각각 50 mL·0.5 mol/L, 초기 25°C, 실제 장치 열용량 35 J/K, 외부 열교환 계수 0 W/K. 생성 물 0.025 mol, 반응열 −1432.5 J, 온도 상승 3.1594618438 K, 추정 ΔᵣH −57.3 kJ/mol이다.

흡열 비교는 A+B→C, ΔᵣH=+25.0 kJ/mol의 가상 반응이다. 실제 시약의 측정값으로 제시하지 않는다. 중화에는 교육용 근삿값 −57.3 kJ/mol을 일정하게 적용한다. 밀도 1 g/mL, 비열 4.184 J/(g·K), 균일 온도를 가정하고 희석열·열용량 변화·교반 일·센서 지연·기화를 생략한다. 전기 가열 보정 에너지는 반응의 일정 압력 열과 구별한다.

외부 열교환은 `C d(T−25)/dt = Psource − K(T−25)`의 구간별 해석해다. 보정은 60 s, 반응은 20 s 일정 열전달 후 정지한다. 실제 반응 속도나 유동의 재현이 아니다. 재생은 15배속이며, 시간 조절은 같은 실험의 관찰 시점을 바꾸는 동작이다. 화면의 숫자는 반올림하며 계산에는 모델의 전체 정밀도를 사용한다.

열용량을 제외하는 체크박스는 추정 계산만 바꾼다. 실제 온도·실제 열수지는 그대로다. 외부 열교환이 있는 상태에서 온도만으로 계산하면 추정값이 치우친다. 보정값 채택 후 실제 장치 열용량을 바꾸면 이전 보정을 무효화한다. 알려진 엔탈피로 온도를 생성하므로 모형의 역산 연습이며 독립적 실측 검증 자료가 아니다.

```powershell
node experiments/calorimetry/build.mjs
node experiments/calorimetry/build.mjs --audit
node --test experiments/calorimetry/model.test.mjs
node C:/Users/User/.agents/skills/anatomy/scripts/drive.mjs experiments/calorimetry/index.html --actions experiments/calorimetry/qa.json --width 1440 --height 2600
```

검증: 모델 테스트 5개(열량계 보정·열수지·제한 반응물·부호/단위·열손실 편향·연속성), 64개 실체의 지지·접촉·가림 검사, 390 px 및 데스크톱의 보정→반응 연계·입력·다크 모드·선 끝 검사를 사용한다.

출처: [OpenStax 열량 측정](https://openstax.org/books/chemistry-2e/pages/5-2-calorimetry), [엔탈피](https://openstax.org/books/chemistry-2e/pages/5-3-enthalpy), [IGNOU 중화열 실험](https://egyankosh.ac.in/bitstream/123456789/15865/1/Unit-7.pdf).
