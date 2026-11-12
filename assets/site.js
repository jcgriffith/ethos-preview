/* Ethos site behaviour: sections rise in on scroll, the phone call bar, and the breathing flower. */
(() => {
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sections rise in as they scroll into view.
  if (!calm && 'IntersectionObserver' in window) {
    const picks = [...document.querySelectorAll(
      'main .section-head, main .concerns > *, main .breath > *, main .path, main .person > *, main .film > *, main .find > *, main .cta, main .card, main .approach, main .prose, main .grid-2 > *, main details.faq, main .note'
    )].filter((n) => !n.closest('.hero, .page-hero'));
    const set = new Set(picks);
    const tops = picks.filter((n) => { for (let p = n.parentElement; p; p = p.parentElement) if (set.has(p)) return false; return true; });
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    tops.forEach((n) => {
      const sibs = [...n.parentElement.children].filter((c) => tops.includes(c));
      n.style.setProperty('--rd', Math.min(sibs.indexOf(n), 3) * 90 + 'ms');
      n.classList.add('js-reveal');
      io.observe(n);
    });
  }

  // Phone call bar: stays tucked away until the visitor has scrolled past the top of the page.
  const bar = document.querySelector('.callbar');
  if (bar) {
    const tuck = () => bar.classList.toggle('tucked', scrollY < 320);
    tuck();
    addEventListener('scroll', tuck, { passive: true });
  }

  // Breathing flower: opens for a four-second breath in, closes for a six-second breath out, six times.
  const sec = document.querySelector('[data-breath]');
  if (!sec) return;
  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent.appendChild(n);
    return n;
  };
  const petal = (len, w) => `M0 0C${w} ${-len * .3} ${w} ${-len * .86} 0 ${-len}C${-w} ${-len * .86} ${-w} ${-len * .3} 0 0Z`;
  const flower = sec.querySelector('[data-breath-flower]');
  const svg = el('svg', { viewBox: '-112 -112 224 224', 'aria-hidden': 'true', focusable: 'false' }, flower);
  el('circle', { r: 106, fill: '#ead9bd', class: 'halo' }, svg);
  [
    [8, 102, 15, ['#2d6e73', '#5c7340'], 22.5],
    [10, 86, 22, ['#d4526a'], 0],
    [10, 64, 18, ['#f2a79d'], 18],
    [8, 42, 13, ['#f7d680'], 0],
  ].forEach(([n, len, w, fills, turn], r) => {
    const g = el('g', { class: `ring r${r}` }, svg);
    for (let i = 0; i < n; i++)
      el('path', { d: petal(len, w), fill: fills[i % fills.length], stroke: 'rgba(30,20,10,.14)', transform: `rotate(${turn + (360 / n) * i})` }, g);
  });
  el('circle', { r: 14, fill: '#e3a52b' }, svg);
  for (let i = 0; i < 8; i++) el('circle', { cx: Math.cos(i * Math.PI / 4) * 8, cy: Math.sin(i * Math.PI / 4) * 8, r: 1.7, fill: '#fbf1dc' }, svg);
  sec.hidden = false;

  const btn = sec.querySelector('[data-breath-toggle]'), cue = sec.querySelector('[data-breath-cue]');
  const REST = cue.textContent, START = btn.textContent, BREATHS = 6;
  let timer = 0, running = false;
  const move = (closed, secs) => { flower.style.setProperty('--dur', secs + 's'); flower.classList.toggle('closed', closed); };
  const say = (text, small) => { cue.textContent = text; if (small) { const s = document.createElement('small'); s.textContent = small; cue.appendChild(s); } };
  const breathe = (n) => {
    move(false, 4); say('Breathe in…', `Breath ${n} of ${BREATHS}`);
    timer = setTimeout(() => {
      move(true, 6); say('Breathe out…', `Breath ${n} of ${BREATHS}`);
      timer = setTimeout(() => (n < BREATHS ? breathe(n + 1) : finish()), 6000);
    }, 4000);
  };
  const finish = () => { running = false; move(false, 2); say('That’s a minute. Notice how you feel.'); btn.textContent = 'Go again'; };
  btn.addEventListener('click', () => {
    clearTimeout(timer);
    if (running) { running = false; move(false, 1.5); say(REST); btn.textContent = START; return; }
    running = true; btn.textContent = 'Stop';
    move(true, 1.6); say('Let your shoulders drop…');
    timer = setTimeout(() => breathe(1), 2000);
  });
})();
