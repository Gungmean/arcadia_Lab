export const G0 = 4 * Math.PI * Math.PI; // AU^3 / (M_sun * yr^2)
export const AU_PER_YR_TO_KMS = 4.74047046; // 1 AU/yr in km/s

export const BODY_TEMPLATES = {
  probe: {
    idPrefix: 'probe',
    label: '탐사선',
    kind: 'probe',
    mass: 1e-7,
    radius: 0.06,
    color: '#38bdf8',
    trailColor: '#60a5df'
  },
  asteroid: {
    idPrefix: 'comet',
    label: '혜성·소행성',
    kind: 'comet',
    mass: 1e-6,
    radius: 0.075,
    color: '#e2e8f0',
    trailColor: '#94a3b8'
  },
  terrestrial: {
    idPrefix: 'planet',
    label: '지구형 행성',
    kind: 'planet',
    mass: 3e-5,
    radius: 0.11,
    color: '#34d399',
    trailColor: '#10b981'
  },
  gasGiant: {
    idPrefix: 'giant',
    label: '목성형 행성',
    kind: 'giant',
    mass: 0.025,
    radius: 0.17,
    color: '#fbbf24',
    trailColor: '#f59e0b'
  },
  star: {
    idPrefix: 'star',
    label: '항성',
    kind: 'star',
    mass: 0.7,
    radius: 0.24,
    color: '#fde047',
    trailColor: '#facc15'
  },
  blackHole: {
    idPrefix: 'bh',
    label: '블랙홀',
    kind: 'blackhole',
    mass: 2.2,
    radius: 0.16,
    color: '#a855f7',
    trailColor: '#c084fc'
  }
};

export const SCENARIOS = {
  kepler: {
    id: 'kepler',
    shortTitle: '케플러 타원',
    title: '케플러 법칙과 타원 궤도',
    subtitle: '근일점과 원일점에서 속력이 변해도 같은 시간 동안 쓸고 간 면적과 총 역학적 에너지 E는 보존됩니다.',
    formula: 'T² / a³ = 4π² / GM   ·   dA / dt = L / (2m) = 일정',
    worldExtent: 3.8,
    baseDt: 0.004,
    softening: 0.015,
    defaultPitch: 42,
    defaultWellDepth: 0.9,
    defaults: {
      grid: true,
      equipotential: false,
      field: false,
      keplerSectors: true,
      relativity: false,
      collisions: true
    },
    selectedBodyId: 'comet',
    createBodies() {
      const mSun = 1.0;
      const vEarth = Math.sqrt(G0 * mSun / 1.0);
      // Eccentricity e = 0.60, rp = 0.72 AU, ra = 2.88 AU -> a = 1.80 AU
      const rpComet = 0.72;
      const aComet = 1.80;
      const vComet = Math.sqrt(G0 * mSun * (2 / rpComet - 1 / aComet));
      const rOuter = 2.35;
      const vOuter = Math.sqrt(G0 * mSun / rOuter);
      return [
        {
          id: 'sun',
          name: '중심 항성 (1.0 M☉)',
          kind: 'star',
          isPrimary: true,
          mass: mSun,
          radius: 0.22,
          x: 0, y: 0, vx: 0, vy: 0,
          color: '#fde047',
          trailColor: '#facc15'
        },
        {
          id: 'earth',
          name: '행성 A (원 궤도)',
          kind: 'planet',
          mass: 3e-6,
          radius: 0.10,
          x: 1.0, y: 0, vx: 0, vy: vEarth,
          color: '#38bdf8',
          trailColor: '#60a5df'
        },
        {
          id: 'comet',
          name: '혜성 B (이심률 0.60)',
          kind: 'comet',
          mass: 1e-6,
          radius: 0.085,
          x: rpComet, y: 0, vx: 0, vy: vComet,
          color: '#f8fafc',
          trailColor: '#bae6fd'
        },
        {
          id: 'outer',
          name: '외행성 C (a = 2.35 AU)',
          kind: 'giant',
          mass: 9e-4,
          radius: 0.15,
          x: -rOuter * 0.7, y: rOuter * Math.sqrt(1 - 0.49),
          vx: -vOuter * Math.sqrt(1 - 0.49), vy: -vOuter * 0.7,
          color: '#fbbf24',
          trailColor: '#f59e0b'
        }
      ];
    }
  },

  blackhole: {
    id: 'blackhole',
    shortTitle: '블랙홀 세차',
    title: '블랙홀 강착과 일반상대론 근일점 세차',
    subtitle: '강한 중력장에서는 뉴턴 역학의 닫힌 타원이 유지되지 않고 근일점이 공전 방향으로 서서히 회전(세차 운동)합니다.',
    formula: 'Δω ≈ 6πGM / [a(1 − e²) c²]   ·   V_eff(r) = −GM/r − GML²/(c²r³)',
    worldExtent: 3.4,
    baseDt: 0.0032,
    softening: 0.02,
    cEff: 62.0,
    defaultPitch: 56,
    defaultWellDepth: 1.25,
    defaults: {
      grid: true,
      equipotential: false,
      field: false,
      keplerSectors: false,
      relativity: true,
      collisions: true
    },
    selectedBodyId: 's2star',
    createBodies() {
      const mBH = 2.5;
      const rp = 0.63;
      const a = 1.50;
      const vS2 = Math.sqrt(G0 * mBH * (2 / rp - 1 / a));
      const rOuter = 2.35;
      const vOuter = Math.sqrt(G0 * mBH / rOuter);
      return [
        {
          id: 'bh',
          name: '초대질량 블랙홀',
          kind: 'blackhole',
          isPrimary: true,
          mass: mBH,
          radius: 0.21,
          x: 0, y: 0, vx: 0, vy: 0,
          color: '#a855f7',
          trailColor: '#c084fc'
        },
        {
          id: 's2star',
          name: '근접 항성 S2 (세차)',
          kind: 'star',
          mass: 4e-4,
          radius: 0.105,
          x: rp, y: 0, vx: 0, vy: vS2,
          color: '#60a5df',
          trailColor: '#60a5df'
        },
        {
          id: 'outer_bh',
          name: '외곽 항성',
          kind: 'planet',
          mass: 2e-4,
          radius: 0.09,
          x: -rOuter, y: 0, vx: 0, vy: -vOuter,
          color: '#34d399',
          trailColor: '#34d399'
        }
      ];
    },
    createInitialParticles() {
      // Swirling accretion disk particles around central black hole
      const parts = [];
      const mBH = 2.5;
      for (let i = 0; i < 68; i++) {
        const frac = i / 68;
        const r = 0.34 + 0.56 * Math.pow(frac, 0.85);
        const ang = i * 2.399963; // golden angle spiral
        const v = Math.sqrt(G0 * mBH / r);
        parts.push({
          x: Math.cos(ang) * r,
          y: Math.sin(ang) * r,
          vx: -Math.sin(ang) * v,
          vy: Math.cos(ang) * v,
          size: 1.6 + (1 - frac) * 1.4,
          color: frac < 0.35 ? '#fef08a' : frac < 0.7 ? '#fb923c' : '#c084fc',
          alpha: 0.55 + (1 - frac) * 0.35
        });
      }
      return parts;
    }
  },

  binary: {
    id: 'binary',
    shortTitle: '쌍성계·로슈 엽',
    title: '쌍성계 질량 중심 공전과 등퍼텐셜 로슈 엽',
    subtitle: '두 별은 공통 질량 중심(Barycenter)을 중심으로 서로 끌어당기며 돌고, 등퍼텐셜선은 라그랑주 점과 로슈 엽을 드러냅니다.',
    formula: 'm₁r₁ = m₂r₂   ·   Φ(r) = −G(m₁/r₁ + m₂/r₂)',
    worldExtent: 4.0,
    baseDt: 0.0035,
    softening: 0.02,
    defaultPitch: 44,
    defaultWellDepth: 0.95,
    defaults: {
      grid: true,
      equipotential: true,
      field: false,
      keplerSectors: false,
      relativity: false,
      collisions: true
    },
    selectedBodyId: 'starB',
    createBodies() {
      const m1 = 1.2;
      const m2 = 0.6;
      const mt = m1 + m2;
      const sep = 1.15;
      const vRel = Math.sqrt(G0 * mt / sep);
      const x1 = -sep * (m2 / mt);
      const x2 = sep * (m1 / mt);
      const vy1 = -vRel * (m2 / mt);
      const vy2 = vRel * (m1 / mt);
      const rCircumbinary = 2.65;
      const vPlanet = Math.sqrt(G0 * mt / rCircumbinary);
      return [
        {
          id: 'starA',
          name: '주성 A (1.2 M☉)',
          kind: 'star',
          isPrimary: true,
          mass: m1,
          radius: 0.20,
          x: x1, y: 0, vx: 0, vy: vy1,
          color: '#fde047',
          trailColor: '#facc15'
        },
        {
          id: 'starB',
          name: '반성 B (0.6 M☉)',
          kind: 'star',
          mass: m2,
          radius: 0.155,
          x: x2, y: 0, vx: 0, vy: vy2,
          color: '#fb923c',
          trailColor: '#fb7185'
        },
        {
          id: 'circumbinary',
          name: '쌍성 주위 행성',
          kind: 'planet',
          mass: 2e-5,
          radius: 0.105,
          x: 0, y: rCircumbinary, vx: -vPlanet, vy: 0,
          color: '#38bdf8',
          trailColor: '#60a5df'
        }
      ];
    }
  },

  figure8: {
    id: 'figure8',
    shortTitle: '3체 8자 카오스',
    title: '삼체 문제: 8자 주기 궤도와 결정론적 카오스',
    subtitle: '동일 질량의 세 별이 완벽한 8자(Figure-8) 궤도를 추다가, 초기 속력을 0.5%만 섭동해도 혼돈 산란으로 붕괴합니다.',
    formula: 'aᵢ = Σⱼ≠ᵢ G mⱼ (rⱼ − rᵢ) / |rⱼ − rᵢ|³   (초기 조건에 극도로 민감)',
    worldExtent: 2.8,
    baseDt: 0.002,
    softening: 1e-5,
    defaultPitch: 36,
    defaultWellDepth: 0.72,
    defaults: {
      grid: true,
      equipotential: false,
      field: false,
      keplerSectors: false,
      relativity: false,
      collisions: false
    },
    selectedBodyId: 'body1',
    createBodies() {
      // Chenciner & Montgomery (2000) scaled to S = 1.45 AU, m = 1.0 M_sun, G = 4pi^2
      const S = 1.45;
      const vScale = Math.sqrt(G0 / S);
      const x1 = 0.97000436 * S;
      const y1 = -0.24308753 * S;
      const vx3 = -0.93240737 * vScale;
      const vy3 = -0.86473146 * vScale;
      return [
        {
          id: 'body1',
          name: '천체 1 (1.0 M☉)',
          kind: 'star',
          mass: 1.0,
          radius: 0.145,
          x: x1, y: y1, vx: -vx3 / 2, vy: -vy3 / 2,
          color: '#60a5df',
          trailColor: '#60a5df'
        },
        {
          id: 'body2',
          name: '천체 2 (1.0 M☉)',
          kind: 'star',
          mass: 1.0,
          radius: 0.145,
          x: -x1, y: -y1, vx: -vx3 / 2, vy: -vy3 / 2,
          color: '#fde047',
          trailColor: '#facc15'
        },
        {
          id: 'body3',
          name: '천체 3 (1.0 M☉)',
          kind: 'star',
          mass: 1.0,
          radius: 0.145,
          x: 0, y: 0, vx: vx3, vy: vy3,
          color: '#f472b6',
          trailColor: '#ba67f3'
        }
      ];
    }
  },

  roche: {
    id: 'roche',
    shortTitle: '로슈 한계 고리',
    title: '로슈 한계와 조석력에 의한 행성 고리 형성',
    subtitle: '연약한 위성이 행성의 로슈 한계(d < d_R) 안으로 들어가면 조석력이 자체 중력을 이겨 산산조각 나며 고리를 형성합니다.',
    formula: 'd_R ≈ 2.44 R_M (ρ_M / ρ_m)^(1/3)   ·   Δg_조석 ≈ 2GMR_m / d³',
    worldExtent: 3.4,
    baseDt: 0.003,
    softening: 0.01,
    rocheRadius: 1.48,
    defaultPitch: 54,
    defaultWellDepth: 0.9,
    defaults: {
      grid: true,
      equipotential: false,
      field: false,
      keplerSectors: false,
      relativity: false,
      collisions: true
    },
    selectedBodyId: 'moon_fragile',
    createBodies() {
      const mGiant = 1.2;
      // Start fragile icy moon approaching perihelion below d_R = 1.48 AU so it enters Roche zone within ~0.6 yr
      const r0 = 1.85;
      const mu = G0 * mGiant;
      // Tangential + slight inward velocity placing periapsis at ~1.10 AU (< 1.48 AU)
      const vCirc = Math.sqrt(mu / r0);
      const vx0 = -vCirc * 0.42;
      const vy0 = vCirc * 0.74;
      const rOuter = 2.65;
      const vOuter = Math.sqrt(mu / rOuter);
      return [
        {
          id: 'giant',
          name: '모행성 (거대 가스 행성)',
          kind: 'giant',
          isPrimary: true,
          mass: mGiant,
          radius: 0.44,
          x: 0, y: 0, vx: 0, vy: 0,
          color: '#fbbf24',
          trailColor: '#f59e0b'
        },
        {
          id: 'moon_fragile',
          name: '얼음 위성 (로슈 한계 접근)',
          kind: 'comet',
          fragile: true,
          rocheTargetId: 'giant',
          rocheLimit: 1.48,
          mass: 1e-5,
          radius: 0.115,
          x: r0, y: 0, vx: vx0, vy: vy0,
          color: '#7dd3fc',
          trailColor: '#38bdf8'
        },
        {
          id: 'shepherd',
          name: '안정 외곽 위성',
          kind: 'planet',
          mass: 2e-5,
          radius: 0.095,
          x: 0, y: -rOuter, vx: vOuter, vy: 0,
          color: '#a7f3d0',
          trailColor: '#34d399'
        }
      ];
    }
  },

  hohmann: {
    id: 'hohmann',
    shortTitle: '호만 전이·스윙바이',
    title: '호만 전이 궤도와 중력 도움(스윙바이)',
    subtitle: '탐사선의 Δv 분사 버튼을 눌러 근지점에서 순방향 가속(타원 팽창) 또는 원궤도 진입을 직접 조종해 보세요.',
    formula: 'Δv₁ = √(μ/r₁)[√(2r₂/(r₁+r₂)) − 1]   ·   E = K + U = −GMm/(2a)',
    worldExtent: 3.6,
    baseDt: 0.0035,
    softening: 0.015,
    defaultPitch: 32,
    defaultWellDepth: 0.85,
    defaults: {
      grid: true,
      equipotential: false,
      field: true,
      keplerSectors: false,
      relativity: false,
      collisions: true
    },
    selectedBodyId: 'spacecraft',
    createBodies() {
      const mSun = 1.0;
      const r1 = 0.95;
      const r2 = 2.40;
      const v1 = Math.sqrt(G0 * mSun / r1);
      const v2 = Math.sqrt(G0 * mSun / r2);
      return [
        {
          id: 'sun',
          name: '중심 항성 (1.0 M☉)',
          kind: 'star',
          isPrimary: true,
          mass: mSun,
          radius: 0.21,
          x: 0, y: 0, vx: 0, vy: 0,
          color: '#fde047',
          trailColor: '#facc15'
        },
        {
          id: 'inner_planet',
          name: '출발 행성 (r₁ = 0.95 AU)',
          kind: 'planet',
          mass: 3e-5,
          radius: 0.10,
          x: r1, y: 0, vx: 0, vy: v1,
          color: '#34d399',
          trailColor: '#10b981'
        },
        {
          id: 'spacecraft',
          name: '아르카디아 탐사선',
          kind: 'probe',
          mass: 1e-8,
          radius: 0.085,
          x: r1 * 0.96, y: 0.28, vx: -v1 * 0.28, vy: v1 * 0.96,
          color: '#38bdf8',
          trailColor: '#60a5df'
        },
        {
          id: 'target_giant',
          name: '목표 거대행성 (r₂ = 2.40 AU)',
          kind: 'giant',
          mass: 0.035,
          radius: 0.185,
          x: -r2 * 0.65, y: r2 * Math.sqrt(1 - 0.65 * 0.65),
          vx: -v2 * Math.sqrt(1 - 0.65 * 0.65), vy: -v2 * 0.65,
          color: '#fbbf24',
          trailColor: '#f59e0b'
        }
      ];
    }
  }
};

export function createSimulation(scenarioId = 'kepler', overrides = {}) {
  const scenario = SCENARIOS[scenarioId] || SCENARIOS.kepler;
  const bodies = scenario.createBodies().map((b, index) => ({
    ...b,
    baseMass: b.mass,
    trail: [{ x: b.x, y: b.y }],
    burnTimer: 0,
    order: index
  }));
  const particles = scenario.createInitialParticles ? scenario.createInitialParticles() : [];

  const sim = {
    scenarioId: scenario.id,
    scenario,
    t: 0,
    dt: scenario.baseDt,
    softening: scenario.softening ?? 0.015,
    cEff: scenario.cEff ?? 80.0,
    gScale: overrides.gScale ?? 1.0,
    centralMassScale: overrides.centralMassScale ?? 1.0,
    worldExtent: scenario.worldExtent ?? 3.6,
    relativityEnabled: overrides.relativityEnabled ?? scenario.defaults.relativity,
    collisionsEnabled: overrides.collisionsEnabled ?? scenario.defaults.collisions,
    tidalEnabled: overrides.tidalEnabled ?? true,
    keplerEnabled: overrides.keplerEnabled ?? scenario.defaults.keplerSectors,
    bodies,
    particles,
    events: [],
    nextSpawnCounter: 1,
    selectedBodyId: scenario.selectedBodyId || bodies[0]?.id || null,
    // Kepler 2nd law swept sectors
    keplerSectors: [],
    currentSector: null,
    sectorInterval: 0.12,
    sectorElapsed: 0,
    sectorPaletteIndex: 0,
    rocheTriggered: false,
    initialEnergy: 0
  };

  sim.initialEnergy = computeSystemEnergy(sim).total;
  return sim;
}

export function getPrimaryBody(sim) {
  if (!sim.bodies.length) return null;
  const flagged = sim.bodies.find(b => b.isPrimary);
  if (flagged) return flagged;
  let best = sim.bodies[0];
  for (const b of sim.bodies) {
    if (b.mass > best.mass) best = b;
  }
  return best;
}

export function applyCentralMassScale(sim, factor) {
  sim.centralMassScale = factor;
  const primary = getPrimaryBody(sim);
  if (primary && typeof primary.baseMass === 'number') {
    primary.mass = primary.baseMass * factor;
  }
}

export function selectBody(sim, bodyId) {
  if (sim.selectedBodyId === bodyId) return;
  sim.selectedBodyId = bodyId;
  sim.keplerSectors = [];
  sim.currentSector = null;
  sim.sectorElapsed = 0;
}

export function computeAccelerations(bodies, sim, gEff, softeningSq) {
  const n = bodies.length;
  const ax = new Float64Array(n);
  const ay = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const bi = bodies[i];
    for (let j = i + 1; j < n; j++) {
      const bj = bodies[j];
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const r2 = dx * dx + dy * dy + softeningSq;
      const invR3 = 1 / (r2 * Math.sqrt(r2));
      const f = gEff * invR3;
      ax[i] += f * bj.mass * dx;
      ay[i] += f * bj.mass * dy;
      ax[j] -= f * bi.mass * dx;
      ay[j] -= f * bi.mass * dy;
    }
  }

  // Optional 1PN General Relativity radial precession force relative to primary attractor
  if (sim.relativityEnabled && n >= 2) {
    const primaryIdx = bodies.findIndex(b => b.isPrimary);
    const pIdx = primaryIdx >= 0 ? primaryIdx : 0;
    const p = bodies[pIdx];
    const c2 = sim.cEff * sim.cEff;
    for (let i = 0; i < n; i++) {
      if (i === pIdx) continue;
      const b = bodies[i];
      const rx = b.x - p.x;
      const ry = b.y - p.y;
      const r2 = rx * rx + ry * ry + softeningSq;
      const r = Math.sqrt(r2);
      const rvx = b.vx - p.vx;
      const rvy = b.vy - p.vy;
      const lz = rx * rvy - ry * rvx;
      // Derived from V_GR(r) = -G M L^2 / (c^2 r^3) => a_GR = -3 G M L^2 / (c^2 r^5) * r_vec
      const factor = (-3 * gEff * (p.mass + b.mass) * lz * lz) / (c2 * r2 * r2 * r);
      const arx = factor * rx;
      const ary = factor * ry;
      ax[i] += arx;
      ay[i] += ary;
      if (p.mass > 0) {
        const react = b.mass / p.mass;
        ax[pIdx] -= arx * react;
        ay[pIdx] -= ary * react;
      }
    }
  }

  return { ax, ay };
}

// 4th-order Symplectic Yoshida integrator constants
const CBRT2 = Math.cbrt(2);
const W1 = 1 / (2 - CBRT2);
const W0 = -CBRT2 / (2 - CBRT2);
const C_YOSHIDA = [W1 / 2, (W0 + W1) / 2, (W0 + W1) / 2, W1 / 2];
const D_YOSHIDA = [W1, W0, W1];

function stepBodiesYoshida(sim, h) {
  const bodies = sim.bodies;
  const n = bodies.length;
  const gEff = G0 * sim.gScale;
  const epsSq = sim.softening * sim.softening;

  for (let stage = 0; stage < 3; stage++) {
    const c = C_YOSHIDA[stage];
    const d = D_YOSHIDA[stage];
    for (let i = 0; i < n; i++) {
      bodies[i].x += c * h * bodies[i].vx;
      bodies[i].y += c * h * bodies[i].vy;
    }
    const { ax, ay } = computeAccelerations(bodies, sim, gEff, epsSq);
    for (let i = 0; i < n; i++) {
      bodies[i].vx += d * h * ax[i];
      bodies[i].vy += d * h * ay[i];
    }
  }
  const cLast = C_YOSHIDA[3];
  for (let i = 0; i < n; i++) {
    bodies[i].x += cLast * h * bodies[i].vx;
    bodies[i].y += cLast * h * bodies[i].vy;
  }

  // Advance lightweight accretion/ring particles via Velocity Verlet
  if (sim.particles.length > 0) {
    const massive = bodies.filter(b => b.mass >= 1e-4 || b.isPrimary);
    const sources = massive.length ? massive : bodies;
    const pSoft = Math.max(epsSq, 0.0025);
    for (let pIdx = 0; pIdx < sim.particles.length; pIdx++) {
      const pt = sim.particles[pIdx];
      let pax1 = 0, pay1 = 0;
      for (let m = 0; m < sources.length; m++) {
        const s = sources[m];
        const dx = s.x - pt.x;
        const dy = s.y - pt.y;
        const r2 = dx * dx + dy * dy + pSoft;
        const f = (gEff * s.mass) / (r2 * Math.sqrt(r2));
        pax1 += f * dx;
        pay1 += f * dy;
      }
      pt.x += pt.vx * h + 0.5 * pax1 * h * h;
      pt.y += pt.vy * h + 0.5 * pay1 * h * h;
      let pax2 = 0, pay2 = 0;
      for (let m = 0; m < sources.length; m++) {
        const s = sources[m];
        const dx = s.x - pt.x;
        const dy = s.y - pt.y;
        const r2 = dx * dx + dy * dy + pSoft;
        const f = (gEff * s.mass) / (r2 * Math.sqrt(r2));
        pax2 += f * dx;
        pay2 += f * dy;
      }
      pt.vx += 0.5 * (pax1 + pax2) * h;
      pt.vy += 0.5 * (pay1 + pay2) * h;
    }
  }
}

function handleRocheDisruption(sim) {
  if (!sim.tidalEnabled) return;
  for (let i = sim.bodies.length - 1; i >= 0; i--) {
    const moon = sim.bodies[i];
    if (!moon.fragile || moon.disrupted) continue;
    const target = sim.bodies.find(b => b.id === moon.rocheTargetId) || getPrimaryBody(sim);
    if (!target || target === moon) continue;
    const dx = moon.x - target.x;
    const dy = moon.y - target.y;
    const d = Math.hypot(dx, dy);
    const rocheR = moon.rocheLimit ?? (target.radius * 3.36);
    if (d <= rocheR) {
      moon.disrupted = true;
      const ux = dx / (d || 1);
      const uy = dy / (d || 1);
      const tx = -uy;
      const ty = ux;
      const gEff = G0 * sim.gScale;
      const relVx = moon.vx - target.vx;
      const relVy = moon.vy - target.vy;
      const count = 72;
      for (let k = 0; k < count; k++) {
        const f = (k / (count - 1)) * 2 - 1; // [-1, 1] tidal elongation across moon diameter
        const jitterR = ((k * 37) % 19 - 9) * 0.008;
        const radialOffset = f * moon.radius * 1.45 + jitterR;
        const tangentOffset = Math.sin(k * 1.7) * moon.radius * 0.45;
        const px = moon.x + ux * radialOffset + tx * tangentOffset;
        const py = moon.y + uy * radialOffset + ty * tangentOffset;
        const rLocal = Math.hypot(px - target.x, py - target.y);
        // Slightly spread Keplerian orbital speed differential -> shears smoothly into a ring
        const keplerRatio = Math.sqrt(d / Math.max(0.4, rLocal));
        const tangentialShear = ((k * 53) % 13 - 6) * 0.035;
        const vx = target.vx + relVx * keplerRatio + tx * tangentialShear + ux * f * 0.14;
        const vy = target.vy + relVy * keplerRatio + ty * tangentialShear + uy * f * 0.14;
        sim.particles.push({
          x: px,
          y: py,
          vx,
          vy,
          size: 1.5 + (k % 4) * 0.45,
          color: k % 3 === 0 ? '#bae6fd' : k % 3 === 1 ? '#7dd3fc' : '#e0f2fe',
          alpha: 0.72 + (k % 3) * 0.09
        });
      }
      sim.bodies.splice(i, 1);
      sim.rocheTriggered = true;
      // Re-baseline energy after non-conservative tracer fragmentation into massless ring debris
      sim.initialEnergy = computeSystemEnergy(sim).total;
      sim.events.push({
        t: sim.t,
        kind: 'roche',
        message: `${moon.name}이(가) 로슈 한계(${rocheR.toFixed(2)} AU) 안쪽에서 조석 분열하여 고리를 형성했습니다.`
      });
      if (sim.selectedBodyId === moon.id) {
        sim.selectedBodyId = target.id;
      }
    }
  }
}

function handleCollisions(sim) {
  if (!sim.collisionsEnabled || sim.bodies.length < 2) return;
  for (let i = 0; i < sim.bodies.length; i++) {
    for (let j = i + 1; j < sim.bodies.length; j++) {
      const a = sim.bodies[i];
      const b = sim.bodies[j];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const minSep = (a.radius + b.radius) * 0.72;
      if (d < minSep) {
        const keep = a.mass >= b.mass ? a : b;
        const absorb = keep === a ? b : a;
        const totalM = keep.mass + absorb.mass;
        if (totalM > 0) {
          keep.vx = (keep.mass * keep.vx + absorb.mass * absorb.vx) / totalM;
          keep.vy = (keep.mass * keep.vy + absorb.mass * absorb.vy) / totalM;
          keep.x = (keep.mass * keep.x + absorb.mass * absorb.x) / totalM;
          keep.y = (keep.mass * keep.y + absorb.mass * absorb.y) / totalM;
        }
        keep.mass = totalM;
        if (keep.kind !== 'blackhole') {
          keep.radius = Math.min(0.45, Math.cbrt(Math.pow(keep.radius, 3) + Math.pow(absorb.radius, 3)));
        }
        const absorbIdx = sim.bodies.indexOf(absorb);
        sim.bodies.splice(absorbIdx, 1);
        // Re-baseline energy after inelastic mass merger
        sim.initialEnergy = computeSystemEnergy(sim).total;
        sim.events.push({
          t: sim.t,
          kind: 'collision',
          message: `${absorb.name}이(가) ${keep.name}에 충돌 병합되었습니다.`
        });
        if (sim.selectedBodyId === absorb.id) {
          sim.selectedBodyId = keep.id;
        }
        return;
      }
    }
  }
}

function updateKeplerSectors(sim, stepDt) {
  if (!sim.keplerEnabled) return;
  const focus = getPrimaryBody(sim);
  const body = sim.bodies.find(b => b.id === sim.selectedBodyId && b !== focus);
  if (!focus || !body) {
    sim.currentSector = null;
    return;
  }

  const rx = body.x - focus.x;
  const ry = body.y - focus.y;
  if (!sim.currentSector) {
    sim.currentSector = {
      focusX: focus.x,
      focusY: focus.y,
      points: [{ x: rx, y: ry }],
      lastSubX: rx,
      lastSubY: ry,
      area: 0,
      colorIndex: sim.sectorPaletteIndex
    };
    sim.sectorElapsed = 0;
    return;
  }

  const sec = sim.currentSector;
  const prevSubX = sec.lastSubX;
  const prevSubY = sec.lastSubY;
  const remaining = sim.sectorInterval - sim.sectorElapsed;

  if (sim.sectorElapsed + stepDt >= sim.sectorInterval - 1e-12) {
    const frac = Math.min(1, Math.max(0, remaining / stepDt));
    const bx = prevSubX + (rx - prevSubX) * frac;
    const by = prevSubY + (ry - prevSubY) * frac;
    sec.area += 0.5 * Math.abs(prevSubX * by - prevSubY * bx);
    sec.points.push({ x: bx, y: by });
    sec.focusX = focus.x;
    sec.focusY = focus.y;
    sim.keplerSectors.push(sec);
    if (sim.keplerSectors.length > 6) {
      sim.keplerSectors.shift();
    }
    sim.sectorPaletteIndex = (sim.sectorPaletteIndex + 1) % 6;

    const leftoverArea = 0.5 * Math.abs(bx * ry - by * rx);
    sim.currentSector = {
      focusX: focus.x,
      focusY: focus.y,
      points: [{ x: bx, y: by }],
      lastSubX: rx,
      lastSubY: ry,
      area: leftoverArea,
      colorIndex: sim.sectorPaletteIndex
    };
    if (Math.hypot(rx - bx, ry - by) > 1e-6) {
      sim.currentSector.points.push({ x: rx, y: ry });
    }
    sim.sectorElapsed = stepDt - remaining;
  } else {
    sec.area += 0.5 * Math.abs(prevSubX * ry - prevSubY * rx);
    sec.lastSubX = rx;
    sec.lastSubY = ry;
    sec.focusX = focus.x;
    sec.focusY = focus.y;
    const pts = sec.points;
    const lastSaved = pts[pts.length - 1];
    if (Math.hypot(rx - lastSaved.x, ry - lastSaved.y) > 0.025) {
      pts.push({ x: rx, y: ry });
    }
    sim.sectorElapsed += stepDt;
  }
}

export function stepSimulation(sim, totalDt, maxSubDt = 0.0025) {
  const steps = Math.max(1, Math.ceil(totalDt / maxSubDt));
  const h = totalDt / steps;
  for (let s = 0; s < steps; s++) {
    stepBodiesYoshida(sim, h);
    sim.t += h;
    updateKeplerSectors(sim, h);
    handleRocheDisruption(sim);
    handleCollisions(sim);
  }

  // Record orbital trails once per visual step
  for (const b of sim.bodies) {
    if (b.burnTimer > 0) b.burnTimer = Math.max(0, b.burnTimer - totalDt);
    const last = b.trail[b.trail.length - 1];
    if (!last || Math.hypot(b.x - last.x, b.y - last.y) > 0.025) {
      b.trail.push({ x: b.x, y: b.y });
      const maxTrail = sim.scenarioId === 'blackhole' ? 750 : 320;
      if (b.trail.length > maxTrail) b.trail.shift();
    }
  }
}

export function computeSystemEnergy(sim) {
  const bodies = sim.bodies;
  const gEff = G0 * sim.gScale;
  const epsSq = sim.softening * sim.softening;
  let kinetic = 0;
  let potential = 0;
  let totalMass = 0;
  let cmX = 0;
  let cmY = 0;

  for (let i = 0; i < bodies.length; i++) {
    const bi = bodies[i];
    const v2 = bi.vx * bi.vx + bi.vy * bi.vy;
    kinetic += 0.5 * bi.mass * v2;
    totalMass += bi.mass;
    cmX += bi.mass * bi.x;
    cmY += bi.mass * bi.y;

    for (let j = i + 1; j < bodies.length; j++) {
      const bj = bodies[j];
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const r = Math.sqrt(dx * dx + dy * dy + epsSq);
      potential -= (gEff * bi.mass * bj.mass) / r;
      if (sim.relativityEnabled) {
        const primary = getPrimaryBody(sim);
        if (bi === primary || bj === primary) {
          const other = bi === primary ? bj : bi;
          const rx = other.x - primary.x;
          const ry = other.y - primary.y;
          const rvx = other.vx - primary.vx;
          const rvy = other.vy - primary.vy;
          const lz = rx * rvy - ry * rvx;
          potential -= (gEff * (primary.mass + other.mass) * other.mass * lz * lz) / (sim.cEff * sim.cEff * r * r * r);
        }
      }
    }
  }

  const total = kinetic + potential;
  const barycenter = totalMass > 0 ? { x: cmX / totalMass, y: cmY / totalMass } : { x: 0, y: 0 };
  const drift = sim.initialEnergy !== 0 ? Math.abs((total - sim.initialEnergy) / sim.initialEnergy) : 0;
  return { kinetic, potential, total, barycenter, drift };
}

export function computeOrbitalElements(body, sim) {
  if (!body) return null;
  // Find dominant attractor other than the body itself
  let primary = null;
  let bestScore = -1;
  for (const cand of sim.bodies) {
    if (cand === body) continue;
    const dx = body.x - cand.x;
    const dy = body.y - cand.y;
    const r2 = dx * dx + dy * dy + 1e-6;
    const score = cand.mass / r2;
    if (score > bestScore) {
      bestScore = score;
      primary = cand;
    }
  }
  if (!primary) {
    const v = Math.hypot(body.vx, body.vy);
    return {
      primary: null,
      r: 0,
      v,
      speedKms: v * AU_PER_YR_TO_KMS,
      vCirc: 0,
      vEsc: 0,
      specificKinetic: 0.5 * v * v,
      specificPotential: 0,
      specificEnergy: 0.5 * v * v,
      angularMomentum: 0,
      a: Infinity,
      e: 0,
      rp: 0,
      ra: Infinity,
      period: Infinity,
      keplerRatio: null,
      bound: false,
      typeLabel: '단독 천체'
    };
  }

  const gEff = G0 * sim.gScale;
  const mu = gEff * (primary.mass + body.mass);
  const rx = body.x - primary.x;
  const ry = body.y - primary.y;
  const vx = body.vx - primary.vx;
  const vy = body.vy - primary.vy;
  const r = Math.hypot(rx, ry);
  const v2 = vx * vx + vy * vy;
  const v = Math.sqrt(v2);

  const specificKinetic = 0.5 * v2;
  const specificPotential = -mu / Math.max(r, 1e-6);
  const specificEnergy = specificKinetic + specificPotential;
  const h = rx * vy - ry * vx;

  // Eccentricity vector: e_vec = ((v^2 - mu/r) r_vec - (r.v) v_vec) / mu
  const rdotv = rx * vx + ry * vy;
  const ex = ((v2 - mu / Math.max(r, 1e-6)) * rx - rdotv * vx) / Math.max(mu, 1e-9);
  const ey = ((v2 - mu / Math.max(r, 1e-6)) * ry - rdotv * vy) / Math.max(mu, 1e-9);
  const e = Math.hypot(ex, ey);

  const vCirc = Math.sqrt(mu / Math.max(r, 1e-6));
  const vEsc = Math.sqrt(2 * mu / Math.max(r, 1e-6));

  let a = Infinity;
  let rp = r;
  let ra = Infinity;
  let period = Infinity;
  let keplerRatio = null;
  const bound = specificEnergy < 0 && e < 1;

  if (bound) {
    a = -mu / (2 * specificEnergy);
    rp = a * (1 - e);
    ra = a * (1 + e);
    period = 2 * Math.PI * Math.sqrt((a * a * a) / mu);
    keplerRatio = (period * period) / (a * a * a);
  } else {
    a = e > 1 ? -mu / (2 * Math.max(specificEnergy, 1e-9)) : Infinity;
  }

  let typeLabel = '탈출 쌍곡선 (E ≥ 0)';
  if (bound) {
    typeLabel = e < 0.03 ? '원형 궤도 (E < 0)' : '타원 궤도 (E < 0)';
  } else if (Math.abs(e - 1) < 0.02) {
    typeLabel = '포물선 탈출 한계';
  }

  return {
    primary,
    r,
    v,
    speedKms: v * AU_PER_YR_TO_KMS,
    vCirc,
    vEsc,
    vCircKms: vCirc * AU_PER_YR_TO_KMS,
    vEscKms: vEsc * AU_PER_YR_TO_KMS,
    specificKinetic,
    specificPotential,
    specificEnergy,
    kinetic: specificKinetic * body.mass,
    potential: specificPotential * body.mass,
    energy: specificEnergy * body.mass,
    angularMomentum: h,
    a,
    e,
    rp,
    ra,
    period,
    keplerRatio,
    bound,
    typeLabel
  };
}

export function applyImpulse(sim, bodyId, mode, deltaFactor = 0.14) {
  const body = sim.bodies.find(b => b.id === bodyId);
  if (!body) return { ok: false, reason: '선택된 천체가 없습니다.' };
  const primary = getPrimaryBody(sim);
  const rx = primary && primary !== body ? body.x - primary.x : body.x;
  const ry = primary && primary !== body ? body.y - primary.y : body.y;
  const vx = primary && primary !== body ? body.vx - primary.vx : body.vx;
  const vy = primary && primary !== body ? body.vy - primary.vy : body.vy;
  const v = Math.hypot(vx, vy);

  if (mode === 'prograde') {
    const dirX = v > 1e-5 ? vx / v : -ry / (Math.hypot(rx, ry) || 1);
    const dirY = v > 1e-5 ? vy / v : rx / (Math.hypot(rx, ry) || 1);
    const dv = Math.max(0.55, v * deltaFactor);
    body.vx += dirX * dv;
    body.vy += dirY * dv;
    body.burnTimer = 0.45;
  } else if (mode === 'retrograde') {
    if (v > 1e-5) {
      const dv = Math.min(v * 0.85, Math.max(0.45, v * deltaFactor));
      body.vx -= (vx / v) * dv;
      body.vy -= (vy / v) * dv;
      body.burnTimer = 0.45;
    }
  } else if (mode === 'circularize') {
    if (!primary || primary === body) return { ok: false, reason: '중심 천체는 원궤도화가 불가합니다.' };
    const r = Math.hypot(rx, ry);
    if (r < 1e-5) return { ok: false, reason: '중심과의 거리가 너무 가깝습니다.' };
    const vCirc = Math.sqrt((G0 * sim.gScale * (primary.mass + body.mass)) / r);
    // Tangent direction preserving current orbital sense (CCW vs CW)
    const sign = rx * vy - ry * vx >= 0 ? 1 : -1;
    const tx = (-ry / r) * sign;
    const ty = (rx / r) * sign;
    body.vx = primary.vx + tx * vCirc;
    body.vy = primary.vy + ty * vCirc;
    body.burnTimer = 0.55;
  } else if (mode === 'hohmannTransfer') {
    if (!primary || primary === body) return { ok: false, reason: '중심 천체가 필요합니다.' };
    const r1 = Math.hypot(rx, ry);
    const target = sim.bodies.find(b => b.id === 'target_giant') || sim.bodies[sim.bodies.length - 1];
    const r2 = target && target !== primary ? Math.hypot(target.x - primary.x, target.y - primary.y) : r1 * 2.4;
    const mu = G0 * sim.gScale * (primary.mass + body.mass);
    const aTrans = 0.5 * (r1 + r2);
    const vReq = Math.sqrt(mu * (2 / r1 - 1 / aTrans));
    const sign = rx * vy - ry * vx >= 0 ? 1 : -1;
    const tx = (-ry / r1) * sign;
    const ty = (rx / r1) * sign;
    body.vx = primary.vx + tx * vReq;
    body.vy = primary.vy + ty * vReq;
    body.burnTimer = 0.65;
  } else if (mode === 'perturbChaos') {
    // Perturb first body velocity by +0.5% to demonstrate Figure-8 chaos sensitivity
    body.vx *= 1.005;
    body.vy *= 0.995;
    body.burnTimer = 0.5;
  }

  return { ok: true };
}

export function spawnBody(sim, templateKey, x, y, vx, vy) {
  const tpl = BODY_TEMPLATES[templateKey] || BODY_TEMPLATES.terrestrial;
  const idx = sim.nextSpawnCounter++;
  const body = {
    id: `${tpl.idPrefix}_${idx}`,
    name: `${tpl.label} #${idx}`,
    kind: tpl.kind,
    mass: tpl.mass,
    baseMass: tpl.mass,
    radius: tpl.radius,
    x,
    y,
    vx,
    vy,
    color: tpl.color,
    trailColor: tpl.trailColor,
    trail: [{ x, y }],
    burnTimer: 0.35
  };
  sim.bodies.push(body);
  sim.selectedBodyId = body.id;
  return body;
}

export function predictTrajectory(sim, x, y, vx, vy, steps = 240, stepDt = 0.008) {
  const gEff = G0 * sim.gScale;
  const epsSq = sim.softening * sim.softening;
  const attractors = sim.bodies.filter(b => b.mass >= 1e-4 || b.isPrimary);
  const sources = attractors.length ? attractors : sim.bodies;

  let px = x;
  let py = y;
  let pvx = vx;
  let pvy = vy;
  const path = [{ x: px, y: py }];
  let collided = false;
  let collisionPoint = null;

  for (let s = 0; s < steps; s++) {
    let ax1 = 0, ay1 = 0;
    for (let m = 0; m < sources.length; m++) {
      const b = sources[m];
      const dx = b.x - px;
      const dy = b.y - py;
      const dist = Math.hypot(dx, dy);
      if (dist < b.radius * 0.85) {
        collided = true;
        collisionPoint = { x: px, y: py };
        break;
      }
      const r2 = dx * dx + dy * dy + epsSq;
      const f = (gEff * b.mass) / (r2 * Math.sqrt(r2));
      ax1 += f * dx;
      ay1 += f * dy;
    }
    if (collided) break;

    px += pvx * stepDt + 0.5 * ax1 * stepDt * stepDt;
    py += pvy * stepDt + 0.5 * ay1 * stepDt * stepDt;

    let ax2 = 0, ay2 = 0;
    for (let m = 0; m < sources.length; m++) {
      const b = sources[m];
      const dx = b.x - px;
      const dy = b.y - py;
      const r2 = dx * dx + dy * dy + epsSq;
      const f = (gEff * b.mass) / (r2 * Math.sqrt(r2));
      ax2 += f * dx;
      ay2 += f * dy;
    }
    pvx += 0.5 * (ax1 + ax2) * stepDt;
    pvy += 0.5 * (ay1 + ay2) * stepDt;

    if (s % 2 === 0) path.push({ x: px, y: py });
  }

  // Classify predicted conic relative to strongest attractor at launch point
  let primary = sources[0];
  let best = -1;
  for (const s of sources) {
    const d2 = (x - s.x) ** 2 + (y - s.y) ** 2 + 1e-6;
    if (s.mass / d2 > best) {
      best = s.mass / d2;
      primary = s;
    }
  }
  let e = 0;
  let bound = false;
  if (primary) {
    const mu = gEff * primary.mass;
    const rx = x - primary.x;
    const ry = y - primary.y;
    const rvx = vx - primary.vx;
    const rvy = vy - primary.vy;
    const r = Math.hypot(rx, ry);
    const v2 = rvx * rvx + rvy * rvy;
    const eps = 0.5 * v2 - mu / Math.max(r, 1e-6);
    const rdotv = rx * rvx + ry * rvy;
    const ex = ((v2 - mu / Math.max(r, 1e-6)) * rx - rdotv * rvx) / Math.max(mu, 1e-9);
    const ey = ((v2 - mu / Math.max(r, 1e-6)) * ry - rdotv * rvy) / Math.max(mu, 1e-9);
    e = Math.hypot(ex, ey);
    bound = eps < 0 && e < 1;
  }

  return { path, collided, collisionPoint, e, bound };
}

export function evaluatePotentialAt(sim, x, y) {
  let phi = 0;
  const gEff = G0 * sim.gScale;
  for (let i = 0; i < sim.bodies.length; i++) {
    const b = sim.bodies[i];
    if (b.mass <= 1e-6 && !b.isPrimary) continue;
    const dx = x - b.x;
    const dy = y - b.y;
    const soft = Math.max(0.28, b.radius * 1.45);
    const r = Math.sqrt(dx * dx + dy * dy + soft * soft);
    phi -= (gEff * b.mass) / r;
  }
  return phi;
}

export function evaluateGravityAt(sim, x, y) {
  let gx = 0;
  let gy = 0;
  const gEff = G0 * sim.gScale;
  for (let i = 0; i < sim.bodies.length; i++) {
    const b = sim.bodies[i];
    if (b.mass <= 1e-6 && !b.isPrimary) continue;
    const dx = b.x - x;
    const dy = b.y - y;
    const soft = Math.max(0.22, b.radius * 1.2);
    const r2 = dx * dx + dy * dy + soft * soft;
    const f = (gEff * b.mass) / (r2 * Math.sqrt(r2));
    gx += f * dx;
    gy += f * dy;
  }
  return { gx, gy, mag: Math.hypot(gx, gy) };
}
