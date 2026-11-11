// Página do Cais: botões de compra, galeria de widgets e o Dock de demonstração.
(() => {
  const C = window.CAIS, WIDGETS = window.CAIS_WIDGETS, CATS = window.CAIS_CATS, ILHAS = new Set(window.CAIS_ILHAS);
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); e.innerHTML = html; return e; };
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = Object.fromEntries(WIDGETS.map(w => [w.id, w]));

  // ── compra
  $$('[data-compra]').forEach(a => {
    if (C.checkout) { a.href = C.checkout; a.rel = 'noopener'; }
    else if (a.dataset.compra === 'final') { a.setAttribute('aria-disabled', 'true'); a.removeAttribute('href'); a.textContent = 'Checkout em breve'; }
    else a.href = '#comprar';
  });
  $$('[data-preco]').forEach(e => e.textContent = C.preco);
  $$('[data-suporte]').forEach(a => a.href = C.suporte);
  fetch('versao.json', { cache: 'no-store' }).then(r => r.json()).then(v => $$('[data-versao]').forEach(e => e.textContent = 'versão ' + v.versao)).catch(() => {});

  // ── nomes e medidas
  const larg = (u, h) => Math.round((u * 61 - 9) * h / 52);          // proporção real: 52 pt de altura, 61 pt por unidade
  const nome = (w, look) => { const l = w.l.find(x => x[0] === look); return look === 'default' || !l ? w.n : `${w.n} · ${l[1]}`; };
  const partes = id => { const p = id.split('_'); return { kind: p[0], look: p[1], u: +p[2] }; };

  // ── galeria
  const gal = $('#galeria'), cats = $('#cats'), aviso = $('#aviso');
  let cat = 'all', tam = 0;                                           // tam 0 = tamanho padrão de cada widget
  const total = WIDGETS.reduce((n, w) => n + w.l.length, 0);
  const botCat = (id, rotulo, n) => { const b = el('button', { type: 'button', 'aria-pressed': id === cat }, `${rotulo}<span>${n}</span>`); b.onclick = () => { cat = id; pinta(); }; return b; };
  function pinta() {
    cats.replaceChildren(botCat('all', 'Todos', total), ...CATS.map(([id, n]) => botCat(id, n, WIDGETS.filter(w => w.c === id).reduce((s, w) => s + w.l.length, 0))));
    gal.replaceChildren(...CATS.filter(([id]) => cat === 'all' || cat === id).map(([id, n]) => {
      const g = el('div', { class: 'grupo' }, cat === 'all' ? `<h3>${n}</h3>` : ''), f = el('div', { class: 'fluxo' });
      WIDGETS.filter(w => w.c === id).forEach(w => w.l.forEach(([look]) => {
        const u = tam && w.s.includes(tam) ? tam : tam ? w.s.reduce((a, b) => Math.abs(b - tam) < Math.abs(a - tam) ? b : a) : w.u;
        const tid = `${w.id}_${look}_${u}`, h = innerWidth <= 640 ? 52 : 64;
        const b = el('button', { type: 'button', class: 'w', title: 'Pôr no Dock' }, `<img src="img/tiles/${tid}.webp" alt="" loading="lazy" width="${larg(u, h)}" height="${h}"><span>${nome(w, look)}</span>`);
        b.onclick = () => adiciona(tid);
        f.append(b);
      }));
      g.append(f); return g;
    }));
  }
  $$('#tam button').forEach(b => b.onclick = () => { tam = +b.dataset.t; $$('#tam button').forEach(x => x.setAttribute('aria-pressed', x === b)); pinta(); });

  // ── o Dock
  const WS = [
    ['Principal', ['app:finder', 'app:safari', 'app:spotify', '|', 'system_pulse_2', 'music_default_3', 'clock_default_2', 'timer_default_2', 'claude_default_2']],
    ['Trabalho', ['app:mail', 'app:calendar', 'app:whatsapp', 'app:notes', '|', 'clock_ruler_2', 'weather_default_3', 'claude_default_3']],
    ['Foco', ['app:obsidian', 'app:notes', 'app:spotify', '|', 'focus_ruler_2', 'timer_default_2', 'music_waves_3', 'breathe_default_2']],
    ['Código', ['app:vscode', 'app:terminal', 'app:github', 'app:postgres', '|', 'system_bars_2', 'ping_radar_2', 'claude_default_2']],
    ['Lazer', ['app:discord', 'app:spotify', 'app:music', 'app:tv', '|', 'music_vinyl_3', 'visualizer_default_2', 'football_default_2', 'f1_default_2']],
  ];
  const APPS = { finder: 'Finder', safari: 'Safari', spotify: 'Spotify', mail: 'Mail', calendar: 'Calendário', whatsapp: 'WhatsApp', notes: 'Notas', obsidian: 'Obsidian', vscode: 'VS Code', terminal: 'Terminal', github: 'GitHub Desktop', postgres: 'Postgres', discord: 'Discord', music: 'Música', tv: 'TV' };
  const dock = $('#dock'), abas = $('#abas'), barra = $('#barra'), ilha = $('#ilha'), rot = $('#rot');
  let ws = 0, postos = [], aberta = null;                             // postos = widgets que o visitante pôs pela galeria

  function monta(novo) {
    const th = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th'));
    const cabe = innerWidth - 24, vao = th * .17, borda = th * .32;
    let itens = WS[ws][1].concat(postos);
    const mede = l => borda + l.reduce((s, it) => s + (it === '|' ? 1.5 : it.startsWith('app:') ? th : larg(partes(it).u, th)) + vao, -vao);
    // Se não couber na janela, saem primeiro os apps (ficam 2), depois os widgets do workspace, depois os postos mais antigos.
    while (mede(itens) > cabe) {
      const apps = itens.filter(i => i.startsWith('app:')), base = itens.filter(i => i !== '|' && !i.startsWith('app:') && !postos.includes(i));
      const sai = apps.length > 2 ? apps[apps.length - 1] : base.length > 1 ? base[base.length - 1] : itens.filter(i => postos.includes(i))[0] || base[0];
      if (!sai) break; itens.splice(itens.lastIndexOf(sai), 1);
    }
    barra.replaceChildren(...itens.map(it => {
      if (it === '|') return el('span', { class: 'sep', 'aria-hidden': 'true' });
      if (it.startsWith('app:')) { const a = it.slice(4); const b = el('button', { type: 'button', class: 'dk app', 'aria-label': APPS[a] || a, 'data-rot': APPS[a] || a }, `<img src="img/icons/${a}.webp" alt="">`); return b; }
      const p = partes(it), w = byId[p.kind], n = nome(w, p.look);
      const b = el('button', { type: 'button', class: 'dk wid' + (it === novo ? ' novo' : ''), 'aria-label': n + (ILHAS.has(p.kind) ? ', abrir a ilha' : ''), 'data-rot': n, 'data-kind': p.kind }, `<img src="img/tiles/${it}.webp" alt="" width="${larg(p.u, th)}" height="${th}">`);
      return b;
    }));
  }
  function abasPinta() {
    abas.replaceChildren(...WS.map(([n], i) => { const b = el('button', { type: 'button', 'aria-pressed': i === ws }, n); b.onclick = () => troca(i); return b; }));
  }
  function troca(i) {
    if (i === ws) return; fecha(); ws = i; abasPinta();
    if (calmo) return monta();
    barra.classList.add('troca'); setTimeout(() => { monta(); barra.classList.remove('troca'); }, 160);
  }
  function adiciona(tid) {
    fecha(); postos = postos.filter(x => x !== tid).concat(tid).slice(-3); monta(tid);
    const p = partes(tid); aviso.textContent = `${nome(byId[p.kind], p.look)} foi para o Dock.`;
  }
  function fecha() { ilha.classList.remove('aberta'); aberta = null; }
  function abre(b) {
    const kind = b.dataset.kind;
    if (!kind || !ILHAS.has(kind)) return dica(b, true);
    if (aberta === b) return fecha();
    const img = $('img', ilha); aberta = b; rot.classList.remove('aberta');
    img.onload = () => {
      const r = b.getBoundingClientRect(), w = ilha.offsetWidth;
      ilha.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
      ilha.classList.add('aberta');
    };
    img.alt = 'Ilha do widget ' + b.dataset.rot; ilha.classList.remove('aberta'); img.src = `img/ilhas/${kind}.webp`;
    if (img.complete) img.onload();
  }
  function dica(b, fixa) {
    if (aberta) return;
    rot.textContent = b.dataset.rot; rot.classList.add('aberta');
    const r = b.getBoundingClientRect(); rot.style.left = Math.max(8, Math.min(innerWidth - rot.offsetWidth - 8, r.left + r.width / 2 - rot.offsetWidth / 2)) + 'px';
    if (fixa) { clearTimeout(dica.t); dica.t = setTimeout(() => rot.classList.remove('aberta'), 1400); }
  }
  barra.addEventListener('click', e => { const b = e.target.closest('.dk'); if (b) abre(b); });
  barra.addEventListener('pointerover', e => { const b = e.target.closest('.dk'); if (b && e.pointerType === 'mouse') dica(b); });
  document.addEventListener('click', e => { if (aberta && !e.target.closest('#dock') && !e.target.closest('#ilha') && !e.target.closest('.w')) fecha(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') fecha(); });
  ilha.addEventListener('click', fecha);

  // ampliação ao passar o mouse, como no Dock de verdade
  let quadro = 0;
  if (!calmo) barra.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    cancelAnimationFrame(quadro);
    quadro = requestAnimationFrame(() => $$('.dk', barra).forEach(b => {
      const r = b.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)) / Math.max(60, r.width * .7);
      const s = 1 + .2 * Math.exp(-d * d * 1.6);
      b.style.transform = s > 1.004 ? `scale(${s.toFixed(3)})` : ''; b.style.zIndex = s > 1.05 ? 2 : '';
    }));
  });
  barra.addEventListener('pointerleave', () => { cancelAnimationFrame(quadro); $$('.dk', barra).forEach(b => { b.style.transform = ''; b.style.zIndex = ''; }); rot.classList.remove('aberta'); });

  let espera; addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => { fecha(); monta(); pinta(); }, 120); });
  if (gal) pinta();
  if (dock) { abasPinta(); monta(); }
})();
