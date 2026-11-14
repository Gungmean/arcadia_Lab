import {
  AU_PER_YR_TO_KMS,
  evaluatePotentialAt,
  evaluateRochePotentialAt,
  getBinaryRocheContext,
  evaluateGravityAt,
  getPrimaryBody,
  computeSystemEnergy
} from './physics.mjs';

const SECTOR_COLORS = [
  'rgba(56, 189, 248, 0.24)',
  'rgba(52, 211, 153, 0.24)',
  'rgba(251, 191, 36, 0.24)',
  'rgba(186, 103, 243, 0.24)',
  'rgba(96, 165, 223, 0.24)',
  'rgba(244, 114, 182, 0.24)'
];

const SECTOR_STROKES = [
  '#38bdf8',
  '#34d399',
  '#fbbf24',
  '#ba67f3',
  '#60a5df',
  '#f472b6'
];

export class GravityRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.camera = {
      yaw: 0.55,
      pitch: 42 * (Math.PI / 180),
      zoom: 1.0,
      panX: 0,
      panY: 0,
      followBodyId: null
    };
    this.stars = Array.from({ length: 140 }, (_, i) => ({
      u: ((Math.sin(i * 127.1 + 1.3) * 43758.5453) % 1 + 1) % 1,
      v: ((Math.sin(i * 311.7 + 2.9) * 43758.5453) % 1 + 1) % 1,
      r: 0.55 + (i % 4) * 0.38,
      a: 0.16 + (i % 5) * 0.09
    }));
  }

  getPalette() {
    const isLight = document.body.dataset.theme === 'light';
    if (isLight) {
      return {
        bgTop: '#f3f6fc',
        bgBottom: '#e5edf9',
        gridFlat: 'rgba(48, 78, 156, 0.19)',
        gridSlope: 'rgba(31, 27, 141, 0.48)',
        gridDeep: 'rgba(139, 92, 246, 0.68)',
        contour: 'rgba(48, 78, 156, 0.52)',
        vector: 'rgba(48, 78, 156, 0.58)',
        roche: '#2563eb',
        label: '#142058',
        labelMuted: '#475569',
        labelBg: 'rgba(255, 255, 255, 0.88)',
        labelBorder: 'rgba(48, 78, 156, 0.3)',
        selectionRing: '#1f1b8d',
        stem: 'rgba(48, 78, 156, 0.35)',
        starVisible: false
      };
    }
    return {
      bgTop: '#070b18',
      bgBottom: '#10182b',
      gridFlat: 'rgba(48, 78, 156, 0.32)',
      gridSlope: 'rgba(96, 165, 223, 0.55)',
      gridDeep: 'rgba(186, 103, 243, 0.78)',
      contour: 'rgba(96, 165, 223, 0.45)',
      vector: 'rgba(96, 165, 223, 0.62)',
      roche: '#60a5df',
      label: '#f8fafc',
      labelMuted: '#94a3b8',
      labelBg: 'rgba(16, 24, 43, 0.86)',
      labelBorder: 'rgba(96, 165, 223, 0.35)',
      selectionRing: '#60a5df',
      stem: 'rgba(96, 165, 223, 0.34)',
      starVisible: true
    };
  }

  getMetrics(sim) {
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(260, rect.width || this.canvas.width);
    const cssH = Math.max(260, rect.height || this.canvas.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.round(cssW * dpr);
    const targetH = Math.round(cssH * dpr);
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
    }

    const extent = sim.worldExtent || 3.6;
    const minSide = Math.min(cssW, cssH);
    const scale = (minSide / (2.34 * extent)) * this.camera.zoom;
    const fov = Math.max(12, extent * 4.5);

    if (this.camera.followBodyId) {
      const target = sim.bodies.find(b => b.id === this.camera.followBodyId);
      if (target) {
        this.camera.panX += (target.x - this.camera.panX) * 0.22;
        this.camera.panY += (target.y - this.camera.panY) * 0.22;
      } else {
        this.camera.followBodyId = null;
      }
    }

    return {
      cssW,
      cssH,
      dpr,
      centerX: cssW * 0.5,
      centerY: cssH * (0.485 - 0.055 * Math.sin(this.camera.pitch)),
      scale,
      fov,
      extent
    };
  }

  project(x, y, z, metrics) {
    const dx = x - this.camera.panX;
    const dy = y - this.camera.panY;
    const dz = z;

    const cy = Math.cos(this.camera.yaw);
    const sy = Math.sin(this.camera.yaw);
    const rx = dx * cy - dy * sy;
    const ry = dx * sy + dy * cy;

    const cp = Math.cos(this.camera.pitch);
    const sp = Math.sin(this.camera.pitch);
    const sxCam = rx;
    const syCam = ry * cp + dz * sp;
    const szCam = -ry * sp + dz * cp;

    const denom = Math.max(3.0, metrics.fov - szCam);
    const persp = metrics.fov / denom;
    return {
      x: metrics.centerX + sxCam * metrics.scale * persp,
      y: metrics.centerY - syCam * metrics.scale * persp,
      depth: szCam,
      persp
    };
  }

  screenToWorld(clientX, clientY, sim) {
    const rect = this.canvas.getBoundingClientRect();
    const m = this.getMetrics(sim);
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;

    const u = (sx - m.centerX) / m.scale;
    const v = (m.centerY - sy) / m.scale;

    const cp = Math.cos(this.camera.pitch);
    const sp = Math.sin(this.camera.pitch);
    const denom = cp * m.fov - v * sp;
    // Clamp near horizon singularity if tilted sharply
    const safeDenom = Math.abs(denom) < 0.8 ? (denom >= 0 ? 0.8 : -0.8) : denom;
    const ry = (v * m.fov) / safeDenom;
    const szCam = -ry * sp;
    const persp = m.fov / Math.max(3.0, m.fov - szCam);
    const rx = u / persp;

    const cy = Math.cos(this.camera.yaw);
    const syYaw = Math.sin(this.camera.yaw);
    const dx = rx * cy + ry * syYaw;
    const dy = -rx * syYaw + ry * cy;
    return {
      x: dx + this.camera.panX,
      y: dy + this.camera.panY
    };
  }

  wellHeight(sim, x, y, wellDepth) {
    if (wellDepth <= 0.001) return 0;
    const phi = evaluatePotentialAt(sim, x, y);
    return -wellDepth * 0.42 * Math.log(1 + Math.abs(phi) / 14);
  }

  render(sim, options = {}) {
    const m = this.getMetrics(sim);
    const ctx = this.ctx;
    const pal = this.getPalette();
    const {
      showGrid = true,
      showEquipotential = false,
      showField = false,
      showKeplerSectors = true,
      wellDepth = 0.9,
      slingshot = null,
      prediction = null
    } = options;

    ctx.save();
    ctx.scale(m.dpr, m.dpr);

    // 1. Background
    const bg = ctx.createLinearGradient(0, 0, 0, m.cssH);
    bg.addColorStop(0, pal.bgTop);
    bg.addColorStop(1, pal.bgBottom);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, m.cssW, m.cssH);

    if (pal.starVisible) {
      for (const st of this.stars) {
        ctx.fillStyle = `rgba(226, 232, 240, ${st.a})`;
        ctx.beginPath();
        ctx.arc(st.u * m.cssW, st.v * m.cssH, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 2. 3D Warped Spacetime Fabric Mesh
    if (showGrid) {
      this.drawSpacetimeGrid(ctx, sim, m, pal, wellDepth);
    }

    // 3. Equipotential Contours (Roche lobes around stars/planets)
    if (showEquipotential) {
      this.drawEquipotentials(ctx, sim, m, pal);
    }

    // 4. Gravity Vector Field
    if (showField) {
      this.drawGravityField(ctx, sim, m, pal);
    }

    // 5. Roche Limit Boundary Circle
    if (sim.scenario.rocheRadius) {
      const primary = getPrimaryBody(sim);
      if (primary) {
        this.drawRocheRing(ctx, primary, sim.scenario.rocheRadius, m, pal);
      }
    }

    // 6. Kepler 2nd Law Equal-Area Sectors
    if (showKeplerSectors && sim.keplerEnabled) {
      this.drawKeplerSectors(ctx, sim, m, pal);
    }

    // 7. Barycenter Marker for Multi-Star / 3-Body Systems
    if (sim.scenarioId === 'binary' || sim.scenarioId === 'figure8') {
      const { barycenter } = computeSystemEnergy(sim);
      const pb = this.project(barycenter.x, barycenter.y, 0, m);
      ctx.save();
      ctx.strokeStyle = pal.labelMuted;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(pb.x - 6, pb.y);
      ctx.lineTo(pb.x + 6, pb.y);
      ctx.moveTo(pb.x, pb.y - 6);
      ctx.lineTo(pb.x, pb.y + 6);
      ctx.stroke();
      ctx.font = '600 10px "Gmarket Sans", sans-serif';
      ctx.fillStyle = pal.labelMuted;
      ctx.fillText('질량 중심', pb.x + 8, pb.y + 3);
      ctx.restore();
    }

    // 8. Orbital Trails
    for (const body of sim.bodies) {
      this.drawTrail(ctx, body, m);
    }

    // 9. Slingshot Conic Trajectory Prediction & Pull Arrow
    if (slingshot && slingshot.active) {
      this.drawSlingshotOverlay(ctx, sim, slingshot, prediction, m, pal);
    }

    // 10. Depth-Sorted Ring Particles + Bodies
    this.drawParticlesAndBodies(ctx, sim, m, pal, showGrid ? wellDepth : 0);

    ctx.restore();
  }

  drawSpacetimeGrid(ctx, sim, m, pal, wellDepth) {
    const N = 28;
    const span = m.extent * 0.94;
    const pts = Array.from({ length: N + 1 }, () => new Array(N + 1));

    for (let ix = 0; ix <= N; ix++) {
      const wx = -span + (2 * span * ix) / N;
      for (let iy = 0; iy <= N; iy++) {
        const wy = -span + (2 * span * iy) / N;
        const wz = this.wellHeight(sim, wx, wy, wellDepth);
        const p = this.project(wx, wy, wz, m);
        pts[ix][iy] = { sx: p.x, sy: p.y, z: wz };
      }
    }

    const strokeSegment = (a, b) => {
      const depthAvg = 0.5 * (Math.abs(a.z) + Math.abs(b.z));
      if (depthAvg < 0.16) {
        ctx.strokeStyle = pal.gridFlat;
        ctx.lineWidth = 0.85;
      } else if (depthAvg < 0.65) {
        ctx.strokeStyle = pal.gridSlope;
        ctx.lineWidth = 1.05;
      } else {
        ctx.strokeStyle = pal.gridDeep;
        ctx.lineWidth = 1.25;
      }
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    };

    for (let ix = 0; ix <= N; ix++) {
      for (let iy = 0; iy < N; iy++) {
        strokeSegment(pts[ix][iy], pts[ix][iy + 1]);
      }
    }
    for (let iy = 0; iy <= N; iy++) {
      for (let ix = 0; ix < N; ix++) {
        strokeSegment(pts[ix][iy], pts[ix + 1][iy]);
      }
    }
  }

  drawEquipotentials(ctx, sim, m, pal) {
    const G = 40;
    const span = m.extent * 0.94;
    const field = new Float32Array((G + 1) * (G + 1));
    let totalMass = 0;
    for (const b of sim.bodies) {
      if (b.mass > 1e-5 || b.isPrimary) totalMass += b.mass;
    }
    if (totalMass <= 0) return;

    const rocheCtx = sim.scenarioId === 'binary' ? getBinaryRocheContext(sim) : null;

    for (let iy = 0; iy <= G; iy++) {
      const wy = -span + (2 * span * iy) / G;
      for (let ix = 0; ix <= G; ix++) {
        const wx = -span + (2 * span * ix) / G;
        field[iy * (G + 1) + ix] = rocheCtx
          ? evaluateRochePotentialAt(sim, wx, wy, rocheCtx)
          : evaluatePotentialAt(sim, wx, wy);
      }
    }

    let levelEntries;
    if (rocheCtx) {
      const phiL1 = rocheCtx.phiL1;
      levelEntries = [
        { val: phiL1 * 1.48, isCritical: false },
        { val: phiL1 * 1.18, isCritical: false },
        { val: phiL1, isCritical: true },
        { val: phiL1 * 0.91, isCritical: false },
        { val: phiL1 * 0.82, isCritical: false },
        { val: phiL1 * 0.74, isCritical: false }
      ];
    } else {
      const base = 39.478 * totalMass;
      levelEntries = [-2.2, -1.65, -1.25, -0.95, -0.72, -0.52, -0.36].map(k => ({
        val: k * base,
        isCritical: false
      }));
    }

    const interp = (v1, v2, level) => {
      const d = v2 - v1;
      if (Math.abs(d) < 1e-9) return 0.5;
      return (level - v1) / d;
    };

    const step = (2 * span) / G;
    for (const { val: level, isCritical } of levelEntries) {
      ctx.save();
      ctx.strokeStyle = isCritical ? pal.roche : pal.contour;
      ctx.lineWidth = isCritical ? 1.65 : 1.0;
      ctx.beginPath();
      for (let iy = 0; iy < G; iy++) {
        const y0 = -span + step * iy;
        const y1 = y0 + step;
        for (let ix = 0; ix < G; ix++) {
          const x0 = -span + step * ix;
          const x1 = x0 + step;
          const v00 = field[iy * (G + 1) + ix];
          const v10 = field[iy * (G + 1) + (ix + 1)];
          const v11 = field[(iy + 1) * (G + 1) + (ix + 1)];
          const v01 = field[(iy + 1) * (G + 1) + ix];

          const pts = [];
          if ((v00 < level) !== (v10 < level)) pts.push({ x: x0 + step * interp(v00, v10, level), y: y0 });
          if ((v10 < level) !== (v11 < level)) pts.push({ x: x1, y: y0 + step * interp(v10, v11, level) });
          if ((v11 < level) !== (v01 < level)) pts.push({ x: x0 + step * interp(v01, v11, level), y: y1 });
          if ((v01 < level) !== (v00 < level)) pts.push({ x: x0, y: y0 + step * interp(v00, v01, level) });

          if (pts.length === 2) {
            const p0 = this.project(pts[0].x, pts[0].y, 0, m);
            const p1 = this.project(pts[1].x, pts[1].y, 0, m);
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
          } else if (pts.length === 4) {
            for (let k = 0; k < 4; k += 2) {
              const p0 = this.project(pts[k].x, pts[k].y, 0, m);
              const p1 = this.project(pts[k + 1].x, pts[k + 1].y, 0, m);
              ctx.moveTo(p0.x, p0.y);
              ctx.lineTo(p1.x, p1.y);
            }
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // Annotate exact L1 Lagrange saddle point for binary Roche lobes
    if (rocheCtx) {
      const pL1 = this.project(rocheCtx.l1X, rocheCtx.l1Y, 0, m);
      ctx.save();
      ctx.fillStyle = pal.roche;
      ctx.beginPath();
      ctx.arc(pL1.x, pL1.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '700 10px ui-monospace, Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = pal.labelBg;
      ctx.lineWidth = 3;
      ctx.strokeText('L₁', pL1.x, pL1.y - 8);
      ctx.fillText('L₁', pL1.x, pL1.y - 8);
      ctx.restore();
    }
  }

  drawGravityField(ctx, sim, m, pal) {
    const N = 8;
    const span = m.extent * 0.95;
    ctx.save();
    ctx.strokeStyle = pal.vector;
    ctx.fillStyle = pal.vector;
    ctx.lineWidth = 1.15;

    for (let ix = 0; ix <= N; ix++) {
      const wx = -span + (2 * span * ix) / N;
      for (let iy = 0; iy <= N; iy++) {
        const wy = -span + (2 * span * iy) / N;
        let inside = false;
        for (const b of sim.bodies) {
          if (Math.hypot(wx - b.x, wy - b.y) < Math.max(0.28, b.radius * 1.6)) {
            inside = true;
            break;
          }
        }
        if (inside) continue;

        const { gx, gy, mag } = evaluateGravityAt(sim, wx, wy);
        if (mag < 0.05) continue;
        const len = Math.min(0.26, 0.075 * Math.log(1 + mag * 0.35));
        const ux = gx / mag;
        const uy = gy / mag;
        const p0 = this.project(wx, wy, 0, m);
        const p1 = this.project(wx + ux * len, wy + uy * len, 0, m);

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();

        const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p1.x - 5 * Math.cos(ang - 0.5), p1.y - 5 * Math.sin(ang - 0.5));
        ctx.lineTo(p1.x - 5 * Math.cos(ang + 0.5), p1.y - 5 * Math.sin(ang + 0.5));
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawRocheRing(ctx, primary, rocheR, m, pal) {
    ctx.save();
    ctx.strokeStyle = pal.roche;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    const segs = 72;
    for (let i = 0; i <= segs; i++) {
      const th = (i / segs) * Math.PI * 2;
      const p = this.project(primary.x + Math.cos(th) * rocheR, primary.y + Math.sin(th) * rocheR, 0, m);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const lblP = this.project(primary.x, primary.y + rocheR, 0, m);
    ctx.font = '700 11px "Gmarket Sans", sans-serif';
    ctx.fillStyle = pal.roche;
    ctx.textAlign = 'center';
    ctx.fillText(`로슈 한계 (d_R = ${rocheR.toFixed(2)} AU)`, lblP.x, lblP.y - 8);
    ctx.restore();
  }

  drawKeplerSectors(ctx, sim, m, pal) {
    const all = [...sim.keplerSectors];
    if (sim.currentSector && sim.currentSector.points.length >= 2) {
      all.push(sim.currentSector);
    }
    let lastLabelX = -1e9;
    let lastLabelY = -1e9;
    for (let idx = 0; idx < all.length; idx++) {
      const sec = all[idx];
      if (!sec.points.length) continue;
      const cIdx = sec.colorIndex % SECTOR_COLORS.length;
      const fx = sec.focusX;
      const fy = sec.focusY;
      const fProj = this.project(fx, fy, 0, m);

      ctx.save();
      ctx.fillStyle = SECTOR_COLORS[cIdx];
      ctx.strokeStyle = SECTOR_STROKES[cIdx];
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(fProj.x, fProj.y);
      let cx = 0, cy = 0;
      for (const pt of sec.points) {
        const sp = this.project(fx + pt.x, fy + pt.y, 0, m);
        ctx.lineTo(sp.x, sp.y);
        cx += sp.x;
        cy += sp.y;
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Label completed sectors cleanly inside the wedge (avoid adjacent text pileups)
      if (idx < sim.keplerSectors.length && sec.area > 0.005) {
        const avgX = cx / sec.points.length;
        const avgY = cy / sec.points.length;
        const frac = idx % 2 === 0 ? 0.58 : 0.72;
        const mx = fProj.x * (1 - frac) + avgX * frac;
        const my = fProj.y * (1 - frac) + avgY * frac;
        if (Math.hypot(mx - lastLabelX, my - lastLabelY) > 40) {
          ctx.font = '700 10px ui-monospace, Consolas, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.strokeStyle = pal.labelBg;
          ctx.lineWidth = 3;
          ctx.strokeText(`ΔA=${sec.area.toFixed(3)}`, mx, my);
          ctx.fillStyle = pal.label;
          ctx.fillText(`ΔA=${sec.area.toFixed(3)}`, mx, my);
          lastLabelX = mx;
          lastLabelY = my;
        }
      }
      ctx.restore();
    }
  }

  drawTrail(ctx, body, m) {
    const trail = body.trail;
    if (!trail || trail.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const chunks = 8;
    const len = trail.length;
    for (let c = 0; c < chunks; c++) {
      const iStart = Math.floor((c * (len - 1)) / chunks);
      const iEnd = Math.floor(((c + 1) * (len - 1)) / chunks);
      if (iEnd <= iStart) continue;
      const alpha = 0.1 + 0.72 * ((c + 1) / chunks);
      ctx.strokeStyle = body.trailColor || body.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.1 + (c / chunks) * 1.15;
      ctx.beginPath();
      for (let i = iStart; i <= iEnd; i++) {
        const p = this.project(trail[i].x, trail[i].y, 0, m);
        if (i === iStart) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  drawSlingshotOverlay(ctx, sim, slingshot, prediction, m, pal) {
    const pStart = this.project(slingshot.wx, slingshot.wy, 0, m);
    const pVecEnd = this.project(
      slingshot.wx + slingshot.vx * 0.14,
      slingshot.wy + slingshot.vy * 0.14,
      0,
      m
    );

    ctx.save();
    if (prediction && prediction.path.length > 1) {
      ctx.strokeStyle = prediction.collided
        ? '#f87171'
        : prediction.bound
        ? '#34d399'
        : '#fbbf24';
      ctx.lineWidth = 1.75;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      for (let i = 0; i < prediction.path.length; i++) {
        const pt = prediction.path[i];
        const sp = this.project(pt.x, pt.y, 0, m);
        if (i === 0) ctx.moveTo(sp.x, sp.y);
        else ctx.lineTo(sp.x, sp.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      if (prediction.collided && prediction.collisionPoint) {
        const cp = this.project(prediction.collisionPoint.x, prediction.collisionPoint.y, 0, m);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(cp.x - 5, cp.y - 5);
        ctx.lineTo(cp.x + 5, cp.y + 5);
        ctx.moveTo(cp.x + 5, cp.y - 5);
        ctx.lineTo(cp.x - 5, cp.y + 5);
        ctx.stroke();
      }
    }

    // Velocity launch arrow
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pVecEnd.x, pVecEnd.y);
    ctx.stroke();

    const ang = Math.atan2(pVecEnd.y - pStart.y, pVecEnd.x - pStart.x);
    ctx.beginPath();
    ctx.moveTo(pVecEnd.x, pVecEnd.y);
    ctx.lineTo(pVecEnd.x - 8 * Math.cos(ang - 0.45), pVecEnd.y - 8 * Math.sin(ang - 0.45));
    ctx.lineTo(pVecEnd.x - 8 * Math.cos(ang + 0.45), pVecEnd.y - 8 * Math.sin(ang + 0.45));
    ctx.closePath();
    ctx.fill();

    // Launch speed & predicted orbit badge
    const speedKms = Math.hypot(slingshot.vx, slingshot.vy) * AU_PER_YR_TO_KMS;
    const statusText = prediction?.collided
      ? '충돌 경로'
      : prediction?.bound
      ? `속박 궤도 (e = ${prediction.e.toFixed(2)})`
      : '탈출 쌍곡선 (E ≥ 0)';
    const badge = `${speedKms.toFixed(1)} km/s · ${statusText}`;
    ctx.font = '700 11px "Gmarket Sans", sans-serif';
    const tw = ctx.measureText(badge).width + 16;
    const bx = Math.min(m.cssW - tw - 10, Math.max(10, pStart.x + 14));
    const by = Math.max(26, pStart.y - 16);
    ctx.fillStyle = pal.labelBg;
    ctx.strokeStyle = pal.labelBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by - 16, tw, 24, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pal.label;
    ctx.textAlign = 'left';
    ctx.fillText(badge, bx + 8, by);
    ctx.restore();
  }

  drawParticlesAndBodies(ctx, sim, m, pal, wellDepth) {
    const primary = getPrimaryBody(sim);
    const drawList = [];

    for (let i = 0; i < sim.particles.length; i++) {
      const pt = sim.particles[i];
      const p = this.project(pt.x, pt.y, 0, m);
      drawList.push({ type: 'particle', item: pt, p, depth: p.depth });
    }

    for (let i = 0; i < sim.bodies.length; i++) {
      const b = sim.bodies[i];
      const p = this.project(b.x, b.y, 0, m);
      const wellZ = wellDepth > 0 ? this.wellHeight(sim, b.x, b.y, wellDepth) : 0;
      const pWell = this.project(b.x, b.y, wellZ, m);
      drawList.push({ type: 'body', item: b, p, pWell, depth: p.depth });
    }

    drawList.sort((a, b) => a.depth - b.depth);

    for (const entry of drawList) {
      if (entry.type === 'particle') {
        const { item: pt, p } = entry;
        ctx.save();
        ctx.globalAlpha = pt.alpha ?? 0.8;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pt.size * Math.max(0.65, p.persp), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        continue;
      }

      const { item: body, p, pWell } = entry;
      const pxRadius = Math.max(5.5, body.radius * m.scale * p.persp);

      // Vertical drop-stem linking orbital position to spacetime well
      if (wellDepth > 0 && Math.abs(pWell.y - p.y) > 4) {
        ctx.save();
        ctx.strokeStyle = pal.stem;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(pWell.x, pWell.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = pal.stem;
        ctx.beginPath();
        ctx.arc(pWell.x, pWell.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Comet ion tail pointing away from primary star
      if (body.kind === 'comet' && primary && primary !== body) {
        const dx = body.x - primary.x;
        const dy = body.y - primary.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.05) {
          const tailLen = Math.min(1.1, 0.36 / Math.max(0.35, dist));
          const pTail = this.project(body.x + (dx / dist) * tailLen, body.y + (dy / dist) * tailLen, 0, m);
          const grad = ctx.createLinearGradient(p.x, p.y, pTail.x, pTail.y);
          grad.addColorStop(0, 'rgba(125, 211, 252, 0.72)');
          grad.addColorStop(1, 'rgba(125, 211, 252, 0)');
          ctx.save();
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(3, pxRadius * 1.15);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pTail.x, pTail.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Thruster exhaust plume when burning Delta-V
      if (body.burnTimer > 0) {
        const vMag = Math.hypot(body.vx, body.vy) || 1;
        const pExhaust = this.project(
          body.x - (body.vx / vMag) * 0.38,
          body.y - (body.vy / vMag) * 0.38,
          0,
          m
        );
        ctx.save();
        const plumeGrad = ctx.createLinearGradient(p.x, p.y, pExhaust.x, pExhaust.y);
        plumeGrad.addColorStop(0, '#fef08a');
        plumeGrad.addColorStop(0.5, '#38bdf8');
        plumeGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.strokeStyle = plumeGrad;
        ctx.lineWidth = Math.max(4, pxRadius * 0.9);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(pExhaust.x, pExhaust.y);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      if (body.kind === 'blackhole') {
        // Glowing gravitational photon sphere & accretion halo
        const halo = ctx.createRadialGradient(p.x, p.y, pxRadius * 0.75, p.x, p.y, pxRadius * 2.8);
        halo.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        halo.addColorStop(0.28, 'rgba(186, 103, 243, 0.65)');
        halo.addColorStop(0.6, 'rgba(96, 165, 223, 0.2)');
        halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pxRadius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Event horizon core
        ctx.fillStyle = '#03050a';
        ctx.strokeStyle = '#fde68a';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pxRadius * 0.88, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (body.kind === 'star') {
        const glow = ctx.createRadialGradient(p.x, p.y, pxRadius * 0.25, p.x, p.y, pxRadius * 2.5);
        glow.addColorStop(0, '#ffffff');
        glow.addColorStop(0.32, body.color);
        glow.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pxRadius * 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = body.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pxRadius, 0, Math.PI * 2);
        ctx.fill();
      } else if (body.kind === 'probe') {
        // Spacecraft diamond + solar panels aligned with screen velocity vector
        const vMag = Math.hypot(body.vx, body.vy) || 1;
        const pAhead = this.project(body.x + (body.vx / vMag) * 0.1, body.y + (body.vy / vMag) * 0.1, 0, m);
        const screenAngle = Math.atan2(pAhead.y - p.y, pAhead.x - p.x);
        ctx.translate(p.x, p.y);
        ctx.rotate(screenAngle + Math.PI / 2);
        ctx.fillStyle = '#60a5df';
        ctx.fillRect(-pxRadius * 1.4, -pxRadius * 0.3, pxRadius * 2.8, pxRadius * 0.6);
        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#1f1b8d';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, pxRadius * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Directional illumination facing star
        let lx = -0.4;
        let ly = -0.4;
        if (primary && primary !== body) {
          const ps = this.project(primary.x, primary.y, 0, m);
          const dx = ps.x - p.x;
          const dy = ps.y - p.y;
          const d = Math.hypot(dx, dy) || 1;
          lx = (dx / d) * pxRadius * 0.45;
          ly = (dy / d) * pxRadius * 0.45;
        }
        const sphereGrad = ctx.createRadialGradient(p.x + lx, p.y + ly, pxRadius * 0.15, p.x, p.y, pxRadius * 1.15);
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.35, body.color);
        sphereGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = sphereGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pxRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Selection reticle
      if (body.id === sim.selectedBodyId) {
        ctx.strokeStyle = pal.selectionRing;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pxRadius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Clean body name label for selected or primary body
      if (body.id === sim.selectedBodyId || body.isPrimary || sim.bodies.length <= 5) {
        ctx.font = '700 11px "Gmarket Sans", sans-serif';
        ctx.textAlign = 'center';
        const shortName = body.name.split('(')[0].trim();
        ctx.fillStyle = pal.label;
        ctx.fillText(shortName, p.x, p.y + pxRadius + 16);
      }
      ctx.restore();
    }
  }
}
