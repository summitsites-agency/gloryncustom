/* ============================================================
   GLORYN CUSTOM — shared interactions
   cursor · menu · smooth scroll · reveals · starfield · shooting stars
   Vanilla JS, no build step. Loaded on every page.
   ============================================================ */
(function () {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ---------------------------------------------------------
     0. current year + active nav
     --------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('[data-nav]').forEach(a => {
    const target = a.getAttribute('data-nav').toLowerCase();
    const isHome = (target === 'index.html' && (path === '' || path === 'index.html'));
    if (isHome || target === path) a.setAttribute('aria-current', 'page');
  });

  /* ---------------------------------------------------------
     1. custom cursor (fine pointers only)
     --------------------------------------------------------- */
  if (fine) {
    document.documentElement.classList.add('has-cursor');
    const dot = document.createElement('div'); dot.className = 'cursor-dot';
    const ring = document.createElement('div'); ring.className = 'cursor-ring';
    const label = document.createElement('div'); label.className = 'cursor-label';
    document.body.append(dot, ring, label);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      label.style.left = mx + 'px'; label.style.top = my + 'px';
    }, { passive: true });
    (function ringLoop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(ringLoop);
    })();
    const hoverSel = 'a,button,.svc-item,.g-item,.srv,.tcard,.hcard,input,select,textarea,[data-cursor]';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverSel)) document.documentElement.classList.add('cursor-hover');
      const lab = e.target.closest('[data-cursor-label]');
      if (lab) { label.textContent = lab.getAttribute('data-cursor-label'); document.documentElement.classList.add('cursor-label-on'); }
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverSel)) document.documentElement.classList.remove('cursor-hover');
      if (e.target.closest('[data-cursor-label]')) document.documentElement.classList.remove('cursor-label-on');
    });
  }

  /* ---------------------------------------------------------
     2. per-letter title split  (data-reveal-title)
     --------------------------------------------------------- */
  document.querySelectorAll('[data-reveal-title]').forEach(title => {
    title.classList.add('reveal-title');
    const parts = title.innerHTML.split(/(<br\s*\/?>)/i);
    let html = '', d = 0;
    parts.forEach(part => {
      if (/^<br/i.test(part)) { html += part; return; }
      for (const ch of part) {
        if (ch === ' ') { html += ' '; }
        else { html += `<span class="char" style="transition-delay:${d * 0.06}s">${ch}</span>`; d++; }
      }
    });
    title.innerHTML = html;
  });

  /* line-reveal wrap */
  document.querySelectorAll('[data-lines]').forEach(el => {
    el.classList.add('line-reveal');
    const lines = el.dataset.lines.split('|');
    const stag = parseInt(el.dataset.lineStagger || '90', 10);
    el.innerHTML = '';
    lines.forEach((ln, i) => {
      const outer = document.createElement('span'); outer.className = 'ln';
      const inner = document.createElement('span'); inner.className = 'ln-in';
      inner.textContent = ln; inner.style.setProperty('--ld', (i * stag) + 'ms');
      outer.appendChild(inner); el.appendChild(outer);
    });
  });

  /* ---------------------------------------------------------
     3. reveal on scroll
     --------------------------------------------------------- */
  const revealEls = document.querySelectorAll(
    '.reveal:not([data-gate]), .reveal-title:not([data-gate]), .line-reveal:not([data-gate])'
  );
  if (reduced) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  }

  /* ---------------------------------------------------------
     4. header scrolled state
     --------------------------------------------------------- */
  const header = document.querySelector('.header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    onScroll(); addEventListener('scroll', onScroll, { passive: true });
  }

  /* expose fixed topbar (navbar + promo) height for elements glued beneath it */
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    const setTB = () => document.documentElement.style.setProperty('--topbar-h', topbar.offsetHeight + 'px');
    setTB();
    addEventListener('resize', setTB);
    addEventListener('load', setTB);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setTB);
  }

  /* homepage: hide the topbar over the sequence hero, reveal once scrolled past it */
  const seqHeroEl = document.querySelector('.seq-hero');
  if (topbar && seqHeroEl) {
    const onHeroNav = () => {
      const pastHero = seqHeroEl.getBoundingClientRect().bottom <= 0;
      topbar.classList.toggle('nav-hidden', !pastHero);
    };
    onHeroNav(); addEventListener('scroll', onHeroNav, { passive: true });
  }

  /* ---------------------------------------------------------
     5. full-screen menu overlay
     --------------------------------------------------------- */
  const menu = document.getElementById('navMenu');
  if (menu) {
    const items = menu.querySelectorAll('.nav-item');
    items.forEach((it, i) => it.style.transitionDelay = (i * 95 + 220) + 'ms');
    const open = () => {
      menu.classList.add('open'); menu.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden'; document.addEventListener('keydown', onKey);
    };
    const close = () => {
      menu.classList.remove('open'); menu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = ''; document.removeEventListener('keydown', onKey);
    };
    const onKey = e => { if (e.key === 'Escape') close(); };
    document.querySelectorAll('[data-menu-open]').forEach(b => b.addEventListener('click', open));
    document.querySelectorAll('[data-menu-close]').forEach(b => b.addEventListener('click', close));
  }

  /* ---------------------------------------------------------
     6. starfield  — twinkling stars + occasional shooting star
        (evokes the starlight-headliner product)
     --------------------------------------------------------- */
  function initStarfield(canvas) {
    if (reduced) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr, stars = [], shooters = [], raf;
    function size() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.width = Math.max(1, r.width * dpr);
      h = canvas.height = Math.max(1, r.height * dpr);
      const count = Math.min(150, Math.floor((r.width * r.height) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: (Math.random() * 1.1 + 0.3) * dpr,
        base: Math.random() * 0.5 + 0.2,
        tw: Math.random() * Math.PI * 2,
        sp: Math.random() * 0.02 + 0.005,
        gold: Math.random() < 0.35
      }));
    }
    function spawnShooter() {
      const fromLeft = Math.random() < 0.5;
      shooters.push({
        x: fromLeft ? -50 : w + 50,
        y: Math.random() * h * 0.5,
        vx: (fromLeft ? 1 : -1) * (5 + Math.random() * 4) * dpr,
        vy: (1.4 + Math.random() * 1.2) * dpr,
        life: 1, len: (90 + Math.random() * 70) * dpr
      });
    }
    let last = 0;
    function frame(t) {
      raf = requestAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.tw += s.sp;
        const a = s.base + Math.sin(s.tw) * 0.35;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283);
        ctx.fillStyle = s.gold
          ? `rgba(231,181,59,${Math.max(0, a)})`
          : `rgba(246,241,231,${Math.max(0, a * 0.9)})`;
        ctx.fill();
      }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i];
        sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.012;
        const g = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx / Math.hypot(sh.vx, sh.vy) * sh.len, sh.y - sh.vy / Math.hypot(sh.vx, sh.vy) * sh.len);
        g.addColorStop(0, `rgba(247,216,133,${Math.max(0, sh.life)})`);
        g.addColorStop(1, 'rgba(247,216,133,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6 * dpr; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(sh.x - sh.vx / Math.hypot(sh.vx, sh.vy) * sh.len, sh.y - sh.vy / Math.hypot(sh.vx, sh.vy) * sh.len);
        ctx.stroke();
        if (sh.life <= 0 || sh.x < -80 || sh.x > w + 80) shooters.splice(i, 1);
      }
      if (t - last > 2600 && Math.random() < 0.04 && shooters.length < 2) { spawnShooter(); last = t; }
    }
    size();
    const ro = new ResizeObserver(() => size()); ro.observe(canvas);
    raf = requestAnimationFrame(frame);
  }
  document.querySelectorAll('.starfield').forEach(initStarfield);

  /* ---------------------------------------------------------
     7. stats count-up
     --------------------------------------------------------- */
  const stats = document.querySelectorAll('[data-count]');
  if (stats.length) {
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target, to = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
        const dur = 2400, t0 = performance.now();
        function tick(t) {
          const p = Math.min((t - t0) / dur, 1);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = (Number.isInteger(to) ? Math.round(to * e) : (to * e).toFixed(1)) + suf;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick); io2.unobserve(el);
      });
    }, { threshold: 0.5 });
    stats.forEach(el => io2.observe(el));
  }

  /* ---------------------------------------------------------
     8. before / after reveal slider
     --------------------------------------------------------- */
  document.querySelectorAll('[data-ba]').forEach(ba => {
    let dragging = false;
    const set = (clientX) => {
      const r = ba.getBoundingClientRect();
      let p = ((clientX - r.left) / r.width) * 100;
      p = Math.max(2, Math.min(98, p));
      ba.style.setProperty('--pos', p + '%');
    };
    const down = e => { dragging = true; set((e.touches ? e.touches[0] : e).clientX); };
    const move = e => { if (dragging) set((e.touches ? e.touches[0] : e).clientX); };
    const up = () => dragging = false;
    ba.addEventListener('mousedown', down); ba.addEventListener('touchstart', down, { passive: true });
    addEventListener('mousemove', move); addEventListener('touchmove', move, { passive: true });
    addEventListener('mouseup', up); addEventListener('touchend', up);
    // gentle auto hint on first view
    if (!reduced) {
      const io3 = new IntersectionObserver((en) => {
        if (en[0].isIntersecting) {
          let v = 50, dir = -1, n = 0;
          const id = setInterval(() => {
            v += dir * 1.4; n++;
            if (v < 32) dir = 1; if (v > 68) dir = -1;
            ba.style.setProperty('--pos', v + '%');
            if (n > 40) { clearInterval(id); ba.style.setProperty('--pos', '50%'); }
          }, 16);
          io3.disconnect();
        }
      }, { threshold: 0.6 });
      io3.observe(ba);
    }
  });

  /* ---------------------------------------------------------
     8b. booking form  → POST /api/booking (Vercel function)
     --------------------------------------------------------- */
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    const statusEl = document.getElementById('bookingStatus');
    const submitBtn = document.getElementById('bookingSubmit');
    const setStatus = (msg, kind) => {
      statusEl.textContent = msg;
      statusEl.className = 'form-status show ' + kind;
    };
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!bookingForm.checkValidity()) { bookingForm.reportValidity(); return; }
      const data = Object.fromEntries(new FormData(bookingForm).entries());
      const original = submitBtn.innerHTML;
      submitBtn.disabled = true; submitBtn.innerHTML = 'Sending…';
      try {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('bad status ' + res.status);
        setStatus('Thanks — your request is in! We’ll reach out shortly to confirm your booking.', 'ok');
        bookingForm.reset();
      } catch (err) {
        setStatus('Couldn’t send just now. Please call or text 819-319-3798, or email gloryncustom@gmail.com.', 'err');
      } finally {
        submitBtn.disabled = false; submitBtn.innerHTML = original;
      }
    });
  }

  /* ---------------------------------------------------------
     8c. magnetic buttons  (awwwards signature)
     --------------------------------------------------------- */
  if (fine && !reduced) {
    document.querySelectorAll('[data-magnetic], .header .btn, .menu-btn, .hero .btn').forEach(el => {
      const strength = parseFloat(el.getAttribute('data-magnetic')) || 0.28;
      let raf;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => { el.style.transform = `translate(${x}px, ${y}px)`; });
      });
      el.addEventListener('mouseleave', () => {
        cancelAnimationFrame(raf);
        el.style.transition = 'transform .5s cubic-bezier(.22,1,.36,1)';
        el.style.transform = 'translate(0,0)';
        setTimeout(() => { el.style.transition = ''; }, 500);
      });
    });
  }

  /* ---------------------------------------------------------
     8d. scroll-velocity skew on media  (awwwards "skewElem")
     --------------------------------------------------------- */
  const skewEls = document.querySelectorAll('[data-skew]');
  if (skewEls.length && !reduced) {
    let last = window.scrollY, cur = 0, target = 0;
    addEventListener('scroll', () => {
      const now = window.scrollY;
      target = Math.max(-6, Math.min(6, (now - last) * 0.25));
      last = now;
    }, { passive: true });
    (function loop() {
      cur += (target - cur) * 0.1;
      target += (0 - target) * 0.08; // decay back to 0 when scrolling stops
      const v = Math.abs(cur) < 0.02 ? 0 : cur;
      skewEls.forEach(el => { el.style.transform = `skewY(${v}deg)`; });
      requestAnimationFrame(loop);
    })();
  }

  /* ---------------------------------------------------------
     8e. horizontal-scroll pinned gallery
     --------------------------------------------------------- */
  document.querySelectorAll('[data-hscroll]').forEach(section => {
    const sticky = section.querySelector('.hscroll-sticky');
    const track = section.querySelector('.hscroll-track');
    const bar = section.querySelector('.hscroll-progress i');
    const counter = section.querySelector('[data-hcount]');
    const cards = track ? track.children.length : 0;
    if (!sticky || !track) return;
    if (reduced) { section.classList.add('is-static'); return; }

    function sizeSection() {
      // extra scroll distance = how far the track overflows the viewport
      const overflow = Math.max(0, track.scrollWidth - window.innerWidth);
      section.style.height = (window.innerHeight + overflow) + 'px';
      return overflow;
    }
    let overflow = sizeSection();
    addEventListener('resize', () => { overflow = sizeSection(); });

    function onScroll() {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      let p = (-rect.top) / total;
      p = Math.max(0, Math.min(1, p));
      track.style.transform = `translateX(${-overflow * p}px)`;
      if (bar) bar.style.width = (p * 100) + '%';
      if (counter && cards) counter.textContent =
        String(Math.min(cards, Math.floor(p * cards) + 1)).padStart(2, '0') + ' / ' + String(cards).padStart(2, '0');
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  });

  /* ---------------------------------------------------------
     9. loader
     --------------------------------------------------------- */
  const loader = document.getElementById('loader');
  if (loader) {
    const fill = loader.querySelector('.loader-fill');
    const count = loader.querySelector('.loader-count');
    document.body.style.overflow = 'hidden';
    // slow, cinematic loader on the homepage and on the first visit of the session; quick elsewhere
    const isHome = (path === '' || path === 'index.html');
    const firstLoad = !sessionStorage.getItem('gcVisited');
    try { sessionStorage.setItem('gcVisited', '1'); } catch (e) {}
    const DUR = reduced ? 300 : ((isHome || firstLoad) ? 2400 : 750), t0 = performance.now();
    function step(t) {
      const p = Math.min((t - t0) / DUR, 1);
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      if (fill) fill.style.width = (e * 100) + '%';
      if (count) count.textContent = String(Math.round(e * 100)).padStart(3, '0');
      if (p < 1) requestAnimationFrame(step);
      else {
        loader.classList.add('done');
        document.body.style.overflow = '';
        document.querySelectorAll('[data-gate]').forEach(el => el.classList.add('is-visible'));
      }
    }
    requestAnimationFrame(step);
  } else {
    document.querySelectorAll('[data-gate]').forEach(el => el.classList.add('is-visible'));
  }
})();
