(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dark = window.matchMedia('(prefers-color-scheme: dark)');

  // Scroll progress bar
  const bar = document.getElementById('progress');
  const onScroll = () => {
    const h = document.documentElement;
    bar.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Highlight the nav link of the section in view
  const links = [...document.querySelectorAll('nav .links a')];
  const byId = Object.fromEntries(links.map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.remove('active'));
      byId[e.target.id]?.classList.add('active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));

  if (reduce) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }

  // Reveal-on-scroll, staggered within each group
  document.querySelectorAll('.news li, .pub, .timeline li, ul.plain li, .interests li').forEach(el => el.classList.add('reveal'));
  const seen = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const sibs = [...e.target.parentElement.children].filter(c => c.classList.contains('reveal') && !c.classList.contains('in'));
      e.target.style.transitionDelay = `${Math.min(sibs.indexOf(e.target), 6) * 60}ms`;
      e.target.classList.add('in');
      e.target.addEventListener('transitionend', () => { e.target.style.transitionDelay = ''; }, { once: true });
      seen.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => seen.observe(el));

  // Typewriter over research topics
  const tw = document.getElementById('typed');
  const words = JSON.parse(tw.dataset.words);
  let wi = 0, ci = 0, del = false;
  const tick = () => {
    const w = words[wi];
    ci += del ? -1 : 1;
    tw.textContent = w.slice(0, ci);
    let wait = del ? 35 : 70;
    if (!del && ci === w.length) { del = true; wait = 1600; }
    else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; wait = 300; }
    setTimeout(tick, wait);
  };
  tick();

  // Particle network behind the header: drifting aurora blobs, nodes, links,
  // signal pulses travelling along links, and click ripples.
  const canvas = document.getElementById('hero-bg');
  const ctx = canvas.getContext('2d');
  const mouse = { x: -1e4, y: -1e4 };
  let W, H, pts = [], pulses = [], ripples = [], dpr, t = 0;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(150, W * H / 6500));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .7, vy: (Math.random() - .5) * .7,
      r: Math.random() * 2 + 1.2, g: Math.random() < .55, ph: Math.random() * 6.28,
    }));
    pulses = [];
  };
  const hero = canvas.parentElement;
  hero.addEventListener('pointermove', e => {
    const b = canvas.getBoundingClientRect();
    mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top;
  });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  hero.addEventListener('click', e => {
    if (e.target.closest('a')) return;
    const b = canvas.getBoundingClientRect();
    const x = e.clientX - b.left, y = e.clientY - b.top;
    ripples.push({ x, y, r: 0 });
    for (const p of pts) {
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1;
      if (d < 260) { p.vx += dx / d * (260 - d) / 40; p.vy += dy / d * (260 - d) / 40; }
    }
  });
  window.addEventListener('resize', resize);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const LINK = 135;
  const blobs = [
    { c: 'g', x: .15, y: .35, r: .35, sx: .00031, sy: .00023 },
    { c: 'b', x: .8, y: .3, r: .3, sx: .00027, sy: .00035 },
    { c: 'p', x: .55, y: .75, r: .28, sx: .00022, sy: .00029 },
  ];
  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    t += 16;
    const isDark = dark.matches;
    const col = {
      g: isDark ? '118,185,0' : '94,160,0',
      b: isDark ? '108,182,255' : '11,99,196',
      p: isDark ? '168,85,247' : '147,51,234',
    };
    ctx.clearRect(0, 0, W, H);

    for (const bl of blobs) {
      const x = W * (bl.x + Math.sin(t * bl.sx) * .12), y = H * (bl.y + Math.cos(t * bl.sy) * .18);
      const r = Math.max(W, H) * bl.r;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${col[bl.c]},${isDark ? .22 : .13})`);
      gr.addColorStop(1, `rgba(${col[bl.c]},0)`);
      ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    }

    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 150 * 150) {
        const f = (1 - Math.sqrt(d2) / 150);
        p.vx += dx / 150 * f * .12; p.vy += dy / 150 * f * .12;
      }
      p.vx *= .98; p.vy *= .98;
      if (Math.hypot(p.vx, p.vy) < .25) { p.vx += (Math.random() - .5) * .08; p.vy += (Math.random() - .5) * .08; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x)); p.y = Math.max(0, Math.min(H, p.y));
    }

    const edges = [];
    ctx.lineWidth = 1.1;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          edges.push([i, j]);
          ctx.strokeStyle = `rgba(${col[a.g ? 'g' : 'b']},${(1 - d / LINK) * (isDark ? .5 : .38)})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const md = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
      if (md < 180) {
        ctx.strokeStyle = `rgba(${col.g},${(1 - md / 180) * .8})`;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }

    if (edges.length && pulses.length < 28 && Math.random() < .35) {
      const [i, j] = edges[(Math.random() * edges.length) | 0];
      pulses.push({ a: i, b: j, k: 0, hops: 3 + ((Math.random() * 4) | 0), c: Math.random() < .5 ? 'g' : 'b' });
    }
    ctx.shadowBlur = 12;
    pulses = pulses.filter(pl => {
      pl.k += .03;
      if (pl.k >= 1) {
        if (--pl.hops <= 0) return false;
        const nxt = edges.filter(e => e[0] === pl.b || e[1] === pl.b);
        if (!nxt.length) return false;
        const e = nxt[(Math.random() * nxt.length) | 0];
        pl.a = pl.b; pl.b = e[0] === pl.b ? e[1] : e[0]; pl.k = 0;
      }
      const A = pts[pl.a], B = pts[pl.b];
      if (Math.hypot(A.x - B.x, A.y - B.y) > LINK * 1.3) return false;
      const x = A.x + (B.x - A.x) * pl.k, y = A.y + (B.y - A.y) * pl.k;
      ctx.shadowColor = `rgba(${col[pl.c]},1)`;
      ctx.fillStyle = `rgba(${col[pl.c]},.95)`;
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, Math.PI * 2); ctx.fill();
      return true;
    });

    for (const p of pts) {
      const s = 1 + Math.sin(t * .003 + p.ph) * .3;
      ctx.shadowColor = `rgba(${col[p.g ? 'g' : 'b']},.9)`;
      ctx.fillStyle = `rgba(${col[p.g ? 'g' : 'b']},${isDark ? .95 : .8})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * s, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;

    ripples = ripples.filter(rp => {
      rp.r += 6;
      const a = 1 - rp.r / 320;
      if (a <= 0) return false;
      ctx.strokeStyle = `rgba(${col.g},${a * .7})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.stroke();
      return true;
    });
  };
  frame();
})();
