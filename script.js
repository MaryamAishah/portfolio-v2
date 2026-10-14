(() => {
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const HOST = 'maryamroomi.vercel.app';
  const PALETTE = ['peach', 'sky', 'butter', 'sage', 'rose', 'mint', 'lilac', 'pistachio', 'sand'];

  const win = $('#win');
  const vp = $('#vp');
  const tabsEl = $('#tabs');
  const pathEl = $('#path');
  const omni = $('#omni');
  const loadbar = $('#loadbar');
  const status = $('#status');
  const btnBack = $('#btn-back');
  const btnFwd = $('#btn-fwd');
  const btnReload = $('#btn-reload');
  const btnTheme = $('#btn-theme');

  const sections = $$('.sec');
  const byId = id => sections.find(s => s.id === id);
  const pathOf = sec => (sec.id === 'home' ? '' : sec.id);
  const accentOf = sec => `var(--${sec.dataset.accent})`;

  const glyph = sec => {
    const g = document.createElement('span');
    g.className = `glyph g-${sec.dataset.glyph}`;
    g.setAttribute('aria-hidden', 'true');
    return g;
  };

  /* ---------- build tabs, section glyphs, index cards ---------- */

  sections.forEach(sec => sec.style.setProperty('--a', accentOf(sec)));

  const tabs = sections.map(sec => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tab';
    b.setAttribute('role', 'tab');
    b.dataset.target = sec.id;
    b.style.setProperty('--a', accentOf(sec));
    const label = document.createElement('span');
    label.className = 'lbl';
    label.textContent = sec.dataset.label;
    b.append(glyph(sec), label);
    b.insertAdjacentHTML('beforeend', '<span class="foot l"></span><span class="foot r"></span>');
    b.addEventListener('click', () => go(sec.id));
    tabsEl.append(b);
    return b;
  });

  sections.forEach(sec => {
    const head = $('.sec-head', sec);
    if (head) head.prepend(glyph(sec));
  });

  const index = $('#index');
  sections.slice(1).forEach(sec => {
    const a = document.createElement('a');
    a.className = 'card';
    a.href = '#' + sec.id;
    a.dataset.status = `https://${HOST}/#${sec.id}`;
    a.style.setProperty('--a', accentOf(sec));
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = sec.dataset.label;
    a.append(glyph(sec), name);
    a.insertAdjacentHTML('beforeend', '<svg class="arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 11 11 5M6 5h5v5"/></svg>');
    a.addEventListener('click', e => { e.preventDefault(); go(sec.id); });
    index.append(a);
  });

  /* ---------- text splitting + highlight wrappers ---------- */

  let n = 0;
  $$('.split').forEach(el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    let i = 0;
    text.split(' ').forEach((word, wi, words) => {
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      for (const c of word) {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        s.style.setProperty('--i', i++);
        s.style.setProperty('--c', `var(--${PALETTE[n++ % PALETTE.length]})`);
        w.append(s);
      }
      el.append(w);
      if (wi < words.length - 1) el.append(' ');
    });
  });

  $$('.entry h3, .cert h3').forEach(h => {
    const span = document.createElement('span');
    span.className = 'hl';
    span.append(...h.childNodes);
    h.append(span);
  });

  /* ---------- scroll reveal (fades in on enter, out on leave) ---------- */

  const targets = $$([
    '.contact > *', '.card', '.meta', '.entry h3', '.org', '.bul li', '.lead',
    '.chip', '.cert', '.score-row > h3', '.score-row > .score', '.cell'
  ].join(','));
  const targetSet = new Set(targets);

  targets.forEach(t => {
    t.classList.add('reveal');
    const sibs = [...t.parentElement.children].filter(c => targetSet.has(c));
    const step = t.classList.contains('chip') ? 35 : 70;
    t.style.setProperty('--d', `${Math.min(sibs.indexOf(t), 14) * step}ms`);
  });

  const splits = $$('.split');
  splits.forEach(s => s.classList.add('reveal'));
  const observed = targets.concat(splits);

  let io;
  const observe = () => {
    io = new IntersectionObserver(entries => {
      for (const e of entries) e.target.classList.toggle('in', e.isIntersecting);
    }, { root: vp, rootMargin: '-5% 0px -5% 0px', threshold: 0.12 });
    observed.forEach(t => io.observe(t));
  };
  observe();

  /* ---------- address bar ---------- */

  let typeTimer;
  const typePath = path => {
    const target = '/' + path;
    clearTimeout(typeTimer);
    if (reduce.matches) { pathEl.textContent = target; return; }
    omni.classList.add('typing');
    const step = () => {
      const cur = pathEl.textContent;
      let k = 0;
      while (k < cur.length && k < target.length && cur[k] === target[k]) k++;
      if (cur.length > k) {
        pathEl.textContent = cur.slice(0, -1);
        typeTimer = setTimeout(step, 14);
      } else if (cur.length < target.length) {
        pathEl.textContent = target.slice(0, cur.length + 1);
        typeTimer = setTimeout(step, 28);
      } else {
        typeTimer = setTimeout(() => omni.classList.remove('typing'), 1100);
      }
    };
    step();
  };

  /* ---------- load bar ---------- */

  const startLoad = () => {
    loadbar.style.transition = 'none';
    loadbar.style.width = '0';
    loadbar.style.opacity = '1';
    void loadbar.offsetWidth;
    loadbar.style.transition = 'width 1.4s cubic-bezier(.1,.6,.2,1)';
    loadbar.style.width = '78%';
  };
  const finishLoad = () => {
    loadbar.style.transition = 'width .3s cubic-bezier(.2,.7,.2,1), opacity .45s ease .3s';
    loadbar.style.width = '100%';
    loadbar.style.opacity = '0';
  };

  /* ---------- active section ---------- */

  let current = null;

  const showTab = t => {
    const L = t.offsetLeft, R = L + t.offsetWidth;
    const s = tabsEl.scrollLeft, w = tabsEl.clientWidth;
    if (L < s + 20) tabsEl.scrollTo({ left: L - 28, behavior: 'smooth' });
    else if (R > s + w - 20) tabsEl.scrollTo({ left: R - w + 28, behavior: 'smooth' });
  };

  const setActive = id => {
    if (id === current) return;
    current = id;
    const sec = byId(id);
    tabs.forEach(t => {
      const on = t.dataset.target === id;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', on);
      if (on) showTab(t);
    });
    win.style.setProperty('--cur', accentOf(sec));
    typePath(pathOf(sec));
    const label = sec.dataset.label.toLowerCase();
    document.title = id === 'home' ? 'maryam roomi' : `${label} · maryam roomi`;
    try { history.replaceState(null, '', id === 'home' ? location.pathname + location.search : '#' + id); } catch (e) {}
  };

  let lock = false;
  const sync = () => {
    if (lock) return;
    const y = vp.scrollTop + vp.clientHeight * 0.32;
    let cur = sections[0];
    for (const s of sections) if (s.offsetTop <= y) cur = s;
    setActive(cur.id);
  };

  let ticking = false;
  vp.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; sync(); });
  }, { passive: true });

  /* ---------- navigation + history ---------- */

  const hist = [];
  let hp = -1;

  const updateNav = () => {
    btnBack.disabled = hp <= 0;
    btnFwd.disabled = hp >= hist.length - 1;
  };

  let navToken = 0;
  const go = (id, { push = true, smooth = true } = {}) => {
    const sec = byId(id);
    if (!sec) return;

    if (push) {
      hist.splice(hp + 1);
      if (current && hist[hist.length - 1] !== current) hist.push(current);
      if (hist[hist.length - 1] !== id) hist.push(id);
      hp = hist.length - 1;
    }
    updateNav();

    setActive(id);
    lock = true;
    startLoad();

    const top = id === 'home' ? 0 : sec.offsetTop;
    const behavior = smooth && !reduce.matches ? 'smooth' : 'auto';
    const token = ++navToken;
    const done = () => {
      if (token !== navToken) return;
      lock = false;
      finishLoad();
      sync();
    };

    vp.scrollTo({ top, behavior });
    if (behavior === 'auto' || Math.abs(vp.scrollTop - top) < 2) {
      setTimeout(done, 120);
    } else {
      if ('onscrollend' in vp) vp.addEventListener('scrollend', done, { once: true });
      setTimeout(done, 1400);
    }
  };

  btnBack.addEventListener('click', () => {
    if (hp <= 0) return;
    hp--;
    go(hist[hp], { push: false });
  });
  btnFwd.addEventListener('click', () => {
    if (hp >= hist.length - 1) return;
    hp++;
    go(hist[hp], { push: false });
  });

  btnReload.addEventListener('click', () => {
    btnReload.classList.remove('spin');
    void btnReload.offsetWidth;
    btnReload.classList.add('spin');
    startLoad();
    io.disconnect();
    observed.forEach(t => t.classList.remove('in'));
    setTimeout(() => { observe(); finishLoad(); }, 450);
  });

  /* ---------- status bubble (link preview, bottom left) ---------- */

  document.addEventListener('mouseover', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    status.textContent = a.dataset.status || a.href;
    status.classList.add('on');
  });
  document.addEventListener('mouseout', e => {
    const a = e.target.closest('a[href]');
    if (a && !a.contains(e.relatedTarget)) status.classList.remove('on');
  });

  /* ---------- theme ---------- */

  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;

  const applyTheme = t => {
    root.dataset.theme = t;
    try { localStorage.setItem('theme', t); } catch (e) {}
  };

  btnTheme.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    if (!document.startViewTransition || reduce.matches) { applyTheme(next); return; }
    const r = btnTheme.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const vt = document.startViewTransition(() => applyTheme(next));
    vt.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 750, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  });

  /* ---------- window controls ---------- */

  const minimize = () => document.body.classList.add('min');
  $('#btn-min').addEventListener('click', minimize);
  $('#btn-close').addEventListener('click', minimize);
  $('#dock').addEventListener('click', () => document.body.classList.remove('min'));
  $('#btn-max').addEventListener('click', () => document.body.classList.toggle('max'));
  $('#tabstrip').addEventListener('dblclick', e => {
    if (e.target.closest('.tab, .winctl')) return;
    document.body.classList.toggle('max');
  });

  /* ---------- keyboard ---------- */

  addEventListener('keydown', e => {
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); btnBack.click(); return; }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); btnFwd.click(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key) && sections[+e.key - 1]) go(sections[+e.key - 1].id);
  });

  /* ---------- start ---------- */

  const start = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (byId(id) && id !== 'home') {
      hist.push(id); hp = 0;
      go(id, { push: false, smooth: false });
    } else {
      hist.push('home'); hp = 0;
      sync();
    }
    updateNav();
    vp.focus({ preventScroll: true });
  };

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
  else addEventListener('load', start);
})();
