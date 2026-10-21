(() => {
  const stage = document.querySelector('.particle-stage');
  const canvas = document.querySelector('#club-particles');
  const context = canvas?.getContext('2d');
  if (!stage || !context) return;

  const COUNT = 1200;
  const SOURCE_SIZE = 440;
  const SOURCE_SPAN = 350;
  const baseColor = [96, 165, 223];  // BUGWANG SKY BLUE
  const violet = [186, 103, 243];    // BUGWANG VIOLET
  const white = [255, 255, 255];
  const interactionRadius = 168;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pointer = { x: -1000, y: -1000, lastX: null, lastY: null, directionX: 1, directionY: 0 };
  let sourcePoints = [];
  let particles = [];
  let size = 0;
  let frameId = 0;
  let running = false;

  // Deterministic order keeps the logo's density stable between visits and resizes.
  function randomGenerator(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function pointsFromLogo(image) {
    const mask = document.createElement('canvas');
    mask.width = mask.height = SOURCE_SIZE;
    const maskContext = mask.getContext('2d', { willReadFrequently: true });
    if (!maskContext) throw new Error('Canvas mask unavailable');
    maskContext.drawImage(image, 0, 0, SOURCE_SIZE, SOURCE_SIZE);
    const pixels = maskContext.getImageData(0, 0, SOURCE_SIZE, SOURCE_SIZE).data;
    const candidates = [];

    // Keep the dark atom inside the badge; exclude the blue outer ring and lettering.
    for (let y = 57; y < 383; y += 2) {
      for (let x = 57; x < 383; x += 2) {
        if (Math.hypot(x - 220, y - 220) > 164) continue;
        const index = (y * SOURCE_SIZE + x) * 4;
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const darkest = Math.min(red, green, blue);
        const brightest = Math.max(red, green, blue);
        if (pixels[index + 3] > 220 && brightest < 100 && brightest - darkest < 45) {
          candidates.push({ x: x - 220, y: y - 220 });
        }
      }
    }
    if (candidates.length < COUNT) throw new Error('Logo mask has too few points');
    const random = randomGenerator(2205);
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const selected = [];
    const cells = new Map();
    const spacing = 4;
    for (const candidate of candidates) {
      const cellX = Math.floor(candidate.x / spacing);
      const cellY = Math.floor(candidate.y / spacing);
      let overlaps = false;
      for (let y = cellY - 1; y <= cellY + 1 && !overlaps; y++) {
        for (let x = cellX - 1; x <= cellX + 1 && !overlaps; x++) {
          for (const neighbor of cells.get(`${x},${y}`) || []) {
            if ((candidate.x - neighbor.x) ** 2 + (candidate.y - neighbor.y) ** 2 < spacing ** 2) {
              overlaps = true;
              break;
            }
          }
        }
      }
      if (overlaps) continue;
      selected.push(candidate);
      const key = `${cellX},${cellY}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(candidate);
      if (selected.length === COUNT) break;
    }
    if (selected.length < COUNT) throw new Error('Logo mask cannot fit enough separated points');
    return selected;
  }

  function fallbackPoints() {
    const points = [];
    const ellipse = (count, angle) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (let i = 0; i < count; i++) {
        const t = i * 2 * Math.PI / count;
        const x = 141 * Math.cos(t);
        const y = 55 * Math.sin(t);
        points.push({ x: x * cos - y * sin, y: x * sin + y * cos });
      }
    };
    const circle = (count, centerX, centerY, radius) => {
      for (let i = 0; i < count; i++) {
        const t = i * 2 * Math.PI / count;
        points.push({ x: centerX + radius * Math.cos(t), y: centerY + radius * Math.sin(t) });
      }
    };
    ellipse(230, -Math.PI / 6);
    ellipse(230, Math.PI / 6);
    ellipse(230, Math.PI / 2);
    circle(80, 0, 0, 31);
    circle(40, 0, 0, 12);
    circle(30, -94, -86, 12);
    circle(30, 116, -30, 12);
    circle(30, 34, 130, 12);
    return points;
  }

  function resize() {
    size = stage.clientWidth;
    if (!size) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(size * ratio);
    canvas.height = Math.round(size * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const random = randomGenerator(519);
    particles = sourcePoints.map(point => ({
      x: size / 2 + point.x * size / SOURCE_SPAN,
      y: size / 2 + point.y * size / SOURCE_SPAN,
      radius: (1.55 + random() * 0.45) * Math.max(0.75, size / 470),
      alpha: 0.65 + random() * 0.35,
      magnetism: 0.8 + random() * 0.4,
      response: 0.12 + random() * 0.1,
      reaction: 0,
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      velocityX: 0,
      velocityY: 0
    }));
    if (reducedMotion) draw(0);
    else schedule();
  }

  function schedule() {
    if (!reducedMotion && size && sourcePoints.length && !document.hidden && !running) {
      running = true;
      frameId = requestAnimationFrame(draw);
    }
  }

  function draw() {
    running = false;
    if (!size) return;
    context.clearRect(0, 0, size, size);
    const stationaryColor = `rgb(${baseColor.join(',')})`;
    context.fillStyle = stationaryColor;
    let unsettled = false;

    for (const particle of particles) {
      const distanceX = particle.x - pointer.x;
      const distanceY = particle.y - pointer.y;
      const distance = Math.hypot(distanceX, distanceY);
      const proximity = Math.max(0, 1 - distance / interactionRadius);
      particle.reaction += (proximity - particle.reaction) * (reducedMotion ? 1 : particle.response);
      const targetScale = 1 + proximity * 1.7;
      particle.scale += (targetScale - particle.scale) * (reducedMotion ? 1 : particle.response);
      const pull = !reducedMotion && distance > 0
        ? proximity * Math.min(24, distance * 0.36) * particle.magnetism / distance : 0;
      const targetX = -distanceX * pull;
      const targetY = -distanceY * pull;
      particle.velocityX = (particle.velocityX + (targetX - particle.offsetX) * 0.085) * 0.8;
      particle.velocityY = (particle.velocityY + (targetY - particle.offsetY) * 0.085) * 0.8;
      particle.offsetX += particle.velocityX;
      particle.offsetY += particle.velocityY;
      if (Math.abs(proximity - particle.reaction) > 0.005 ||
          Math.abs(targetScale - particle.scale) > 0.01 ||
          Math.abs(targetX - particle.offsetX) > 0.08 ||
          Math.abs(targetY - particle.offsetY) > 0.08 ||
          Math.abs(particle.velocityX) > 0.02 || Math.abs(particle.velocityY) > 0.02) {
        unsettled = true;
      }

      if (particle.reaction > 0.005) {
        // Neighbors react separately: the cursor's leading and trailing sides tint differently.
        const ahead = distance > 0
          ? (distanceX * pointer.directionX + distanceY * pointer.directionY) / distance : 0;
        const violetWeight = (ahead + 1) / 2;
        const colorMix = particle.reaction * 0.95;
        const channels = baseColor.map((base, index) => {
          const highlight = white[index] * (1 - violetWeight) + violet[index] * violetWeight;
          return Math.round(base + (highlight - base) * colorMix);
        });
        context.fillStyle = `rgb(${channels.join(',')})`;
      } else context.fillStyle = stationaryColor;

      context.globalAlpha = Math.min(1, particle.alpha + particle.reaction * 0.2);
      context.beginPath();
      context.arc(particle.x + particle.offsetX,
        particle.y + particle.offsetY, particle.radius * particle.scale, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
    if (unsettled) schedule();
  }

  function start(points) {
    sourcePoints = points;
    resize();
    stage.classList.add('is-ready');
    schedule();
  }

  window.addEventListener('pointermove', event => {
    if (pointer.lastX !== null) {
      const dx = event.clientX - pointer.lastX;
      const dy = event.clientY - pointer.lastY;
      const distance = Math.hypot(dx, dy);
      if (distance > 2) {
        pointer.directionX = dx / distance;
        pointer.directionY = dy / distance;
      }
    }
    pointer.lastX = event.clientX;
    pointer.lastY = event.clientY;
    const bounds = stage.getBoundingClientRect();
    pointer.x = event.clientX - bounds.left;
    pointer.y = event.clientY - bounds.top;
    if (reducedMotion && size) draw(0);
    else schedule();
  }, { passive: true });

  window.addEventListener('blur', () => {
    pointer.x = pointer.y = -1000;
    pointer.lastX = pointer.lastY = null;
    schedule();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
      running = false;
    } else schedule();
  });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize, { passive: true });

  const logo = new Image();
  logo.onload = () => {
    try { start(pointsFromLogo(logo)); }
    catch { start(fallbackPoints()); }
  };
  logo.onerror = () => start(fallbackPoints());
  logo.src = 'assets/images/arcadia-club-logo.png';
})();
