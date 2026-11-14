import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = p => readFileSync(join(root, p), 'utf8');
const stripModuleSyntax = code =>
  code
    .replace(/^import[\s\S]*?from\s+['"][^'"]+['"];?\r?\n?/gm, '')
    .replaceAll('export ', '');

const scenarios = [
  ['kepler', '01', '케플러 타원'],
  ['blackhole', '02', '블랙홀 세차'],
  ['binary', '03', '쌍성계·로슈 엽'],
  ['figure8', '04', '3체 8자 카오스'],
  ['roche', '05', '로슈 한계 고리'],
  ['hohmann', '06', '호만 전이·스윙바이']
];

const templates = [
  ['probe', '탐사선'],
  ['asteroid', '혜성'],
  ['terrestrial', '지구형 행성'],
  ['gasGiant', '목성형 행성'],
  ['star', '항성'],
  ['blackHole', '블랙홀']
];

const bundledScript = [
  stripModuleSyntax(read('physics.mjs')),
  stripModuleSyntax(read('lessons.mjs')),
  stripModuleSyntax(read('renderer.mjs')),
  stripModuleSyntax(read('app.js'))
].join('\n');

const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#1F1B8D">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='28' fill='%231F1B8D'/%3E%3Ccircle cx='32' cy='32' r='9' fill='%23fde047'/%3E%3Cellipse cx='32' cy='32' rx='22' ry='10' fill='none' stroke='%2360A5DF' stroke-width='3' transform='rotate(-24 32 32)'/%3E%3C/svg%3E">
  <title>시공간 곡률 · 만유인력과 궤도 역학 실험실 | Arcadia Lab</title>
  <link rel="stylesheet" href="../../assets/arcadia.css">
  <link rel="stylesheet" href="../../assets/arcadia-instrument.css">
  <style>${read('style.css')}</style>
</head>
<body class="arcadia-instrument gravity-lab" data-theme="dark">
  <div class="wrap">
    <nav class="instrument-nav" aria-label="아르카디아 실험실">
      <a class="brand brand-lockup" href="../../index.html">
        <img class="club-logo" src="../../assets/images/arcadia-club-logo.png" alt="아르카디아 동아리 로고">
        <span>ARCADIA / LAB</span>
      </a>
      <div class="nav-actions">
        <a class="back-link" href="../../2d.html">실험 목록</a>
        <a class="back-link" href="#kepler-table-section">궤도 비교표</a>
        <a class="back-link" href="#notebook-section">관찰 노트</a>
        <button id="theme" type="button" aria-label="밝은 테마로 전환">밝은 테마</button>
      </div>
    </nav>

    <header>
      <h1>시공간 곡률·만유인력과 궤도 역학은 어떻게 작동할까?</h1>
      <p class="course">지구과학 II · 물리학 II · 만유인력과 케플러 법칙, 일반상대론 세차, 로슈 한계</p>
      <p>질량이 시공간을 휘게 만드는 3D 중력 우물을 기울여 관찰하고, 직접 새 천체를 슬링샷 발사하거나 탐사선의 Δv를 분사해 궤도 역학을 실험해 보세요.</p>
    </header>

    <main>
      <div class="tabs" role="group" aria-label="중력 시뮬레이션 실험 선택">
        ${scenarios
          .map(
            ([id, num, title], idx) =>
              `<button type="button" data-scenario="${id}" aria-pressed="${idx === 0 ? 'true' : 'false'}"><small>${num}</small>${title}</button>`
          )
          .join('')}
      </div>

      <section class="principle" aria-live="polite">
        <div>
          <span class="eyebrow" id="principle-kicker"></span>
          <h2 id="principle-title"></h2>
          <p id="principle-caption"></p>
        </div>
        <div>
          <div class="formula" id="main-formula"></div>
          <p id="story" class="story"></p>
        </div>
        <div class="principle-actions">
          <button id="special-action" type="button" hidden></button>
        </div>
      </section>

      <div class="layout">
        <section aria-label="3D 시공간 중력 시뮬레이터">
          <div class="figure">
            <div class="frame-head">
              <span id="stage-title-bar">케플러 타원 · 천체 4개</span>
              <output id="clock-out">t = 0.00 yr · ΔE/E = 0.0000%</output>
            </div>
            <div class="stage" id="stage" data-drag-mode="slingshot">
              <canvas id="space-canvas" width="900" height="620" aria-label="시공간 곡률과 중력 궤도 실시간 시뮬레이션 캔버스"></canvas>
            </div>
            <div class="stage-bar">
              <div class="stage-bar-group">
                <button id="play-btn" type="button" aria-pressed="true">Ⅱ 일시정지</button>
                <button id="step-btn" type="button">한 걸음</button>
                <button id="reset-btn" type="button">초기 상태</button>
              </div>
              <div class="stage-bar-group">
                <button id="zoom-in-btn" type="button" aria-label="화면 확대">＋ 확대</button>
                <button id="zoom-out-btn" type="button" aria-label="화면 축소">－ 축소</button>
                <button id="cam-reset-btn" type="button">시점 초기화</button>
              </div>
            </div>
            <div class="frame-foot">
              <span>드래그: 새 천체 슬링샷 발사 (우클릭 드래그 또는 시점 모드: 3D 회전)</span>
              <span>천체 클릭: 추적 및 Δv 추진</span>
            </div>
          </div>

          <div id="event-banner" class="event-banner" role="status" hidden></div>

          <section class="chart" aria-label="역학적 에너지 보존 그래프">
            <div class="chart-title">
              <h2>실시간 역학적 에너지 변화 (K + U = E)</h2>
              <span>E &lt; 0: 속박 궤도 · E ≥ 0: 중력 탈출</span>
            </div>
            <canvas id="energy-plot" width="900" height="280" aria-label="시간에 따른 운동에너지, 위치에너지, 총 역학적 에너지 변화 그래프"></canvas>
          </section>
        </section>

        <aside>
          <section class="panel" aria-label="시뮬레이션 조작 및 천체 발사">
            <h2>시점·중력장 조작</h2>
            <div>
              <span class="caption">마우스·터치 드래그 동작</span>
              <div class="chip-grid" role="group" aria-label="캔버스 드래그 모드">
                <button id="mode-slingshot" type="button" aria-pressed="true">슬링샷 발사</button>
                <button id="mode-orbit" type="button" aria-pressed="false">3D 시점 회전</button>
              </div>
            </div>

            <div>
              <span class="caption">슬링샷으로 던질 천체</span>
              <div id="template-chips" class="chip-grid" role="group" aria-label="발사할 천체 종류">
                ${templates
                  .map(
                    ([key, label]) =>
                      `<button type="button" data-template="${key}" aria-pressed="${key === 'terrestrial' ? 'true' : 'false'}">${label}</button>`
                  )
                  .join('')}
              </div>
            </div>

            <div class="control">
              <label for="pitch-slider">3D 시점 기울기 (피치) <output id="pitch-out">42°</output></label>
              <input id="pitch-slider" type="range" min="0" max="76" step="1" value="42">
            </div>

            <div class="control">
              <label for="well-slider">시공간 중력 우물 깊이 <output id="well-out">0.90×</output></label>
              <input id="well-slider" type="range" min="0" max="1.6" step="0.05" value="0.9">
            </div>

            <div class="control">
              <label for="mass-slider">중심 천체 질량 배율 <output id="mass-out">1.00×</output></label>
              <input id="mass-slider" type="range" min="0.2" max="3.5" step="0.05" value="1">
            </div>

            <div class="control">
              <label for="speed-slider">시간 배속 <output id="speed-out">1.00×</output></label>
              <input id="speed-slider" type="range" min="0.25" max="4" step="0.25" value="1">
            </div>

            <div class="checks-grid">
              <label class="check-item" for="opt-grid"><input id="opt-grid" type="checkbox" checked>시공간 곡률 격자</label>
              <label class="check-item" for="opt-equi"><input id="opt-equi" type="checkbox">등퍼텐셜선(로슈 엽)</label>
              <label class="check-item" for="opt-field"><input id="opt-field" type="checkbox">중력장 벡터</label>
              <label class="check-item" for="opt-kepler"><input id="opt-kepler" type="checkbox" checked>케플러 면적 구간</label>
              <label class="check-item" for="opt-gr"><input id="opt-gr" type="checkbox">일반상대론 세차(1PN)</label>
              <label class="check-item" for="opt-collision"><input id="opt-collision" type="checkbox" checked>충돌 시 질량 병합</label>
            </div>
          </section>

          <section class="panel" aria-label="선택 천체 궤도 요소 및 추력 제어">
            <h2>선택 천체 궤도 측정기</h2>
            <div id="body-chips" class="chip-grid" role="group" aria-label="관찰 천체 선택"></div>
            <label class="check-item" for="follow-check"><input id="follow-check" type="checkbox">카메라가 선택 천체 따라가기</label>

            <p class="caption" style="margin:10px 0 4px">대상: <strong id="sel-name"></strong></p>
            <div class="readouts">
              <div><span>공전 속력 v</span><strong id="val-speed">—</strong><small>km/s</small></div>
              <div><span>중심 거리 r</span><strong id="val-dist">—</strong><small>AU</small></div>
              <div><span>이심률 e</span><strong id="val-ecc">—</strong><small></small></div>
              <div><span>반장축 a</span><strong id="val-a">—</strong><small>AU</small></div>
              <div><span>공전 주기 T</span><strong id="val-period">—</strong><small>yr</small></div>
              <div><span>탈출 속력 v_esc</span><strong id="val-vesc">—</strong><small>km/s</small></div>
            </div>

            <div class="energy-summary">
              <div class="energy-row-line"><span>운동에너지 K</span><strong id="e-k">—</strong></div>
              <div class="energy-row-line"><span>위치에너지 U</span><strong id="e-u">—</strong></div>
              <div class="energy-row-line"><span>총 역학적 에너지 E</span><strong id="e-tot">—</strong></div>
              <div class="energy-row-line"><span>궤도 판정</span><span id="orbit-state-badge" class="orbit-badge">—</span></div>
            </div>

            <div>
              <span class="caption">추력기 분사 (선택 천체 Δv 조작)</span>
              <div class="thrusters">
                <button id="thrust-pro" type="button">＋Δv 순방향 가속</button>
                <button id="thrust-retro" type="button">－Δv 역추진 감속</button>
                <button id="thrust-circ" type="button">원궤도 속력 맞추기</button>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <section id="kepler-table-section" class="table-section" aria-label="케플러 제3법칙 검증표">
        <h2>전체 천체 궤도 요소 &amp; 케플러 제3법칙(T² / a³)</h2>
        <p class="caption">태양 질량(1.0 M☉) 중심의 속박 궤도에서는 반장축의 세제곱과 주기의 제곱의 비 T²/a³가 항상 1.000 yr²/AU³로 일정합니다.</p>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">천체</th>
                <th scope="col">반장축 a</th>
                <th scope="col">이심률 e</th>
                <th scope="col">주기 T</th>
                <th scope="col">T² / a³</th>
                <th scope="col">현재 속력 v</th>
                <th scope="col">상태</th>
              </tr>
            </thead>
            <tbody id="kepler-table-body"></tbody>
          </table>
        </div>
      </section>

      <section id="notebook-section" class="lower-grid" aria-label="관찰 노트 및 개념 확인">
        <div class="panel">
          <div class="notebook-head">
            <h2>탐구 관찰 노트</h2>
            <div class="stage-bar-group">
              <button id="record-btn" type="button">＋ 현재 궤도 기록</button>
              <button id="csv-btn" type="button">CSV 저장 ↓</button>
            </div>
          </div>
          <p class="caption">슬링샷 발사, Δv 전이, 세차 운동 관찰 순간을 스냅샷으로 저장하고 CSV로 내보낼 수 있습니다.</p>
          <div id="records-list" class="records"></div>
        </div>

        <div class="panel">
          <div class="quiz-head">
            <h2>핵심 개념 확인 퀴즈</h2>
            <span id="quiz-counter" class="caption">1 / 5</span>
          </div>
          <p id="quiz-question"></p>
          <div id="quiz-options" class="quiz-options"></div>
          <p id="quiz-feedback" class="quiz-feedback" role="status"></p>
          <button id="quiz-next" type="button" hidden>다음 문제 →</button>
        </div>
      </section>

      <details>
        <summary>물리 모형, 수치 적분 및 근사 가정 안내</summary>
        <div class="notes">
          <p><strong>수치 적분 및 단위계:</strong> 궤도 계산은 에너지와 각운동량을 장시간 정밀하게 보존하는 4차 심플렉틱 요시다(Yoshida) 적분기를 사용합니다. 표준 천문 단위계(길이 AU, 질량 M☉, 시간 yr, G = 4π²)를 사용하여 1 AU 원궤도 주기 T = 1.000 yr, 속력 v = 29.78 km/s를 정확히 재현합니다.</p>
          <p><strong>시공간 곡률 우물(3D 격자):</strong> 2차원 공전 평면 위의 중력 퍼텐셜 Φ(x,y)를 로그 척도 깊이 z = −k·ln(1 + |Φ|/14)로 변환하여 3차원 시공간 깔때기처럼 시각화한 교육용 표현입니다. 실제 일반상대론의 4차원 리만 계량 텐서 곡률을 1:1 축척으로 그린 것은 아닙니다.</p>
          <p><strong>블랙홀 세차 및 로슈 한계:</strong> 일반상대론 근일점 세차는 유효 퍼텐셜 보정 V_GR(r) = −GML²/(c_eff² r³)을 적용하며, 수 분 안에 세차 꽃잎(Rosette) 무늬를 관찰할 수 있도록 블랙홀 프리셋에서는 유효 광속 c_eff를 과장된 상대론적 영역으로 설정했습니다. 로슈 한계 고리는 위성이 d &lt; d_R 진입 시 정성적 조석 전단 속도를 가진 72개의 고리 입자로 분열되는 교육용 모형입니다.</p>
          <p>참고 자료: <span id="sources-links"></span></p>
        </div>
      </details>
    </main>

    <footer class="lab-footer">
      <div class="footer-meta">
        <span>ARCADIA LAB / 시공간 곡률·만유인력과 궤도 역학</span>
        <a href="../star_evolution.html">별의 진화와 블랙홀 생성 →</a>
      </div>
      <img class="team-logo" src="../../assets/images/overflow-team-logo.png" alt="OVERFLOW 팀 로고">
    </footer>
  </div>
  <script>${bundledScript}</script>
</body>
</html>
`;

writeFileSync(join(root, 'index.html'), html, 'utf8');
console.log('Built gravity lab:', html.length, 'bytes');
