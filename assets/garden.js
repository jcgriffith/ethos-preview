/* Ethos garden: flowers drawn in code, inspired by the floral rug in Suite 207.
   Usage: <div class="garden" data-garden="band|edge|corner|flower" data-seed="3" data-palette="day|dusk"></div>
   Every flower is generated from a seed, so a given seed always grows the same garden. */
(() => {
  const NS = 'http://www.w3.org/2000/svg';
  const PALETTES = {
    day: {
      petals: [
        ['#a82c45', '#d4526a', '#f2a79d'],   // raspberry rose
        ['#cf6a2a', '#e3a52b', '#f7d680'],   // marigold
        ['#d4526a', '#f2a79d', '#fce6d6'],   // blush
        ['#dc9a22', '#f0c259', '#fbf1dc'],   // butter
        ['#256a70', '#5fa5a5', '#d2e6df'],   // teal
      ],
      centers: ['#e3a52b', '#8c3a2b', '#fbf1dc', '#173733'],
      leaves: ['#2d6e73', '#1d4b52', '#5c7340', '#7c9a6a'],
    },
    dusk: {
      petals: [
        ['#3f7d86', '#7fb0b3', '#d3e6e0'],   // dusty blue
        ['#c0606a', '#eba59b', '#fbe3d2'],   // blush
        ['#c9821f', '#e3a52b', '#f6d27a'],   // marigold
        ['#b9a57c', '#ecdcb0', '#fbf6ec'],   // cream
      ],
      centers: ['#e3a52b', '#fbf1dc', '#a4532d'],
      leaves: ['#2f6b63', '#3f857a', '#5c8a6a'],
    },
  };
  PALETTES.edge = { ...PALETTES.day, leaves: ['#2d6e73', '#5c7340', '#7c9a6a'] };

  const rngFrom = (seed) => {
    let a = (seed * 2654435761) >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const el = (name, attrs, parent) => {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const f = (n) => +n.toFixed(2);
  const pick = (r, list) => list[Math.floor(r() * list.length)];
  const EDGE = { stroke: 'rgba(30,20,10,.14)' };

  // A petal pointing up from the centre: length len, half-width w.
  const petal = (len, w) =>
    `M0 0C${f(w)} ${f(-len * .3)} ${f(w)} ${f(-len * .86)} 0 ${f(-len)}C${f(-w)} ${f(-len * .86)} ${f(-w)} ${f(-len * .3)} 0 0Z`;
  const ring = (g, n, len, w, fill, turn = 0, sw = 1) => {
    for (let i = 0; i < n; i++)
      el('path', { d: petal(len, w), fill, transform: `rotate(${f(turn + (360 / n) * i)})`, ...EDGE, 'stroke-width': sw }, g);
  };
  const puffs = (g, n, dist, rad, fill, turn = 0, sw = 1) => {
    for (let i = 0; i < n; i++) {
      const a = ((turn + (360 / n) * i) * Math.PI) / 180;
      el('circle', { cx: f(Math.cos(a) * dist), cy: f(Math.sin(a) * dist), r: f(rad), fill, ...EDGE, 'stroke-width': sw }, g);
    }
  };

  const FLOWERS = {
    // Layered rose, like the big raspberry blooms on the rug.
    rose(g, r, c, centre, rnd) {
      const sw = Math.max(.6, r * .03), t = rnd() * 360;
      el('circle', { r: f(r * .66), fill: c[0] }, g);
      puffs(g, 8, r * .6, r * .4, c[0], t, sw);
      puffs(g, 6, r * .34, r * .3, c[1], t + 20, sw);
      puffs(g, 5, r * .14, r * .17, c[2], t + 45, sw);
      el('circle', { r: f(r * .09), fill: centre }, g);
    },
    // Marigold / zinnia: two rows of narrow petals round a dotted centre.
    daisy(g, r, c, centre, rnd) {
      const sw = Math.max(.6, r * .025), n = 11 + Math.floor(rnd() * 4), t = rnd() * 360;
      ring(g, n, r, r * .2, c[0], t, sw);
      ring(g, n, r * .72, r * .17, c[1], t + 180 / n, sw);
      el('circle', { r: f(r * .3), fill: centre }, g);
      puffs(g, 8, r * .19, r * .04, c[2], t, 0);
    },
    // Five-petal blossom.
    blossom(g, r, c, centre, rnd) {
      const sw = Math.max(.6, r * .03), t = rnd() * 72;
      ring(g, 5, r, r * .5, c[2], t, sw);
      ring(g, 5, r * .56, r * .17, c[1], t, 0);
      el('circle', { r: f(r * .17), fill: centre }, g);
      puffs(g, 5, r * .3, r * .045, c[0], t + 36, 0);
    },
  };
  const TYPES = Object.keys(FLOWERS);

  // A leafy sprig growing along +x from the origin.
  const sprig = (g, len, fill, rnd) => {
    const bend = (rnd() - .5) * len * .5;
    el('path', { d: `M0 0Q${f(len * .5)} ${f(bend)} ${f(len)} 0`, fill: 'none', stroke: fill, 'stroke-width': f(Math.max(1, len * .035)), 'stroke-linecap': 'round' }, g);
    const leaf = (x, y, l, rot) =>
      el('path', {
        d: `M0 0C${f(l * .25)} ${f(-l * .32)} ${f(l * .7)} ${f(-l * .26)} ${f(l)} 0C${f(l * .7)} ${f(l * .26)} ${f(l * .25)} ${f(l * .32)} 0 0Z`,
        fill, transform: `translate(${f(x)} ${f(y)}) rotate(${f(rot)})`,
      }, g);
    for (let j = 0; j < 3; j++) {
      const t = (j + 1) / 4.3, x = t * len, y = 2 * t * (1 - t) * bend, l = len * .36 * (1 - t * .35);
      leaf(x, y, l, -48 - rnd() * 14);
      leaf(x, y, l, 48 + rnd() * 14);
    }
    leaf(len * .96, 0, len * .3, 0);
  };

  // Wrap a drawing in the groups that position, bloom, sway and spin it.
  const plant = (svg, x, y, cls, delay, draw, rnd) => {
    const at = el('g', { transform: `translate(${f(x)} ${f(y)})`, class: cls }, svg);
    const lean = el('g', { class: 'g-lean' }, at);
    const bloom = el('g', { class: 'g-bloom', style: `--d:${Math.round(delay)}ms` }, lean);
    const sway = el('g', { class: 'g-sway', style: `--t:${f(6 + rnd() * 6)}s;--a:${f(2.5 + rnd() * 4)}deg;animation-delay:${f(-rnd() * 8)}s` }, bloom);
    draw(el('g', { class: 'g-spin' }, sway));
    return at;
  };
  const addFlower = (svg, x, y, r, pal, rnd, delay, type, avoid) => {
    let cols = pick(rnd, pal.petals);
    if (cols === avoid) cols = pal.petals[(pal.petals.indexOf(cols) + 1) % pal.petals.length];
    const centre = pick(rnd, pal.centers.filter((c) => c !== cols[0] && c !== cols[1]));
    plant(svg, x, y, 'g-flower', delay, (g) => FLOWERS[type || pick(rnd, TYPES)](g, r, cols, centre, rnd), rnd);
    return cols;
  };
  const addSprig = (svg, x, y, len, angle, pal, rnd, delay) =>
    plant(svg, x, y, 'g-leaf', delay, (g) => { g.setAttribute('transform', `rotate(${f(angle)})`); sprig(g, len, pick(rnd, pal.leaves), rnd); }, rnd);

  const LAYOUTS = {
    // A strip of rug. "edge" lets the flowers stand proud of the strip instead of being cropped.
    band(svg, W, H, pal, rnd, edge) {
      const n = Math.max(3, Math.round(W / (H * (edge ? 1.5 : 1.05))));
      const step = W / n, big = [], small = [], leaves = [];
      for (let i = 0; i < n; i++) {
        const r = H * (edge ? .26 + rnd() * .14 : .33 + rnd() * .17);
        let x = (i + .5 + (rnd() - .5) * .34) * step;
        if (edge) x = Math.min(W - r - 4, Math.max(r + 4, x));
        const y = H * (.5 + (rnd() - .5) * (edge ? .22 : .5));
        big.push({ x, y, r, d: 80 * i + rnd() * 120 });
        const k = 2 + Math.floor(rnd() * 2), base = rnd() * 360;
        for (let j = 0; j < k; j++)
          leaves.push({ x, y, len: r * (1.5 + rnd() * .7), a: base + (360 / k) * j + (rnd() - .5) * 50, d: 80 * i });
        const sx = (i + 1) * step + (rnd() - .5) * step * .2;
        if (i < n - 1 || !edge)
          small.push({ x: sx, y: y < H / 2 ? H * (.68 + rnd() * .2) : H * (.12 + rnd() * .2), r: H * (.11 + rnd() * .07), d: 80 * i + 260 });
      }
      leaves.forEach((l) => addSprig(svg, l.x, l.y, l.len, l.a, pal, rnd, l.d));
      small.forEach((s) => addFlower(svg, s.x, s.y, s.r, pal, rnd, s.d, rnd() < .6 ? 'blossom' : 'daisy'));
      let last;
      big.forEach((b) => { last = addFlower(svg, b.x, b.y, b.r, pal, rnd, b.d + 120, null, last); });
    },
    // A posy tucked into the bottom-right corner of a 100 x 100 box.
    corner(svg, W, H, pal, rnd) {
      const spots = [[66, 68, 21], [36, 85, 14], [86, 36, 12], [14, 93, 7], [94, 12, 6]];
      spots.slice(0, 3).forEach(([x, y, r], i) => {
        for (let j = 0; j < 3; j++) addSprig(svg, x, y, r * (1.7 + rnd() * .8), 180 + j * 38 + (rnd() - .5) * 26 + i * 12, pal, rnd, 150 * i);
      });
      let last;
      spots.forEach(([x, y, r], i) => { last = addFlower(svg, x, y, r, pal, rnd, 150 * i + 200, i > 2 ? 'blossom' : null, last); });
    },
    // One flower filling a 100 x 100 box.
    flower(svg, W, H, pal, rnd, _edge, type) {
      addFlower(svg, 50, 50, 46, pal, rnd, 0, type);
    },
  };

  const render = (host) => {
    const kind = host.dataset.garden || 'band';
    const edge = kind === 'edge';
    const layout = edge ? 'band' : kind;
    const strip = layout === 'band';
    const W = strip ? Math.max(200, Math.round(host.clientWidth)) : 100;
    const H = strip ? Math.max(40, Math.round(host.clientHeight)) : 100;
    const pal = PALETTES[host.dataset.palette || (edge ? 'edge' : 'day')] || PALETTES.day;
    const seed = +host.dataset.seed || 1;
    host.querySelector('svg')?.remove();
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', focusable: 'false' });
    LAYOUTS[layout](svg, W, H, pal, rngFrom(seed), edge, host.dataset.flower);
    host.appendChild(svg);
    host._w = W;
    host._pal = pal;
  };

  const start = () => {
    // Flower bullets: give each list item its own small flower.
    document.querySelectorAll('[data-garden-bullets]').forEach((list) => {
      [...list.children].forEach((li, i) => {
        const b = document.createElement('span');
        b.className = 'garden garden-bullet';
        b.dataset.garden = 'flower';
        b.dataset.seed = i * 7 + 3;
        b.dataset.flower = TYPES[i % TYPES.length];
        b.style.setProperty('--i', i);
        li.prepend(b);
      });
    });
    const hosts = [...document.querySelectorAll('.garden')];
    hosts.forEach(render);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      }), { threshold: .2 });
      hosts.forEach((h) => io.observe(h));
    } else hosts.forEach((h) => h.classList.add('in'));

    let timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(() => hosts.forEach((h) => {
        if (/band|edge/.test(h.dataset.garden || 'band') && Math.abs(h.clientWidth - h._w) > 40) render(h);
      }), 200);
    });
    // Tap a flower to give it a twirl (hover does the same with a mouse). Tap a strip of rug to plant a new one.
    document.addEventListener('click', (e) => {
      if (!e.target.closest) return;
      const fl = e.target.closest('.g-flower');
      if (fl) {
        fl.classList.add('twirl');
        setTimeout(() => fl.classList.remove('twirl'), 900);
        return;
      }
      const host = e.target.closest('.rug.garden'), svg = host && host.querySelector('svg');
      if (!svg) return;
      const box = svg.getBoundingClientRect(), rnd = rngFrom((Math.random() * 1e9) | 0);
      const x = e.clientX - box.left, y = e.clientY - box.top, r = box.height * (.15 + rnd() * .13);
      addSprig(svg, x, y, r * 1.9, rnd() * 360, host._pal, rnd, 0).classList.add('g-new');
      addFlower(svg, x, y, r, host._pal, rnd, 0);
      svg.lastElementChild.classList.add('g-new');
    });

    // With a mouse, nearby flowers lean a little toward the pointer.
    if (matchMedia('(pointer: fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let px = 0, py = 0, queued = false;
      const leaning = new Set();
      const update = () => {
        queued = false;
        const near = new Set();
        document.querySelectorAll('.garden').forEach((h) => {
          const b = h.getBoundingClientRect();
          if (px < b.left - 150 || px > b.right + 150 || py < b.top - 150 || py > b.bottom + 150) return;
          const svg = h.querySelector('svg');
          if (!svg) return;
          const k = b.width / svg.viewBox.baseVal.width;   // screen pixels per drawing unit
          h.querySelectorAll('.g-flower').forEach((fl) => {
            const r = fl.getBoundingClientRect();
            const dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2), d = Math.hypot(dx, dy);
            if (d > 150 || d < 1) return;
            const pull = (Math.min(9, r.width * .2) * (1 - d / 150)) / k;
            fl.firstChild.style.transform = `translate(${f((dx / d) * pull)}px, ${f((dy / d) * pull)}px)`;
            near.add(fl);
          });
        });
        leaning.forEach((fl) => { if (!near.has(fl)) { fl.firstChild.style.transform = ''; leaning.delete(fl); } });
        near.forEach((fl) => leaning.add(fl));
      };
      addEventListener('pointermove', (e) => {
        px = e.clientX; py = e.clientY;
        if (!queued) { queued = true; requestAnimationFrame(update); }
      }, { passive: true });
    }
  };
  window.EthosGarden = { render, PALETTES };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
