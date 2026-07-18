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
     8f. instagram strip — populate from cached Behold feed
         (assets/data/instagram.json, refreshed weekly by CI).
         Falls back to the placeholder tiles already in the HTML.
     --------------------------------------------------------- */
  const instaTiles = document.querySelector('[data-insta-tiles]');
  if (instaTiles) {
    fetch('assets/data/instagram.json', { cache: 'no-cache' })
      .then(r => r.ok ? r.json() : [])
      .then(items => {
        if (!Array.isArray(items) || !items.length) return; // keep placeholders
        instaTiles.textContent = '';
        items.slice(0, 4).forEach(post => {
          if (!post || !post.image) return;
          const a = document.createElement('a');
          a.className = 'insta__tile insta__tile--live';
          a.href = post.permalink || 'https://www.instagram.com/gloryncustom/';
          a.target = '_blank'; a.rel = 'noopener';
          const img = document.createElement('img');
          img.className = 'insta__img'; img.loading = 'lazy';
          img.src = post.image; img.alt = 'Instagram post by @gloryncustom';
          a.appendChild(img);
          const ov = document.createElement('div'); ov.className = 'insta__overlay';
          const stats = document.createElement('p'); stats.className = 'insta__stats';
          if (post.likes != null) { const s = document.createElement('span'); s.textContent = '♥ ' + post.likes; stats.appendChild(s); }
          if (post.comments != null) { const s = document.createElement('span'); s.textContent = '💬 ' + post.comments; stats.appendChild(s); }
          if (stats.childNodes.length) ov.appendChild(stats);
          if (post.caption) { const c = document.createElement('p'); c.className = 'insta__caption'; c.textContent = post.caption; ov.appendChild(c); }
          a.appendChild(ov);
          instaTiles.appendChild(a);
        });
      })
      .catch(() => { /* keep placeholders */ });
  }

  /* ---------------------------------------------------------
     8g. services orbit — rotating ring of service cards
         spins on its own; hover (or tap) a card to stop the
         ring, glide that card to the top, lift it, and name it
     --------------------------------------------------------- */
  const orbitStage = document.querySelector('.orbit-stage');
  if (orbitStage) {
    const tiltWrap = orbitStage.querySelector('.orbit-tilt');
    const orbit = orbitStage.querySelector('.orbit');
    const items = [...orbitStage.querySelectorAll('.gen-item')];
    const total = items.length;
    let radius = 0, focused = -1;
    let rotation = 0, speed = 10, targetRot = 0, mode = 'spin';

    // place one card: base position around the ring, pushed out + scaled when focused
    function place(i) {
      const item = items[i], on = (i === focused), extra = on ? 1.12 : 1;
      const angle = (i / total) * Math.PI * 2;
      const x = Math.cos(angle) * radius * extra;
      const y = Math.sin(angle) * radius * extra;
      const deg = angle * (180 / Math.PI);
      item.style.transform =
        `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${deg + 90}deg)`;
      item.querySelector('.gen-img').style.transform =
        on ? 'translateZ(60px) scale(1.08)' : 'translateZ(30px)';
    }
    function placeAll() { for (let i = 0; i < total; i++) place(i); }

    function layout() {
      const r = orbitStage.getBoundingClientRect();
      radius = Math.max(94, Math.min(r.width, r.height) * 0.31);
      placeAll();
    }
    layout();
    addEventListener('resize', layout, { passive: true });

    // spin the ring so card i lands upright at the top (12 o'clock)
    function focusTo(i) {
      if (i === focused || i < 0) return;
      focused = i;
      items.forEach((it, k) => it.classList.toggle('is-focus', k === i));
      placeAll();
      const want = 270 - (i / total) * 360;              // orbit angle that tops card i
      targetRot = want + Math.round((rotation - want) / 360) * 360; // nearest to current
      if (reduced) { rotation = targetRot; orbit.style.transform = `rotate(${rotation}deg)`; }
      else mode = 'focus';
    }
    function clearFocus() {
      if (focused === -1) return;
      focused = -1;
      items.forEach(it => it.classList.remove('is-focus'));
      placeAll();
      speed = Math.max(speed, 0.6); // gentle nudge back to cruise
      mode = 'spin';
    }

    if (!reduced) {
      (function frame() {
        if (mode === 'focus') {
          rotation += (targetRot - rotation) * 0.055; // gentle glide to the chosen card
        } else {
          speed += (0.08 - speed) * 0.025;           // ramp down to a slow cruise
          rotation += speed;
        }
        orbit.style.transform = `rotate(${rotation}deg)`;
        requestAnimationFrame(frame);
      })();

      // 3D parallax tilt following the pointer (desktop only), vanilla lerp
      if (fine && tiltWrap) {
        let tx = 0, ty = 0, cx = 0, cy = 0;
        addEventListener('mousemove', e => {
          tx = (e.clientX / innerWidth - 0.5) * 16;
          ty = (e.clientY / innerHeight - 0.5) * -16;
        }, { passive: true });
        (function tilt() {
          cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
          tiltWrap.style.transform = `rotateY(${cx}deg) rotateX(${cy}deg)`;
          requestAnimationFrame(tilt);
        })();
      }
    }

    // hover to focus (desktop): driven by real pointer movement, so cards
    // sweeping under a still cursor never hijack the selection
    if (fine) {
      orbitStage.addEventListener('mousemove', e => {
        const card = e.target.closest('.gen-item');
        if (card) focusTo(items.indexOf(card));
      });
      orbitStage.addEventListener('mouseleave', clearFocus);
    }
    // tap to focus (touch / click) — toggles the card
    items.forEach((item, i) => {
      item.addEventListener('click', () => { focused === i ? clearFocus() : focusTo(i); });
    });
  }

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
