import {
  AU_PER_YR_TO_KMS,
  BODY_TEMPLATES,
  SCENARIOS,
  createSimulation,
  stepSimulation,
  computeSystemEnergy,
  computeOrbitalElements,
  applyCentralMassScale,
  selectBody,
  applyImpulse,
  spawnBody,
  predictTrajectory,
  getPrimaryBody
} from './physics.mjs';
import { SCENARIO_EXPLANATIONS, QUIZ_ITEMS, MODEL_SOURCES } from './lessons.mjs';
import { GravityRenderer } from './renderer.mjs';

const $ = id => document.getElementById(id);
const STORAGE_KEY = 'arcadia-gravity-records-v1';

const canvas = $('space-canvas');
const energyCanvas = $('energy-plot');
const energyCtx = energyCanvas.getContext('2d');
const renderer = new GravityRenderer(canvas);

let sim = createSimulation('kepler');
let playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let speedMultiplier = 1.0;
let dragMode = 'slingshot';
let spawnTemplateKey = 'terrestrial';
let wellDepth = SCENARIOS.kepler.defaultWellDepth;
let showGrid = true;
let showEquipotential = false;
let showField = false;
let showKeplerSectors = true;
let followSelected = false;

let history = [];
let lastSampleT = -1;
let quizIndex = 0;
let quizAnswered = false;
let records = [];
let lastFrameMs = 0;
let rafId = 0;
let uiSyncAcc = 0;

const slingshot = {
  active: false,
  pointerId: null,
  startScreenX: 0,
  startScreenY: 0,
  wx: 0,
  wy: 0,
  vx: 0,
  vy: 0
};
let slingshotPrediction = null;

const camDrag = {
  active: false,
  pointerId: null,
  lastX: 0,
  lastY: 0,
  moved: false
};

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  if (Array.isArray(saved)) records = saved.slice(-40);
} catch {}

function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}

function fmtNum(val, digits = 2) {
  if (!Number.isFinite(val)) return '∞';
  return val.toFixed(digits);
}

function loadScenario(scenarioId) {
  const sc = SCENARIOS[scenarioId] || SCENARIOS.kepler;
  sim = createSimulation(sc.id);
  showGrid = sc.defaults.grid;
  showEquipotential = sc.defaults.equipotential;
  showField = sc.defaults.field;
  showKeplerSectors = sc.defaults.keplerSectors;
  wellDepth = sc.defaultWellDepth ?? 0.9;
  renderer.camera.pitch = (sc.defaultPitch ?? 42) * (Math.PI / 180);
  renderer.camera.yaw = 0.55;
  renderer.camera.zoom = 1.0;
  renderer.camera.panX = 0;
  renderer.camera.panY = 0;
  renderer.camera.followBodyId = null;
  followSelected = false;

  history = [];
  lastSampleT = -1;
  slingshot.active = false;
  slingshotPrediction = null;

  syncControlsFromState();
  recordHistorySample(true);
  renderAll();
}

function syncControlsFromState() {
  const sc = sim.scenario;
  const info = SCENARIO_EXPLANATIONS[sc.id];

  document.querySelectorAll('.tabs button[data-scenario]').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.scenario === sc.id));
  });

  $('principle-kicker').textContent = info.badge;
  $('principle-title').textContent = sc.title;
  $('principle-caption').textContent = info.guide;
  $('main-formula').textContent = sc.formula;
  $('story').textContent = info.tryThis;

  $('pitch-slider').value = String(Math.round((renderer.camera.pitch * 180) / Math.PI));
  $('pitch-out').textContent = `${$('pitch-slider').value}°`;
  $('well-slider').value = String(wellDepth);
  $('well-out').textContent = `${wellDepth.toFixed(2)}×`;
  $('mass-slider').value = String(sim.centralMassScale);
  $('mass-out').textContent = `${sim.centralMassScale.toFixed(2)}×`;
  $('speed-slider').value = String(speedMultiplier);
  $('speed-out').textContent = `${speedMultiplier.toFixed(2)}×`;

  $('opt-grid').checked = showGrid;
  $('opt-equi').checked = showEquipotential;
  $('opt-field').checked = showField;
  $('opt-kepler').checked = showKeplerSectors;
  $('opt-gr').checked = sim.relativityEnabled;
  $('opt-collision').checked = sim.collisionsEnabled;

  $('follow-check').checked = followSelected;
  $('play-btn').setAttribute('aria-pressed', String(playing));
  $('play-btn').textContent = playing ? 'Ⅱ 일시정지' : '▶ 재생';

  $('stage').dataset.dragMode = dragMode;
  $('mode-slingshot').setAttribute('aria-pressed', String(dragMode === 'slingshot'));
  $('mode-orbit').setAttribute('aria-pressed', String(dragMode === 'orbit'));

  const spBtn = $('special-action');
  if (sc.id === 'figure8') {
    spBtn.hidden = false;
    spBtn.textContent = '+0.5% 카오스 섭동';
  } else if (sc.id === 'hohmann') {
    spBtn.hidden = false;
    spBtn.textContent = '호만 전이 Δv₁ 분사';
  } else {
    spBtn.hidden = true;
  }

  document.querySelectorAll('#template-chips button').forEach(btn => {
    btn.setAttribute('aria-pressed', String(btn.dataset.template === spawnTemplateKey));
  });

  syncBodyChips();
}

function syncBodyChips() {
  const container = $('body-chips');
  container.replaceChildren(
    ...sim.bodies.map(b => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = b.name.split('(')[0].trim();
      btn.setAttribute('aria-pressed', String(b.id === sim.selectedBodyId));
      btn.addEventListener('click', () => {
        selectBody(sim, b.id);
        if (followSelected) renderer.camera.followBodyId = b.id;
        syncBodyChips();
        updateTelemetry();
      });
      return btn;
    })
  );
}

function recordHistorySample(force = false) {
  if (!force && sim.t - lastSampleT < 0.025) return;
  lastSampleT = sim.t;
  const sysE = computeSystemEnergy(sim);
  const body = sim.bodies.find(b => b.id === sim.selectedBodyId);
  const el = body ? computeOrbitalElements(body, sim) : null;
  const useSpecific = Boolean(el && el.primary && body.mass < 0.05);
  history.push({
    t: sim.t,
    k: useSpecific ? el.specificKinetic : sysE.kinetic,
    u: useSpecific ? el.specificPotential : sysE.potential,
    e: useSpecific ? el.specificEnergy : sysE.total,
    speed: el ? el.speedKms : 0
  });
  if (history.length > 220) history.shift();
}

function updateTelemetry() {
  const sysE = computeSystemEnergy(sim);
  $('clock-out').textContent = `t = ${sim.t.toFixed(2)} yr · ΔE/E = ${(sysE.drift * 100).toFixed(4)}%`;
  $('stage-title-bar').textContent = `${sim.scenario.shortTitle} · 천체 ${sim.bodies.length}개${sim.particles.length ? ` · 입자 ${sim.particles.length}개` : ''}`;

  const latestEvent = sim.events[sim.events.length - 1];
  const banner = $('event-banner');
  if (latestEvent) {
    banner.hidden = false;
    banner.textContent = `[t=${latestEvent.t.toFixed(2)} yr] ${latestEvent.message}`;
  } else {
    banner.hidden = true;
  }

  const body = sim.bodies.find(b => b.id === sim.selectedBodyId) || sim.bodies[0];
  const el = body ? computeOrbitalElements(body, sim) : null;
  if (!el) return;

  $('sel-name').textContent = body.name;
  $('val-speed').textContent = fmtNum(el.speedKms, 2);
  $('val-dist').textContent = fmtNum(el.r, 3);
  $('val-ecc').textContent = fmtNum(el.e, 3);
  $('val-a').textContent = el.bound ? fmtNum(el.a, 3) : '∞';
  $('val-period').textContent = el.bound ? fmtNum(el.period, 3) : '—';
  $('val-vesc').textContent = el.primary ? fmtNum(el.vEscKms, 2) : '—';

  const unitLabel = body.mass < 0.05 && el.primary ? 'AU²/yr²' : 'M☉·AU²/yr²';
  const kVal = body.mass < 0.05 && el.primary ? el.specificKinetic : sysE.kinetic;
  const uVal = body.mass < 0.05 && el.primary ? el.specificPotential : sysE.potential;
  const eVal = body.mass < 0.05 && el.primary ? el.specificEnergy : sysE.total;

  $('e-k').textContent = `${kVal.toFixed(2)} ${unitLabel}`;
  $('e-u').textContent = `${uVal.toFixed(2)} ${unitLabel}`;
  $('e-tot').textContent = `${eVal.toFixed(2)} ${unitLabel}`;
  $('orbit-state-badge').textContent = el.primary ? el.typeLabel : '계 전체 중심체';

  const canThrust = Boolean(el.primary && body !== el.primary);
  $('thrust-pro').disabled = !canThrust;
  $('thrust-retro').disabled = !canThrust;
  $('thrust-circ').disabled = !canThrust;

  updateKeplerTable();
  drawEnergyPlot();
}

function updateKeplerTable() {
  const tbody = $('kepler-table-body');
  const primary = getPrimaryBody(sim);
  const rows = sim.bodies
    .filter(b => b !== primary)
    .map(b => {
      const el = computeOrbitalElements(b, sim);
      const tr = document.createElement('tr');
      const ratioText = el.keplerRatio != null ? el.keplerRatio.toFixed(3) : '—';
      const cells = [
        b.name.split('(')[0].trim(),
        el.bound ? `${el.a.toFixed(3)} AU` : '쌍곡선',
        el.e.toFixed(3),
        el.bound ? `${el.period.toFixed(3)} yr` : '—',
        ratioText,
        `${el.speedKms.toFixed(2)} km/s`,
        el.typeLabel
      ];
      cells.forEach((txt, idx) => {
        const td = document.createElement('td');
        if (idx >= 1 && idx <= 5) td.className = 'num';
        td.textContent = txt;
        tr.appendChild(td);
      });
      return tr;
    });
  tbody.replaceChildren(...rows);
}

function drawEnergyPlot() {
  const isLight = document.body.dataset.theme === 'light';
  const bg = isLight ? '#f7f9fd' : '#10182b';
  const gridCol = isLight ? '#dce4f0' : '#223875';
  const textCol = isLight ? '#526581' : '#b6c9e7';
  const kCol = isLight ? '#2563eb' : '#60a5df';
  const uCol = isLight ? '#d97706' : '#fbbf24';
  const eCol = isLight ? '#059669' : '#34d399';

  const w = energyCanvas.width;
  const h = energyCanvas.height;
  energyCtx.clearRect(0, 0, w, h);
  energyCtx.fillStyle = bg;
  energyCtx.fillRect(0, 0, w, h);

  const pad = { l: 58, r: 22, t: 22, b: 34 };
  const pw = w - pad.l - pad.r;
  const ph = h - pad.t - pad.b;

  if (history.length < 2) return;

  let minV = 0;
  let maxV = 0;
  for (const pt of history) {
    minV = Math.min(minV, pt.u, pt.e, pt.k);
    maxV = Math.max(maxV, pt.k, pt.e, pt.u);
  }
  const margin = Math.max(1, (maxV - minV) * 0.14);
  minV -= margin;
  maxV += margin;
  const spanV = Math.max(1e-4, maxV - minV);
  const toY = v => pad.t + ((maxV - v) / spanV) * ph;

  // Zero energy line
  const zeroY = toY(0);
  energyCtx.strokeStyle = gridCol;
  energyCtx.lineWidth = 1.2;
  energyCtx.beginPath();
  energyCtx.moveTo(pad.l, zeroY);
  energyCtx.lineTo(w - pad.r, zeroY);
  energyCtx.stroke();

  energyCtx.fillStyle = textCol;
  energyCtx.font = '12px ui-monospace, Consolas, monospace';
  energyCtx.fillText('0 (탈출 경계)', pad.l + 6, Math.max(pad.t + 14, zeroY - 5));

  const drawCurve = (key, color, dashed = false) => {
    energyCtx.save();
    energyCtx.strokeStyle = color;
    energyCtx.lineWidth = 2.4;
    if (dashed) energyCtx.setLineDash([7, 5]);
    energyCtx.beginPath();
    history.forEach((pt, i) => {
      const x = pad.l + (i / (history.length - 1)) * pw;
      const y = toY(pt[key]);
      if (i === 0) energyCtx.moveTo(x, y);
      else energyCtx.lineTo(x, y);
    });
    energyCtx.stroke();
    energyCtx.restore();
  };

  drawCurve('u', uCol);
  drawCurve('k', kCol);
  drawCurve('e', eCol, true);

  // Legend
  const legendItems = [
    ['운동 K', kCol],
    ['위치 U', uCol],
    ['총 에너지 E = K + U', eCol]
  ];
  let lx = pad.l;
  const ly = h - 11;
  energyCtx.font = '700 13px "Gmarket Sans", sans-serif';
  for (const [label, col] of legendItems) {
    energyCtx.fillStyle = col;
    energyCtx.fillRect(lx, ly - 10, 14, 4);
    energyCtx.fillStyle = textCol;
    energyCtx.fillText(label, lx + 20, ly - 4);
    lx += energyCtx.measureText(label).width + 44;
  }
}

function renderAll() {
  renderer.render(sim, {
    showGrid,
    showEquipotential,
    showField,
    showKeplerSectors,
    wellDepth,
    slingshot: slingshot.active ? slingshot : null,
    prediction: slingshotPrediction
  });
  updateTelemetry();
}

function loop(nowMs) {
  if (!lastFrameMs) lastFrameMs = nowMs;
  const realDt = Math.min(0.05, (nowMs - lastFrameMs) / 1000);
  lastFrameMs = nowMs;

  if (playing) {
    const simDt = sim.dt * speedMultiplier * (realDt * 60);
    const prevCount = sim.bodies.length;
    stepSimulation(sim, simDt);
    if (sim.bodies.length !== prevCount) syncBodyChips();
    recordHistorySample(false);
    uiSyncAcc += realDt;
    renderer.render(sim, {
      showGrid,
      showEquipotential,
      showField,
      showKeplerSectors,
      wellDepth,
      slingshot: slingshot.active ? slingshot : null,
      prediction: slingshotPrediction
    });
    if (uiSyncAcc >= 0.08) {
      uiSyncAcc = 0;
      updateTelemetry();
    }
  } else {
    renderer.render(sim, {
      showGrid,
      showEquipotential,
      showField,
      showKeplerSectors,
      wellDepth,
      slingshot: slingshot.active ? slingshot : null,
      prediction: slingshotPrediction
    });
  }
  rafId = requestAnimationFrame(loop);
}

// Canvas pointer interactions (Slingshot launch OR 3D camera orbit + click-to-select)
function pickBodyAtScreen(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  const m = renderer.getMetrics(sim);
  let closest = null;
  let bestDist = 26;
  for (const b of sim.bodies) {
    const p = renderer.project(b.x, b.y, 0, m);
    const d = Math.hypot(p.x - sx, p.y - sy);
    if (d < bestDist) {
      bestDist = d;
      closest = b;
    }
  }
  return closest;
}

canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('pointerdown', e => {
  canvas.setPointerCapture(e.pointerId);
  const forceOrbit = e.button === 2 || e.shiftKey || dragMode === 'orbit';
  if (forceOrbit) {
    camDrag.active = true;
    camDrag.pointerId = e.pointerId;
    camDrag.lastX = e.clientX;
    camDrag.lastY = e.clientY;
    camDrag.moved = false;
    return;
  }

  const worldPt = renderer.screenToWorld(e.clientX, e.clientY, sim);
  slingshot.active = true;
  slingshot.pointerId = e.pointerId;
  slingshot.startScreenX = e.clientX;
  slingshot.startScreenY = e.clientY;
  slingshot.wx = worldPt.x;
  slingshot.wy = worldPt.y;
  slingshot.vx = 0;
  slingshot.vy = 0;
  slingshotPrediction = predictTrajectory(sim, slingshot.wx, slingshot.wy, 0, 0, 220, 0.008);
});

canvas.addEventListener('pointermove', e => {
  if (camDrag.active && camDrag.pointerId === e.pointerId) {
    const dx = e.clientX - camDrag.lastX;
    const dy = e.clientY - camDrag.lastY;
    if (Math.hypot(dx, dy) > 2) camDrag.moved = true;
    camDrag.lastX = e.clientX;
    camDrag.lastY = e.clientY;
    renderer.camera.yaw -= dx * 0.007;
    const nextPitch = Math.max(0, Math.min(78 * (Math.PI / 180), renderer.camera.pitch + dy * 0.007));
    renderer.camera.pitch = nextPitch;
    $('pitch-slider').value = String(Math.round((nextPitch * 180) / Math.PI));
    $('pitch-out').textContent = `${$('pitch-slider').value}°`;
    return;
  }

  if (slingshot.active && slingshot.pointerId === e.pointerId) {
    const worldNow = renderer.screenToWorld(e.clientX, e.clientY, sim);
    // Pull back like a slingshot -> launch opposite to drag vector
    const gain = 6.2;
    slingshot.vx = (slingshot.wx - worldNow.x) * gain;
    slingshot.vy = (slingshot.wy - worldNow.y) * gain;
    slingshotPrediction = predictTrajectory(sim, slingshot.wx, slingshot.wy, slingshot.vx, slingshot.vy, 220, 0.008);
  }
});

canvas.addEventListener('pointerup', e => {
  if (camDrag.active && camDrag.pointerId === e.pointerId) {
    if (!camDrag.moved) {
      const hit = pickBodyAtScreen(e.clientX, e.clientY);
      if (hit) {
        selectBody(sim, hit.id);
        if (followSelected) renderer.camera.followBodyId = hit.id;
        syncBodyChips();
        updateTelemetry();
      }
    }
    camDrag.active = false;
    camDrag.pointerId = null;
    return;
  }

  if (slingshot.active && slingshot.pointerId === e.pointerId) {
    const pullPx = Math.hypot(e.clientX - slingshot.startScreenX, e.clientY - slingshot.startScreenY);
    if (pullPx < 7) {
      // Short click selects nearby body or spawns circular orbiter if empty space
      const hit = pickBodyAtScreen(e.clientX, e.clientY);
      if (hit) {
        selectBody(sim, hit.id);
        if (followSelected) renderer.camera.followBodyId = hit.id;
        syncBodyChips();
        updateTelemetry();
      }
    } else {
      spawnBody(sim, spawnTemplateKey, slingshot.wx, slingshot.wy, slingshot.vx, slingshot.vy);
      if (followSelected) renderer.camera.followBodyId = sim.selectedBodyId;
      syncBodyChips();
      updateTelemetry();
    }
    slingshot.active = false;
    slingshot.pointerId = null;
    slingshotPrediction = null;
  }
});

canvas.addEventListener('pointercancel', () => {
  camDrag.active = false;
  slingshot.active = false;
  slingshotPrediction = null;
});

canvas.addEventListener(
  'wheel',
  e => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.91 : 1.1;
    renderer.camera.zoom = Math.max(0.35, Math.min(3.2, renderer.camera.zoom * factor));
  },
  { passive: false }
);

// Wire all buttons & inputs
document.querySelectorAll('.tabs button[data-scenario]').forEach(btn => {
  btn.addEventListener('click', () => loadScenario(btn.dataset.scenario));
});

$('play-btn').addEventListener('click', () => {
  playing = !playing;
  $('play-btn').setAttribute('aria-pressed', String(playing));
  $('play-btn').textContent = playing ? 'Ⅱ 일시정지' : '▶ 재생';
});

$('step-btn').addEventListener('click', () => {
  playing = false;
  $('play-btn').setAttribute('aria-pressed', 'false');
  $('play-btn').textContent = '▶ 재생';
  stepSimulation(sim, sim.dt * 12);
  recordHistorySample(true);
  renderAll();
});

$('reset-btn').addEventListener('click', () => loadScenario(sim.scenarioId));

$('zoom-in-btn').addEventListener('click', () => {
  renderer.camera.zoom = Math.min(3.2, renderer.camera.zoom * 1.18);
});
$('zoom-out-btn').addEventListener('click', () => {
  renderer.camera.zoom = Math.max(0.35, renderer.camera.zoom * 0.84);
});
$('cam-reset-btn').addEventListener('click', () => {
  renderer.camera.yaw = 0.55;
  renderer.camera.pitch = (sim.scenario.defaultPitch ?? 42) * (Math.PI / 180);
  renderer.camera.zoom = 1.0;
  renderer.camera.panX = 0;
  renderer.camera.panY = 0;
  followSelected = false;
  renderer.camera.followBodyId = null;
  $('follow-check').checked = false;
  $('pitch-slider').value = String(Math.round((renderer.camera.pitch * 180) / Math.PI));
  $('pitch-out').textContent = `${$('pitch-slider').value}°`;
});

$('mode-slingshot').addEventListener('click', () => {
  dragMode = 'slingshot';
  syncControlsFromState();
});
$('mode-orbit').addEventListener('click', () => {
  dragMode = 'orbit';
  syncControlsFromState();
});

document.querySelectorAll('#template-chips button').forEach(btn => {
  btn.addEventListener('click', () => {
    spawnTemplateKey = btn.dataset.template;
    document.querySelectorAll('#template-chips button').forEach(b => {
      b.setAttribute('aria-pressed', String(b === btn));
    });
  });
});

$('pitch-slider').addEventListener('input', e => {
  const deg = Number(e.target.value);
  renderer.camera.pitch = (deg * Math.PI) / 180;
  $('pitch-out').textContent = `${deg}°`;
});

$('well-slider').addEventListener('input', e => {
  wellDepth = Number(e.target.value);
  $('well-out').textContent = `${wellDepth.toFixed(2)}×`;
});

$('mass-slider').addEventListener('input', e => {
  const factor = Number(e.target.value);
  applyCentralMassScale(sim, factor);
  $('mass-out').textContent = `${factor.toFixed(2)}×`;
  updateTelemetry();
});

$('speed-slider').addEventListener('input', e => {
  speedMultiplier = Number(e.target.value);
  $('speed-out').textContent = `${speedMultiplier.toFixed(2)}×`;
});

$('opt-grid').addEventListener('change', e => { showGrid = e.target.checked; });
$('opt-equi').addEventListener('change', e => { showEquipotential = e.target.checked; });
$('opt-field').addEventListener('change', e => { showField = e.target.checked; });
$('opt-kepler').addEventListener('change', e => {
  showKeplerSectors = e.target.checked;
  sim.keplerEnabled = showKeplerSectors;
  if (!showKeplerSectors) {
    sim.keplerSectors = [];
    sim.currentSector = null;
  }
});
$('opt-gr').addEventListener('change', e => { sim.relativityEnabled = e.target.checked; });
$('opt-collision').addEventListener('change', e => { sim.collisionsEnabled = e.target.checked; });

$('follow-check').addEventListener('change', e => {
  followSelected = e.target.checked;
  renderer.camera.followBodyId = followSelected ? sim.selectedBodyId : null;
  if (!followSelected) {
    renderer.camera.panX = 0;
    renderer.camera.panY = 0;
  }
});

$('thrust-pro').addEventListener('click', () => {
  applyImpulse(sim, sim.selectedBodyId, 'prograde', 0.14);
  updateTelemetry();
});
$('thrust-retro').addEventListener('click', () => {
  applyImpulse(sim, sim.selectedBodyId, 'retrograde', 0.14);
  updateTelemetry();
});
$('thrust-circ').addEventListener('click', () => {
  applyImpulse(sim, sim.selectedBodyId, 'circularize');
  updateTelemetry();
});
$('special-action').addEventListener('click', () => {
  if (sim.scenarioId === 'figure8') {
    applyImpulse(sim, 'body1', 'perturbChaos');
  } else if (sim.scenarioId === 'hohmann') {
    applyImpulse(sim, 'spacecraft', 'hohmannTransfer');
  }
  updateTelemetry();
});

// Observation Notebook & CSV Export
function renderRecords() {
  const list = $('records-list');
  if (!records.length) {
    const p = document.createElement('p');
    p.className = 'caption';
    p.textContent = '아직 저장한 기록이 없습니다. 원하는 순간에 "현재 궤도 기록"을 눌러 보세요.';
    list.replaceChildren(p);
    return;
  }
  list.replaceChildren(
    ...records.slice().reverse().map(r => {
      const div = document.createElement('div');
      div.className = 'record-item';
      const title = document.createElement('strong');
      title.textContent = `${r.scenario} · ${r.body} (t = ${r.t} yr)`;
      const detail = document.createElement('span');
      detail.textContent = `v=${r.speed} km/s, r=${r.dist} AU, e=${r.ecc}, ${r.state}`;
      div.append(title, detail);
      return div;
    })
  );
}

$('record-btn').addEventListener('click', () => {
  const body = sim.bodies.find(b => b.id === sim.selectedBodyId) || sim.bodies[0];
  if (!body) return;
  const el = computeOrbitalElements(body, sim);
  records.push({
    scenario: sim.scenario.shortTitle,
    body: body.name.split('(')[0].trim(),
    t: sim.t.toFixed(2),
    speed: el.speedKms.toFixed(2),
    dist: el.r.toFixed(3),
    ecc: el.e.toFixed(3),
    a: el.bound ? el.a.toFixed(3) : 'Inf',
    state: el.typeLabel
  });
  if (records.length > 40) records.shift();
  saveRecords();
  renderRecords();
});

$('csv-btn').addEventListener('click', () => {
  const header = 'scenario,body,t_yr,speed_kms,distance_AU,eccentricity,semi_major_AU,orbit_state';
  const lines = records.map(r =>
    [r.scenario, r.body, r.t, r.speed, r.dist, r.ecc, r.a, r.state]
      .map(s => `"${String(s).replaceAll('"', '""')}"`)
      .join(',')
  );
  const blob = new Blob(['\uFEFF' + [header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'arcadia-gravity-observations.csv';
  a.click();
  URL.revokeObjectURL(a.href);
});

// Interactive 5-Question Quiz
function renderQuiz() {
  const q = QUIZ_ITEMS[quizIndex];
  $('quiz-counter').textContent = `${quizIndex + 1} / ${QUIZ_ITEMS.length}`;
  $('quiz-question').textContent = q.question;
  $('quiz-feedback').textContent = '';
  $('quiz-next').hidden = true;
  quizAnswered = false;

  $('quiz-options').replaceChildren(
    ...q.options.map((opt, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${idx + 1}. ${opt}`;
      btn.addEventListener('click', () => {
        if (quizAnswered) return;
        quizAnswered = true;
        const correct = idx === q.answer;
        btn.setAttribute('aria-pressed', 'true');
        $('quiz-feedback').textContent = (correct ? '정답입니다! ' : '다시 확인해 보세요. ') + q.explanation;
        $('quiz-next').hidden = false;
      });
      return btn;
    })
  );
}

$('quiz-next').addEventListener('click', () => {
  quizIndex = (quizIndex + 1) % QUIZ_ITEMS.length;
  renderQuiz();
});

// Theme Toggle
$('theme').addEventListener('click', () => {
  const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  document.body.dataset.theme = next;
  $('theme').textContent = next === 'dark' ? '밝은 테마' : '어두운 테마';
  $('theme').setAttribute('aria-label', next === 'dark' ? '밝은 테마로 전환' : '어두운 테마로 전환');
  renderAll();
});

// Render model source links
$('sources-links').innerHTML = MODEL_SOURCES
  .map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`)
  .join(' · ');

// Boot
syncControlsFromState();
recordHistorySample(true);
renderRecords();
renderQuiz();
renderAll();
rafId = requestAnimationFrame(loop);
