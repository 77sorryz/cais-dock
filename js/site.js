// Página do Cais: cenas, Docks de demonstração, widgets e compra.
(() => {
  document.documentElement.classList.add('js');
  const C = window.CAIS, WIDGETS = window.CAIS_WIDGETS, CATS = window.CAIS_CATS, ILHAS = new Set(window.CAIS_ILHAS);
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); e.innerHTML = html; return e; };
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = Object.fromEntries(WIDGETS.map(w => [w.id, w]));
  const TH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--th'));

  // ── compra
  $$('[data-compra]').forEach(a => {
    if (C.checkout) { a.href = C.checkout; a.rel = 'noopener'; }
    else if (a.dataset.compra === 'final') { a.setAttribute('aria-disabled', 'true'); a.removeAttribute('href'); a.textContent = 'Checkout em breve'; }
    else a.href = '#comprar';
  });
  $$('[data-preco]').forEach(e => e.textContent = C.preco);
  $$('[data-suporte]').forEach(a => a.href = C.suporte);
  fetch('versao.json', { cache: 'no-store' }).then(r => r.json()).then(v => $$('[data-versao]').forEach(e => e.textContent = v.versao)).catch(() => {});

  // ── nomes e medidas (proporção real: 52 pt de altura, 61 pt por unidade)
  const larg = (u, h) => Math.round((u * 61 - 9) * h / 52);
  const nome = (w, look) => { const l = w.l.find(x => x[0] === look); return look === 'default' || !l ? w.n : `${w.n} · ${l[1]}`; };
  const partes = id => { const p = id.split('_'); return { kind: p[0], look: p[1], u: +p[2] }; };
  const APPS = { finder: 'Finder', safari: 'Safari', spotify: 'Spotify', mail: 'Mail', calendar: 'Calendário', whatsapp: 'WhatsApp', notes: 'Notas', obsidian: 'Obsidian', vscode: 'VS Code', terminal: 'Terminal', github: 'GitHub Desktop', postgres: 'Postgres', discord: 'Discord', music: 'Música', tv: 'TV' };

  // ── um Dock: monta os itens numa .barra, tirando o que não couber na largura
  function monta(barra, itens, o = {}) {
    const th = TH(), vao = th * .17, borda = th * .32, cabe = (o.cabe || barra.parentElement.clientWidth) - 24;
    itens = itens.slice();
    const mede = l => borda + l.reduce((s, it) => s + (it === '|' ? 1.5 : it.startsWith('app:') ? th : larg(partes(it).u, th)) + vao, -vao);
    while (mede(itens) > cabe) {
      const apps = itens.filter(i => i.startsWith('app:')), wid = itens.filter(i => i !== '|' && !i.startsWith('app:'));
      const sai = apps.length > 2 ? apps[apps.length - 1] : wid.length > 1 ? wid[wid.length - 1] : null;
      if (!sai) break; itens.splice(itens.lastIndexOf(sai), 1);
    }
    barra.replaceChildren(...itens.map((it, i) => {
      if (it === '|') return el('span', { class: 'sep', 'aria-hidden': 'true' });
      const chega = o.chega ? ' chega' : '', st = `--i:${i}`;
      if (it.startsWith('app:')) { const a = it.slice(4); return el(o.vivo ? 'button' : 'span', { class: 'dk app' + chega, style: st, 'aria-label': APPS[a] || a, 'data-rot': APPS[a] || a }, `<img src="img/icons/${a}.webp" alt="">`); }
      const p = partes(it), n = nome(byId[p.kind], p.look);
      return el(o.vivo ? 'button' : 'span', { class: 'dk wid' + chega, style: st, 'aria-label': n, 'data-rot': n, 'data-kind': p.kind }, `<img src="img/tiles/${it}.webp" alt="" width="${larg(p.u, th)}" height="${th}">`);
    }));
    if (o.vivo) $$('button', barra).forEach(b => b.type = 'button');
  }
  // põe uma ilha (imagem) acima de um item do Dock, dentro da caixa que contém os dois
  function poe(ilha, item, caixa, kind, rotulo) {
    const img = $('img', ilha);
    const assenta = () => { const r = item.getBoundingClientRect(), c = caixa.getBoundingClientRect(), w = ilha.offsetWidth;
      ilha.style.left = Math.max(10, Math.min(c.width - w - 10, r.left - c.left + r.width / 2 - w / 2)) + 'px'; ilha.classList.add('aberta'); };
    img.onload = assenta; img.alt = 'Ilha do widget ' + rotulo; ilha.classList.remove('aberta');
    if (img.src.endsWith(`/${kind}.webp`)) assenta(); else img.src = `img/ilhas/${kind}.webp`;
  }
  const PRINCIPAL = ['app:finder', 'app:safari', 'app:spotify', '|', 'system_pulse_2', 'music_default_3', 'clock_default_2', 'timer_default_2', 'claude_default_2'];

  // ── capa
  const capa = $('#capa');
  if (capa) {
    Mar($('canvas', capa), { clima: 'por', hor: .24, nascer: true });
    const barra = $('#barra0'), ilha = $('#ilha0'), rot = $('#rot0'); let aberta = null;
    const faz = chega => monta(barra, PRINCIPAL, { vivo: true, chega, cabe: innerWidth });
    faz(!calmo);
    // garante o Dock inteiro mesmo se o navegador segurar a animação de entrada
    setTimeout(() => barra.querySelectorAll('.chega').forEach(b => b.classList.remove('chega')), 1600);
    const fecha = () => { ilha.classList.remove('aberta'); aberta = null; };
    const dica = (b, some) => { if (aberta) return; rot.textContent = b.dataset.rot; rot.classList.add('aberta');
      const r = b.getBoundingClientRect(), c = capa.getBoundingClientRect(); rot.style.left = Math.max(8, Math.min(c.width - rot.offsetWidth - 8, r.left - c.left + r.width / 2 - rot.offsetWidth / 2)) + 'px';
      if (some) { clearTimeout(dica.t); dica.t = setTimeout(() => rot.classList.remove('aberta'), 1400); } };
    barra.addEventListener('click', e => { const b = e.target.closest('.dk'); if (!b) return;
      if (!ILHAS.has(b.dataset.kind)) return dica(b, true);
      if (aberta === b) return fecha();
      aberta = b; rot.classList.remove('aberta'); poe(ilha, b, capa, b.dataset.kind, b.dataset.rot); });
    barra.addEventListener('pointerover', e => { const b = e.target.closest('.dk'); if (b && e.pointerType === 'mouse') dica(b); });
    document.addEventListener('click', e => { if (aberta && !e.target.closest('#barra0')) fecha(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') fecha(); });
    // ampliação ao passar o mouse, como no Dock de verdade
    let quadro = 0;
    if (!calmo) barra.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => $$('.dk', barra).forEach(b => { b.classList.remove('chega');
        const r = b.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)) / Math.max(60, r.width * .7), s = 1 + .22 * Math.exp(-d * d * 1.6);
        b.style.transform = s > 1.004 ? `scale(${s.toFixed(3)})` : ''; b.style.zIndex = s > 1.05 ? 2 : ''; })); });
    barra.addEventListener('pointerleave', () => { cancelAnimationFrame(quadro); $$('.dk', barra).forEach(b => { b.style.transform = ''; b.style.zIndex = ''; }); rot.classList.remove('aberta'); });
    addEventListener('resize', () => { fecha(); faz(false); });
  }

  // roda fn(i) em ciclo enquanto a caixa estiver na tela; para de vez quando a pessoa escolhe
  function ciclo(caixa, n, ms, fn) {
    let i = 0, timer = 0, livre = !calmo, vendo = false;
    const liga = () => { clearInterval(timer); if (livre && vendo) timer = setInterval(() => fn(i = (i + 1) % n), ms); };
    new IntersectionObserver(es => { vendo = es[0].isIntersecting; liga(); }, { threshold: .35 }).observe(caixa);
    return { escolhe(k) { livre = false; clearInterval(timer); fn(i = k); } };
  }
  const pilulas = (onde, nomes, aoEscolher) => { onde.replaceChildren(...nomes.map((n, i) => { const b = el('button', { type: 'button', 'aria-pressed': 'false' }, n); b.onclick = () => aoEscolher(i); return b; }));
    return i => $$('button', onde).forEach((b, k) => b.setAttribute('aria-pressed', k === i)); };

  // ── widgets: fileiras que passam + galeria completa
  const passa = $('#passa');
  if (passa) {
    const todos = WIDGETS.flatMap(w => w.l.map(([look]) => `${w.id}_${look}_${w.u}`));
    const h = () => innerWidth <= 640 ? 56 : 72;
    passa.replaceChildren(...[0, 1, 2].map(r => { const lista = todos.filter((_, i) => i % 3 === r);
      return el('div', { class: 'trilho' + (r === 1 ? ' volta' : ''), style: `--t:${[120, 150, 135][r]}s` },
        lista.concat(lista).map(t => `<img src="img/tiles/${t}.webp" alt="" width="${larg(partes(t).u, h())}" height="${h()}">`).join('')); }));
    const gal = $('#galeria'), cats = $('#cats'); let cat = 'all', tam = 0;
    const total = todos.length;
    const botCat = (id, rotulo, n) => { const b = el('button', { type: 'button', 'aria-pressed': id === cat }, `${rotulo}<span>${n}</span>`); b.onclick = () => { cat = id; pinta(); }; return b; };
    function pinta() {
      cats.replaceChildren(botCat('all', 'Todos', total), ...CATS.map(([id, n]) => botCat(id, n, WIDGETS.filter(w => w.c === id).reduce((s, w) => s + w.l.length, 0))));
      gal.replaceChildren(...CATS.filter(([id]) => cat === 'all' || cat === id).map(([id, n]) => {
        const g = el('div', { class: 'grupo' }, cat === 'all' ? `<h3>${n}</h3>` : ''), f = el('div', { class: 'fluxo' });
        WIDGETS.filter(w => w.c === id).forEach(w => w.l.forEach(([look]) => {
          const u = tam && w.s.includes(tam) ? tam : tam ? w.s.reduce((a, b) => Math.abs(b - tam) < Math.abs(a - tam) ? b : a) : w.u, hh = innerWidth <= 640 ? 50 : 60;
          f.append(el('figure', { class: 'w' }, `<img src="img/tiles/${w.id}_${look}_${u}.webp" alt="" loading="lazy" width="${larg(u, hh)}" height="${hh}"><figcaption>${nome(w, look)}</figcaption>`));
        }));
        g.append(f); return g;
      }));
    }
    $$('#tam button').forEach(b => b.onclick = () => { tam = +b.dataset.t; $$('#tam button').forEach(x => x.setAttribute('aria-pressed', x === b)); pinta(); });
    const abre = $('#abre-todos'), caixa = $('#todos');
    abre.onclick = () => { const ab = caixa.hidden; if (ab) pinta(); caixa.hidden = !ab; abre.setAttribute('aria-expanded', ab); abre.textContent = ab ? 'Recolher' : 'Ver todos os widgets'; };
  }

  // ── ilhas
  const pIlhas = $('#palco-ilhas');
  if (pIlhas) {
    Mar($('canvas', pIlhas), { clima: 'noite', hor: .2, sunX: .28 });
    const barra = $('#barra1'), ilha = $('#ilha1');
    const SEQ = [['system', 'Sistema'], ['music', 'Música'], ['clock', 'Relógio'], ['timer', 'Timer'], ['claude', 'Uso do Claude']];
    const faz = () => monta(barra, PRINCIPAL);
    faz();
    let marca;
    const mostra = i => { const b = $(`.dk[data-kind=${SEQ[i][0]}]`, barra); marca(i); $$('.dk', barra).forEach(x => x.classList.toggle('ativo', x === b));
      if (b) poe(ilha, b, pIlhas, SEQ[i][0], SEQ[i][1]); else ilha.classList.remove('aberta'); };
    const c = ciclo(pIlhas, SEQ.length, 3400, mostra);
    marca = pilulas($('#escolhe-ilhas'), SEQ.map(s => s[1]), i => c.escolhe(i));
    mostra(0);
    addEventListener('resize', () => { faz(); mostra(0); });
  }

  // ── workspaces
  const pWs = $('#palco-ws');
  if (pWs) {
    const WS = [
      ['Trabalho', 'manha', ['app:mail', 'app:calendar', 'app:whatsapp', 'app:notes', '|', 'clock_ruler_2', 'weather_default_3', 'claude_default_3']],
      ['Foco', 'noite', ['app:obsidian', 'app:notes', 'app:spotify', '|', 'focus_ruler_2', 'timer_default_2', 'music_waves_3', 'breathe_default_2']],
      ['Código', 'neon', ['app:vscode', 'app:terminal', 'app:github', 'app:postgres', '|', 'system_bars_2', 'ping_radar_2', 'claude_default_2']],
      ['Lazer', 'por', ['app:discord', 'app:spotify', 'app:music', 'app:tv', '|', 'music_vinyl_3', 'visualizer_default_2', 'football_default_2', 'f1_default_2']],
    ];
    const mar = Mar($('canvas', pWs), { clima: WS[0][1], hor: .2, sunX: -.26 }), barra = $('#barra2');
    let atual = -1, marca;
    const mostra = i => { if (i === atual) return; atual = i; marca(i); mar.clima(WS[i][1]);
      if (calmo || !barra.children.length) return monta(barra, WS[i][2]);
      barra.classList.add('troca'); setTimeout(() => { monta(barra, WS[i][2]); barra.classList.remove('troca'); }, 180); };
    const c = ciclo(pWs, WS.length, 3800, mostra);
    marca = pilulas($('#abas-ws'), WS.map(w => w[0]), i => c.escolhe(i));
    mostra(0);
    addEventListener('resize', () => monta(barra, WS[atual][2]));
  }

  // ── temas (capturas do Dock de verdade)
  const pTemas = $('#palco-temas');
  if (pTemas) {
    const T = [['sunset', 'Pôr do sol', 'por'], ['midnight', 'Meia-noite', 'noite'], ['skyline', 'Cidade à noite', 'cidade'], ['neon', 'Chuva neon', 'neon'],
               ['snow', 'Neve', 'neve'], ['glass', 'Vidro', 'dia'], ['frosted', 'Fosco', 'manha'], ['clear', 'Vidro claro', 'dia']];
    const mar = Mar($('canvas', pTemas), { clima: 'por', hor: .2 }), real = $('#real'), nomeT = $('#nome-tema');
    real.replaceChildren(...T.map(([id, n]) => el('img', { src: `img/dock/${id}.webp`, alt: `Dock no tema ${n}`, loading: 'lazy', width: 2200, height: 160 })));
    let marca;
    const mostra = i => { marca(i); mar.clima(T[i][2]); nomeT.textContent = T[i][1]; $$('img', real).forEach((im, k) => im.classList.toggle('on', k === i)); };
    const c = ciclo(pTemas, T.length, 3200, mostra);
    marca = pilulas($('#escolhe-temas'), T.map(t => t[1]), i => c.escolhe(i));
    mostra(0);
  }

  // ── preço
  const pPreco = $('#comprar canvas'); if (pPreco) Mar(pPreco, { clima: 'por', hor: .3 });

  // ── filme
  const filme = $('#filme');
  if (filme) { const v = $('video', filme);
    $('#ver-filme').onclick = () => { filme.showModal(); v.play().catch(() => {}); };
    filme.addEventListener('close', () => v.pause());
    filme.addEventListener('click', e => { if (e.target === filme) filme.close(); }); }

  // ── entrada ao rolar
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.sobe').forEach(e => io.observe(e));
})();
