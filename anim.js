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

  // Particle network behind the header
  const canvas = document.getElementById('hero-bg');
  const ctx = canvas.getContext('2d');
  const mouse = { x: -1e4, y: -1e4 };
  let W, H, pts = [], dpr;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, W * H / 11000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.6 + .8, g: Math.random() < .5,
    }));
  };
  const hero = canvas.parentElement;
  hero.addEventListener('pointermove', e => {
    const b = canvas.getBoundingClientRect();
    mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top;
  });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  window.addEventListener('resize', resize);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const LINK = 120;
  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    const isDark = dark.matches;
    const green = isDark ? '118,185,0' : '94,160,0';
    const blue = isDark ? '108,182,255' : '11,99,196';
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < 140 * 140) {
        const f = (1 - Math.sqrt(d2) / 140) * .6;
        p.vx += dx / 140 * f * .15; p.vy += dy / 140 * f * .15;
      }
      p.vx *= .985; p.vy *= .985;
      const sp = Math.hypot(p.vx, p.vy);
      if (sp < .12) { p.vx += (Math.random() - .5) * .05; p.vy += (Math.random() - .5) * .05; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x)); p.y = Math.max(0, Math.min(H, p.y));
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          ctx.strokeStyle = `rgba(${a.g ? green : blue},${(1 - d / LINK) * (isDark ? .35 : .22)})`;
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const md = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
      if (md < 160) {
        ctx.strokeStyle = `rgba(${green},${(1 - md / 160) * .5})`;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    for (const p of pts) {
      ctx.fillStyle = `rgba(${p.g ? green : blue},${isDark ? .9 : .7})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
  };
  frame();
})();
