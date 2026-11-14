import test from 'node:test';
import assert from 'node:assert/strict';
import {
  G0,
  createSimulation,
  stepSimulation,
  computeSystemEnergy,
  computeOrbitalElements,
  applyImpulse,
  predictTrajectory
} from './physics.mjs';

test('circular orbit preserves radius, Kepler 3rd Law (T^2 / a^3 = 1), and energy', () => {
  const sim = createSimulation('kepler', { collisionsEnabled: false });
  const earth = sim.bodies.find(b => b.id === 'earth');
  assert.ok(earth);

  const el0 = computeOrbitalElements(earth, sim);
  assert.ok(el0.bound);
  assert.ok(Math.abs(el0.a - 1.0) < 1e-4);
  assert.ok(Math.abs(el0.period - 1.0) < 1e-4);
  assert.ok(Math.abs(el0.keplerRatio - 1.0) < 1e-3);

  // Advance exactly 3 full years (3 orbits)
  const stepDt = 0.004;
  for (let i = 0; i < 750; i++) {
    stepSimulation(sim, stepDt);
  }
  const energyAfter = computeSystemEnergy(sim);
  assert.ok(energyAfter.drift < 1e-5, `Expected tiny energy drift, got ${energyAfter.drift}`);

  // Earth should return close to (1, 0)
  const rReturn = Math.hypot(earth.x - 1.0, earth.y);
  assert.ok(rReturn < 0.03, `Expected circular return near (1,0), drifted by ${rReturn}`);

  // Outer planet verifies T^2 / a^3 = 1.000
  const outer = sim.bodies.find(b => b.id === 'outer');
  const elOuter = computeOrbitalElements(outer, sim);
  assert.ok(Math.abs(elOuter.keplerRatio - 1.0) < 1e-3);
});

test('Kepler 2nd law equal-time sectors sweep equal areas at perihelion and aphelion', () => {
  const sim = createSimulation('kepler');
  sim.selectedBodyId = 'comet';
  sim.keplerEnabled = true;

  // Run slightly over 1.8 years (~full half-to-full orbit covering perihelion and aphelion)
  for (let i = 0; i < 400; i++) {
    stepSimulation(sim, 0.004);
  }
  assert.ok(sim.keplerSectors.length >= 4);
  const areas = sim.keplerSectors.map(s => s.area);
  const mean = areas.reduce((s, x) => s + x, 0) / areas.length;
  for (const a of areas) {
    const relErr = Math.abs(a - mean) / mean;
    assert.ok(relErr < 0.025, `Sector area deviation too large: ${relErr}`);
  }
});

test('escape velocity boundary cleanly separates bound (E < 0) and escape (E >= 0) orbits', () => {
  const sim = createSimulation('kepler');
  const earth = sim.bodies.find(b => b.id === 'earth');
  const el0 = computeOrbitalElements(earth, sim);
  assert.ok(el0.bound);

  // Boost velocity just past sqrt(2)*v_circ
  earth.vy = el0.vEsc * 1.03;
  const elEsc = computeOrbitalElements(earth, sim);
  assert.equal(elEsc.bound, false);
  assert.ok(elEsc.specificEnergy > 0);
  assert.ok(elEsc.e > 1);

  const pred = predictTrajectory(sim, earth.x, earth.y, earth.vx, earth.vy, 120, 0.008);
  assert.equal(pred.bound, false);
});

test('Chenciner-Montgomery Figure-8 3-body returns periodically and diverges when perturbed', () => {
  const simClean = createSimulation('figure8');
  const startPos = simClean.bodies.map(b => ({ x: b.x, y: b.y }));

  // Period is T = 6.3259 * sqrt(S^3 / G0) = 6.3259 * sqrt(1.45^3 / (4*pi^2)) ~ 1.7587 yr
  const S = 1.45;
  const period = 6.32591398 * Math.sqrt(Math.pow(S, 3) / G0);
  const steps = Math.round(period / 0.002);
  for (let i = 0; i < steps; i++) {
    stepSimulation(simClean, period / steps, 0.001);
  }
  const cleanErr = Math.hypot(simClean.bodies[0].x - startPos[0].x, simClean.bodies[0].y - startPos[0].y);
  assert.ok(cleanErr < 0.02, `Expected periodic return within 0.02 AU, got ${cleanErr}`);
  const energy = computeSystemEnergy(simClean);
  assert.ok(energy.drift < 1e-5, `Expected energy drift < 1e-5, got ${energy.drift}`);

  // Perturbed chaos run
  const simChaos = createSimulation('figure8');
  applyImpulse(simChaos, 'body1', 'perturbChaos');
  for (let i = 0; i < steps * 4; i++) {
    stepSimulation(simChaos, period / steps, 0.0015);
  }
  const chaosDrift = Math.hypot(simChaos.bodies[0].x - startPos[0].x, simChaos.bodies[0].y - startPos[0].y);
  assert.ok(chaosDrift > 0.08, `Expected chaos perturbation to diverge, got ${chaosDrift}`);
});

test('General Relativity 1PN correction induces positive perihelion precession while conserving energy', () => {
  const simNewton = createSimulation('blackhole', { relativityEnabled: false });
  const simGR = createSimulation('blackhole', { relativityEnabled: true });

  for (let i = 0; i < 650; i++) {
    stepSimulation(simNewton, 0.0032);
    stepSimulation(simGR, 0.0032);
  }
  const starN = simNewton.bodies.find(b => b.id === 's2star');
  const starGR = simGR.bodies.find(b => b.id === 's2star');
  const separation = Math.hypot(starGR.x - starN.x, starGR.y - starN.y);
  assert.ok(separation > 0.25, `Expected GR orbit to visibly precess away from Newtonian orbit, sep=${separation}`);
  const energyGR = computeSystemEnergy(simGR);
  assert.ok(energyGR.drift < 2e-4, `Expected effective energy conservation under radial 1PN force, got ${energyGR.drift}`);
});

test('Roche limit tidal disruption fragments icy moon into orbiting planetary ring', () => {
  const sim = createSimulation('roche');
  assert.equal(sim.rocheTriggered, false);
  assert.equal(sim.particles.length, 0);

  for (let i = 0; i < 250; i++) {
    stepSimulation(sim, 0.003);
  }
  assert.equal(sim.rocheTriggered, true, 'Fragile moon should cross Roche limit and disrupt');
  assert.ok(sim.particles.length >= 60, 'Tidal disruption should create ring particles');
  assert.equal(sim.bodies.some(b => b.id === 'moon_fragile'), false);
});

test('Hohmann transfer delta-v expands circular orbit apoapsis to outer target radius', () => {
  const sim = createSimulation('hohmann');
  const sc = sim.bodies.find(b => b.id === 'spacecraft');
  applyImpulse(sim, 'spacecraft', 'hohmannTransfer');
  const el = computeOrbitalElements(sc, sim);
  assert.ok(el.bound);
  assert.ok(Math.abs(el.ra - 2.40) < 0.08, `Expected apoapsis near 2.40 AU, got ${el.ra}`);
});
