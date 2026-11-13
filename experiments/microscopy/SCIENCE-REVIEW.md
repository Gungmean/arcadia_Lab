# 현미경 시뮬레이터 과학적 타당성 검토

검토일: 2026-11-13 (한국 시간)

**판정: 주요 오개념을 유발하던 도해·영상 불일치를 수정했다. 작동 원리 학습용으로 사용할 수 있으나 실제 장비의 정량 성능을 예측하는 시뮬레이터는 아니다.**

Anatomy 스킬의 모델–도해–표시값 일치 기준을 적용했다. 광학·TEM·SEM을 각각 별도 서브에이전트가 독립 검토했고, 주 에이전트가 근거 대조·수정·통합 검사를 수행했다. 부품 지지와 가림 검사, 과학 원리 검토, 브라우저 기능 검사를 구분했다. 초기 기하 검사 통과만으로 광선·전자 궤적의 물리적 타당성이 입증되지는 않았다.

## 확인된 기본 원리와 계산

| 항목 | 확인 결과 | 적용 범위 |
|---|---|---|
| 광학 총배율 | 대물배율 × 접안배율. 기본 조건 400× | 유한 경통 복합 현미경의 명목 배율 |
| 광학 분해 한계 | Rayleigh 근사 0.61λ/NA. 550 nm·NA 0.65에서 0.516 µm | 이상적인 근사. 콘덴서·정렬·대비 등 실제 조건은 별도 |
| NA·유침 | 4×/0.10, 10×/0.25, 40×/0.65, 100×/1.25는 대표값으로 합리적 | 100×/1.25는 유침 조건 |
| 전자 파장 | 상대론적 드브로이 식과 단위·상수가 맞음 | 100/120/300 kV에서 약 3.70144/3.34922/1.96875 pm. 장비 분해능과 다름 |
| TEM | 얇은 시료를 투과한 전자의 명시야 대비·확대·검출, 2차원 투영 설명이 적절 | 생물 초박 절편의 진폭 대비 중심 |
| SEM | SE 표면 형상, BSE의 주된 조성 대비, 위치별 신호 기록 설명이 적절 | 일반적인 고진공 조건을 단순화 |
| SEM 주사 시간 | 512² × 픽셀 체류시간. 5 µs에서 1.31072 s | 복귀·처리 시간 제외 |

## 초기 구현에서 발견해 수정한 사항

| 초기 문제 | 수정 |
|---|---|
| 빔 외곽이 양극·조리개·폴피스의 개구보다 커 금속을 관통 | 공유 빔 경로를 만들고 실제 도해에서 생성한 개구 반경·두께 전체와 대조 |
| 렌즈 없는 광학 중간상면에서 광선이 V자로 꺾임 | 부호 있는 광선 좌표로 상면을 직선 교차. 등가 접안렌즈 이후에는 평행 출사 |
| 입자가 광선과 무관한 직선으로 이동 | 광선과 같은 경로를 보간 |
| 접안배율을 올리면 물체공간의 흐림이 줄어 분해능이 좋아지는 효과 | 회절 흐림을 물체 크기 기준으로 계산한 뒤 시야·픽셀로 환산. 시료와 흐림을 함께 확대 |
| 접안별 시야수의 숨은 가정 | FN=18/12/9 mm를 UI에 표시하고 FOV=FN/대물배율 적용 |
| 단일 조명 파장인데 다색 관찰 영상을 계속 표시 | 단색 강도에 파장에 따른 예시 색조 적용. 염색 흡수 스펙트럼은 미계산이라고 명시 |
| 화면마다 영상 가로세로 비율이 달라 모양·축척 왜곡 | 캔버스와 화면의 720:440 비율 유지 |
| TEM 시료가 상·하 폴피스 간극 밖에 있음 | 시료 z192.6–192.75를 간극 z190–193.5 안에 배치. 상·하 극과 외측 요크 연결 |
| TEM 홀더가 절편 아래 직접빔을 가림 | 홀더 끝을 그리드 지지부까지 줄여 중앙 투과 경로 확보 |
| TEM 표시 감쇠율과 영상 밝기에 서로 다른 식 사용 | `measure().signal`을 영상에도 적용하고 기본 노출 조건으로 정규화 |
| 총 투과량처럼 읽힐 수 있는 '투과분율' | '가정한 직접빔 분율'로 수정. 산란전자까지 합친 총 투과량이 아님을 명시 |
| 전자총 도해를 모든 전자원에 일반화할 가능성 | Wehnelt 전극을 사용하는 열전자총형 예시로 한정 |
| SEM의 영상 시야만 바뀌고 실제 주사 범위는 불변 | 시야·512행 래스터·화면 기록·체류시간을 공유 계산 |
| SEM 도해는 1개 표본인데 영상은 다른 위치의 3개 표본 | 같은 중심 표본 1개, 같은 공간 축척과 투영 반경으로 통일 |
| 서로 다른 꽃가루 표면 식 때문에 주사점이 내부에 찍힘 | 도해·교점 계산에 같은 반구 사용. 탄소 기판을 추가하고 입사선의 첫 표면 교점 계산 |
| BSE에도 SE처럼 굽은 궤적 사용 | BSE는 직선, SE는 외향 수집 경로의 예시. 시료에 가려진 경로는 생략 |
| 축대칭 고리로 표현된 X/Y 주사 코일 | 서로 직교하는 네 권선 블록으로 구분 |
| 15 kV 이상이면 무조건 영상이 흐려지는 임의 규칙 | 제거. 전압은 파장 계산과 정성적 설명에만 사용 |
| 반응형 화면에서 실제 배율처럼 보일 수 있는 값 | 100 mm 표시 너비 기준의 명목배율임을 명시 |

## 재현 가능한 검사

`node prototypes/microscopy-lab/qa-model.mjs`는 다음을 확인한다.

- 실제 도해의 개구와 빔 경로: 두께 방향 **11,616개 표본**에서 개구 통과 확인.
- 중간상면의 광선 기울기 연속성, 등가 접안렌즈의 평행 출사, 입자–광선 일치.
- 접안배율 변화에서 물체공간 회절 흐림이 불변인지 확인.
- TEM 시료–폴피스 간극 위치, 전자 파장·감쇠·진공·주사 시간 수치.
- 세 시야 × 세 체류시간 × 512개 시점의 SEM 주사점·표면 교점과 개구 통과.
- 각 입사선의 100개 구간에서 첫 표면 도달 여부, 표시되는 SE/BSE 경로의 시료 침투 여부.

`build.mjs --audit`는 세 장비의 부품 지지·가림 순서·그림과 기록 기하의 일치 등을 검사한다. 이 검사는 과학 검토와 별개이며, 전자기장 해석이나 실제 장비 성능 검증을 뜻하지 않는다. 브라우저 검사는 데스크톱·390px 화면에서 장비 전환, 조절, 단계 재생, 축척 표시와 렌더링 오류를 확인한다.

## 남아 있는 의도적 단순화

- 렌즈 곡률·굴절률·전기장·자기장과 Lorentz 궤적을 수치 해석하지 않는다. 빔은 개구 제약을 만족하는 등가 모식 경로다.
- 광학 Gaussian 흐림은 회절의 학습 근사다. 부분 결맞음 명시야 전달함수, 수차, 피사계 심도, 염색 흡수 스펙트럼을 재현하지 않는다.
- TEM의 160 nm 유효 산란 평균 자유 행로와 조리개 신호 계수는 임의 가정이다. 재료·에너지 의존성, 위상·회절 대비, 다중 산란, 시료 손상을 계산하지 않는다.
- SEM의 그림 비율·등가 주사 피벗·입자 수·SE 수집 곡선은 설명용이다. 검출 입체각, 수집 효율, 실제 전자 통계나 재료의 산란량을 예측하지 않는다.
- BSE의 밝은 입자는 고원자번호 입자를 가정한 모식 대비다. 실제 꽃가루의 성분 측정값이 아니다. 코팅·대전·잡음도 정성 모형이다.
- 관찰 영상은 생성된 모식 영상이다. 실제 사진이나 생물 표본의 계측 자료로 사용할 수 없다.

## 근거 자료

- [Nikon — Resolution](https://www.microscopyu.com/microscopy-basics/resolution)
- [Nikon — Useful Magnification Range](https://www.microscopyu.com/microscopy-basics/useful-magnification-range)
- [Nikon — Field of View](https://www.microscopyu.com/microscopy-basics/field-of-view)
- [Evident — Field Number](https://evidentscientific.com/en/learn/microscope/terms/field-number)
- [FSU — Monochromatic filters and imaging](https://micro.magnet.fsu.edu/primer/photomicrography/bwfilters.html)
- [Zhang 등 — Gaussian PSF approximations, Applied Optics 2007](https://opg.optica.org/ao/abstract.cfm?uri=ao-46-10-1819)
- [NIST — Electron mass, CODATA](https://physics.nist.gov/cgi-bin/cuu/Value?me)
- [ETH Zürich — Electron properties](https://scopem.ethz.ch/education/EM-ken/basics_theory/electron-generation/electron-properties.html)
- [JEOL — Objective lens](https://www.jeol.com/words/emterms/20121023.060558.php)
- [JEOL — Polepiece](https://www.jeol.com/words/emterms/20121023.100857.php)
- [JEOL — Objective aperture](https://www.jeol.com/words/emterms/20121023.060458.php)
- [JEOL — Backscattered electron detector](https://www.jeol.com/words/semterms/20121023.083357.php)
- [UIUC — SEM operation and scan](https://bugscope.beckman.illinois.edu/microscope)
- [Purdue — SEM pixel dwell time](https://ag.purdue.edu/department/arge/facilities-and-research/microscopy/training/sem-pixel-dwell-time.html)
- [Thermo Fisher — SEM resolution](https://www.thermofisher.com/us/en/home/materials-science/learning-center/applications/sem-resolution.html)
