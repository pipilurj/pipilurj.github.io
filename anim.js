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

  // Background: pixel robots hovering in the side gutters (eyes follow the
  // cursor, they blink, wave and occasionally say something), over faint code rain.
  const canvas = document.getElementById('hero-bg');
  const ctx = canvas.getContext('2d');
  const mouse = { x: -1e4, y: -1e4 };
  const PALETTES = [
    { body: '#76b900', dark: '#3f6300', eye: '#d9ffb0' },
    { body: '#3b82f6', dark: '#1e3a8a', eye: '#bfe0ff' },
    { body: '#a855f7', dark: '#5b21b6', eye: '#f0d9ff' },
    { body: '#f59e0b', dark: '#92400e', eye: '#fff1c2' },
    { body: '#94a3b8', dark: '#475569', eye: '#a5f3fc' },
  ];
  const QUOTES = [
    'hello, world!', 'beep boop', 'loss.backward()', 'git push', 'sudo make coffee',
    'while (alive) learn()', '200 OK', 'RL > SFT ?', 'nvidia-smi', 'rm -rf bugs/',
    'tokens++', 'import torch', 'reward: +1', 'it works on my GPU', 'exit 0',
  ];
  const RAIN = '01{}[]<>/=;:()λΣ∇∂#$%&*+-~'.split('');
  let W, H, dpr, robots = [], drops = [], t = 0;

  const gutter = () => Math.max(0, W / 2 - 450);
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = gutter(), narrow = g < 140;
    robots = [];
    const per = narrow ? 0 : Math.max(2, Math.round(H / 260));
    const make = (xmin, xmax, y) => {
      const u = 3 + Math.round(Math.random() * 2);
      robots.push({
        x: xmin + Math.random() * Math.max(1, xmax - xmin - 12 * u), y, u,
        xmin, xmax, home: y, vx: (Math.random() < .5 ? -1 : 1) * (.15 + Math.random() * .25),
        pal: PALETTES[(Math.random() * PALETTES.length) | 0], ph: Math.random() * 6.28,
        blink: 0, wave: 0, say: null, sayT: 0, jump: 0,
      });
    };
    if (narrow) {
      const n = Math.max(2, Math.round(W / 180));
      for (let k = 0; k < n; k++) make(W * k / n + 10, W * (k + 1) / n - 10, 40 + Math.random() * 90);
    } else {
      for (let k = 0; k < per; k++) {
        const y = 90 + (H - 200) * (k + Math.random() * .6) / per;
        make(16, g - 16, y);
        make(W - g + 16, W - 16, 90 + (H - 200) * (k + .3 + Math.random() * .6) / per);
      }
    }
    drops = [];
    const cols = Math.floor(W / 18);
    for (let c = 0; c < cols; c++) {
      const x = c * 18 + 4;
      if (!narrow && x > g + 40 && x < W - g - 40) continue;
      drops.push({ x, y: Math.random() * H, v: .6 + Math.random() * 1.6, len: 8 + ((Math.random() * 14) | 0),
        ch: Array.from({ length: 24 }, () => RAIN[(Math.random() * RAIN.length) | 0]) });
    }
  };

  window.addEventListener('pointermove', e => {
    const b = canvas.getBoundingClientRect();
    mouse.x = e.clientX - b.left; mouse.y = e.clientY - b.top;
  });
  document.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  window.addEventListener('click', e => {
    if (e.target.closest('a, button, summary') || !robots.length) return;
    const b = canvas.getBoundingClientRect();
    const x = e.clientX - b.left, y = e.clientY - b.top;
    let best = robots[0], bd = Infinity;
    for (const r of robots) { const d = Math.hypot(r.x - x, r.y - y); if (d < bd) { bd = d; best = r; } }
    best.jump = 1; best.wave = 1;
    best.say = QUOTES[(Math.random() * QUOTES.length) | 0]; best.sayT = 160;
  });
  window.addEventListener('resize', resize);
  resize();

  const px = (r, gx, gy, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(r.dx + gx * r.u), Math.round(r.dy + gy * r.u), w * r.u, h * r.u);
  };
  const drawRobot = r => {
    const { u, pal } = r;
    // Antenna with pulsing light
    px(r, 5, 1, 1, 2, pal.dark);
    const glow = .5 + .5 * Math.sin(t * .006 + r.ph);
    ctx.shadowColor = pal.eye; ctx.shadowBlur = 8 * glow;
    px(r, 4.5, 0, 2, 1, `rgba(255,80,80,${.5 + glow * .5})`);
    ctx.shadowBlur = 0;
    // Head
    px(r, 1, 3, 10, 8, pal.dark);
    px(r, 1.5, 3.5, 9, 7, pal.body);
    px(r, 2.5, 4.5, 7, 5, '#0b0f14');
    // Eyes follow the mouse; blink now and then
    const cx = r.dx + 6 * u, cy = r.dy + 7 * u;
    const ang = Math.atan2(mouse.y - cy, mouse.x - cx), near = mouse.x > -1e3;
    const ox = near ? Math.cos(ang) * .6 : 0, oy = near ? Math.sin(ang) * .6 : 0;
    ctx.shadowColor = pal.eye; ctx.shadowBlur = 6;
    if (r.blink > 0) {
      px(r, 3.5, 6.5, 2, .5, pal.eye); px(r, 6.5, 6.5, 2, .5, pal.eye);
    } else {
      px(r, 3.5, 5.5, 2, 2, pal.eye); px(r, 6.5, 5.5, 2, 2, pal.eye);
      ctx.shadowBlur = 0;
      px(r, 4 + ox, 6 + oy, 1, 1, '#0b0f14'); px(r, 7 + ox, 6 + oy, 1, 1, '#0b0f14');
    }
    ctx.shadowBlur = 0;
    // Mouth: talks while speaking
    const open = r.sayT > 0 && Math.sin(t * .05) > 0;
    px(r, 4.5, 8.3, 3, open ? 1 : .4, pal.eye);
    // Ears
    px(r, 0, 5.5, 1, 3, pal.dark); px(r, 11, 5.5, 1, 3, pal.dark);
    // Neck + body
    px(r, 5, 11, 2, 1, pal.dark);
    px(r, 2, 12, 8, 6, pal.dark);
    px(r, 2.5, 12.5, 7, 5, pal.body);
    // Chest panel with blinking LEDs
    px(r, 3.5, 13.5, 5, 2.5, '#0b0f14');
    const leds = ['#ff5f57', '#febc2e', '#28c840'];
    for (let k = 0; k < 3; k++) if (Math.sin(t * .01 + k * 2 + r.ph) > -.2) px(r, 4 + k * 1.5, 14.25, 1, 1, leds[k]);
    // Arms: right arm waves when triggered
    px(r, .5, 12.5, 1.5, 4, pal.dark);
    if (r.wave > 0) {
      const a = Math.sin(t * .03) > 0 ? 0 : 1;
      px(r, 10, 9.5 + a, 1.5, 3.5, pal.dark); px(r, 10, 8.5 + a, 1.5, 1.2, pal.body);
    } else {
      px(r, 10, 12.5, 1.5, 4, pal.dark);
    }
    // Legs + jet flames
    px(r, 3.5, 18, 1.5, 1.5, pal.dark); px(r, 7, 18, 1.5, 1.5, pal.dark);
    const f = 1 + Math.random() * 1.6 + (r.jump > 0 ? 1.5 : 0);
    px(r, 3.75, 19.5, 1, f, 'rgba(255,166,87,.85)'); px(r, 7.25, 19.5, 1, f, 'rgba(255,166,87,.85)');
    px(r, 4, 19.5, .5, f * .6, 'rgba(255,241,194,.95)'); px(r, 7.5, 19.5, .5, f * .6, 'rgba(255,241,194,.95)');
  };
  const drawBubble = r => {
    const a = Math.min(1, r.sayT / 30);
    ctx.font = '600 12px "JetBrains Mono", ui-monospace, monospace';
    const tw = ctx.measureText(r.say).width, bw = tw + 16, bh = 22;
    let bx = r.dx + 6 * r.u - bw / 2, by = r.dy - bh - 8;
    bx = Math.max(4, Math.min(W - bw - 4, bx));
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(17,22,29,.95)'; ctx.strokeStyle = r.pal.body; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d0d7de'; ctx.textBaseline = 'middle'; ctx.fillText(r.say, bx + 8, by + bh / 2 + 1);
    ctx.globalAlpha = 1;
  };

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

  const frame = () => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) return;
    t += 16;
    ctx.clearRect(0, 0, W, H);

    // Code rain
    ctx.font = '13px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';
    for (const d of drops) {
      d.y += d.v;
      if (d.y - d.len * 16 > H) { d.y = -Math.random() * 200; d.v = .6 + Math.random() * 1.6; }
      if (Math.random() < .03) d.ch[(Math.random() * d.ch.length) | 0] = RAIN[(Math.random() * RAIN.length) | 0];
      for (let k = 0; k < d.len; k++) {
        const y = d.y - k * 16;
        if (y < -16 || y > H) continue;
        const a = k === 0 ? .55 : (1 - k / d.len) * .22;
        ctx.fillStyle = k === 0 ? `rgba(200,255,170,${a})` : `rgba(118,185,0,${a})`;
        ctx.fillText(d.ch[k % d.ch.length], d.x, y);
      }
    }

    // Robots
    for (const r of robots) {
      r.x += r.vx;
      const w = 12 * r.u;
      if (r.x < r.xmin) { r.x = r.xmin; r.vx *= -1; }
      if (r.x + w > r.xmax) { r.x = r.xmax - w; r.vx *= -1; }
      if (r.blink > 0) r.blink--; else if (Math.random() < .006) r.blink = 8;
      if (r.wave > 0) { r.wave += 1; if (r.wave > 120) r.wave = 0; }
      if (r.jump > 0) { r.jump -= .02; if (r.jump < 0) r.jump = 0; }
      if (!r.say && Math.random() < .0012) { r.say = QUOTES[(Math.random() * QUOTES.length) | 0]; r.sayT = 160; r.wave = 1; }
      if (r.sayT > 0 && --r.sayT === 0) r.say = null;
      r.dx = r.x;
      r.dy = r.home + Math.sin(t * .002 + r.ph) * 10 - Math.sin(r.jump * Math.PI) * 40;
      drawRobot(r);
      if (r.say) drawBubble(r);
    }
  };
  frame();
})();
