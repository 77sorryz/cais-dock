// Página do Cais: a cena, o Dock de vidro, os capítulos que trocam com a rolagem, a biblioteca e a compra.
(() => {
  const raiz = document.documentElement; raiz.classList.add('js');
  const C = window.CAIS, WIDGETS = window.CAIS_WIDGETS, CATS = window.CAIS_CATS, ILHAS = new Set(window.CAIS_ILHAS);
  const q = (s, r = document) => r.querySelector(s), qa = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); for (const k in attrs) e.setAttribute(k, attrs[k]); e.innerHTML = html; return e; };
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = Object.fromEntries(WIDGETS.map(w => [w.id, w]));
  const TH = () => parseFloat(getComputedStyle(raiz).getPropertyValue('--th'));

  // ── compra
  qa('[data-compra]').forEach(a => {
    if (C.checkout) { a.href = C.checkout; a.rel = 'noopener'; }
    else if (a.dataset.compra === 'final') { a.setAttribute('aria-disabled', 'true'); a.removeAttribute('href'); a.textContent = 'Checkout em breve'; }
    else a.href = '#comprar';
  });
  qa('[data-preco]').forEach(e => e.textContent = C.preco);
  qa('[data-suporte]').forEach(a => a.href = C.suporte);
  fetch('versao.json', { cache: 'no-store' }).then(r => r.json()).then(v => qa('[data-versao]').forEach(e => e.textContent = v.versao)).catch(() => {});

  // ── nomes e medidas (proporção real: 52 pt de altura, 61 pt por unidade)
  const larg = (u, h) => Math.round((u * 61 - 9) * h / 52);
  const nome = (w, look) => { const l = w.l.find(x => x[0] === look); return look === 'default' || !l ? w.n : `${w.n} · ${l[1]}`; };
  const partes = id => { const p = id.split('_'); return { kind: p[0], look: p[1], u: +p[2] }; };
  const APPS = { finder: 'Finder', safari: 'Safari', spotify: 'Spotify', mail: 'Mail', calendar: 'Calendário', whatsapp: 'WhatsApp', notes: 'Notas', obsidian: 'Obsidian', vscode: 'VS Code', terminal: 'Terminal', github: 'GitHub Desktop', postgres: 'Postgres', discord: 'Discord', music: 'Música', tv: 'TV' };
  const pilulas = (onde, nomes, aoEscolher) => { onde.replaceChildren(...nomes.map((n, i) => { const b = el('button', { type: 'button', 'aria-pressed': 'false' }, n); b.onclick = () => aoEscolher(i); return b; }));
    return i => qa('button', onde).forEach((b, k) => b.setAttribute('aria-pressed', k === i)); };
  // roda fn em ciclo; quando a pessoa escolhe, o ciclo para de vez
  function Ciclo(n, ms, fn) { let i = 0, t = 0, livre = !calmo;
    return { anda() { clearInterval(t); if (livre) t = setInterval(() => fn(i = (i + 1) % n), ms); }, para() { clearInterval(t); }, escolhe(k) { livre = false; clearInterval(t); fn(i = k); }, get i() { return i; } }; }

  // ── a cena e a jornada
  const cena = q('#cena');
  if (cena) {
    const mar = Mar(q('#ceu'), { clima: 'por', hor: .2, nascer: true, vidro: '[data-vidro]' });
    if (mar.ok) raiz.classList.add('gl');
    const jornada = q('#jornada'), marcos = qa('.marco', jornada), caps = qa('.cap', cena);
    const barra = q('#barra'), ilha = q('#ilha'), rot = q('#rot'), real = q('#real');
    const PRINCIPAL = ['app:finder', 'app:safari', 'app:spotify', '|', 'system_pulse_2', 'music_default_3', 'clock_default_2', 'timer_default_2', 'claude_default_2'];
    const WS = [
      ['Trabalho', 'manha', ['app:mail', 'app:calendar', 'app:whatsapp', 'app:notes', '|', 'clock_ruler_2', 'weather_default_3', 'claude_default_3']],
      ['Foco', 'noite', ['app:obsidian', 'app:notes', 'app:spotify', '|', 'focus_ruler_2', 'timer_default_2', 'music_waves_3', 'breathe_default_2']],
      ['Código', 'neon', ['app:vscode', 'app:terminal', 'app:github', 'app:postgres', '|', 'system_bars_2', 'ping_radar_2', 'claude_default_2']],
      ['Lazer', 'por', ['app:discord', 'app:spotify', 'app:music', 'app:tv', '|', 'music_vinyl_3', 'visualizer_default_2', 'football_default_2', 'f1_default_2']],
    ];
    const SEQ = [['music', 'Música'], ['clock', 'Relógio'], ['timer', 'Timer'], ['system', 'Sistema'], ['claude', 'Uso do Claude']];
    const TEMAS = [['sunset', 'Pôr do sol', 'por'], ['midnight', 'Meia-noite', 'noite'], ['skyline', 'Cidade à noite', 'cidade'], ['neon', 'Chuva neon', 'neon'],
                   ['snow', 'Neve', 'neve'], ['glass', 'Vidro', 'dia'], ['frosted', 'Fosco', 'manha'], ['clear', 'Vidro claro', 'dia']];
    const CLIMA = ['por', 'crepusculo', 'noite'];
    let cap = 0, ws = 0, tema = 0, itens = null, aberta = null, fora = false;

    // monta os itens no Dock, tirando o que não couber na largura da janela
    function monta(lista, chega) {
      const th = TH(), vao = th * .17, borda = th * .32, cabe = innerWidth - 28;
      itens = lista; lista = lista.slice();
      const mede = l => borda + l.reduce((s, it) => s + (it === '|' ? 1.5 : it.startsWith('app:') ? th : larg(partes(it).u, th)) + vao, -vao);
      while (mede(lista) > cabe) {
        const apps = lista.filter(i => i.startsWith('app:')), wid = lista.filter(i => i !== '|' && !i.startsWith('app:'));
        const sai = apps.length > 2 ? apps[apps.length - 1] : wid.length > 1 ? wid[wid.length - 1] : null;
        if (!sai) break; lista.splice(lista.lastIndexOf(sai), 1);
      }
      barra.replaceChildren(...lista.map((it, i) => {
        if (it === '|') return el('span', { class: 'sep', 'aria-hidden': 'true' });
        const cls = chega ? ' chega' : '', st = `--i:${i}`;
        if (it.startsWith('app:')) { const a = it.slice(4); return el('button', { type: 'button', class: 'dk app' + cls, style: st, 'aria-label': APPS[a] || a, 'data-rot': APPS[a] || a }, `<img src="img/icons/${a}.webp" alt="">`); }
        const p = partes(it), n = nome(byId[p.kind], p.look);
        return el('button', { type: 'button', class: 'dk wid' + cls, style: st, 'aria-label': n, 'data-rot': n, 'data-kind': p.kind }, `<img src="img/tiles/${it}.webp" alt="" width="${larg(p.u, th)}" height="${th}">`);
      }));
    }
    function troca(lista) { if (lista === itens) return; if (calmo) return monta(lista);
      barra.classList.add('troca'); setTimeout(() => { monta(lista); requestAnimationFrame(() => requestAnimationFrame(() => barra.classList.remove('troca'))); }, 210); }
    monta(PRINCIPAL, !calmo);
    // garante o Dock inteiro mesmo se o navegador segurar a animação de entrada
    setTimeout(() => qa('.chega', barra).forEach(b => b.classList.remove('chega')), 2200);

    // ilhas
    const fecha = () => { ilha.classList.remove('aberta'); aberta = null; qa('.ativo', barra).forEach(b => b.classList.remove('ativo')); };
    function abre(b, max) {
      const kind = b.dataset.kind, img = q('img', ilha); aberta = b; rot.classList.remove('aberta');
      ilha.style.setProperty('--max', Math.round(max) + 'px');
      const assenta = () => { if (aberta !== b) return; const r = b.getBoundingClientRect(), c = cena.getBoundingClientRect(), w = ilha.offsetWidth;
        ilha.style.left = Math.max(10, Math.min(c.width - w - 10, r.left - c.left + r.width / 2 - w / 2)) + 'px'; ilha.classList.add('aberta'); };
      img.onload = assenta; img.alt = 'Ilha do widget ' + b.dataset.rot; ilha.classList.remove('aberta');
      if (img.getAttribute('src') === `img/ilhas/${kind}.webp`) requestAnimationFrame(assenta); else img.src = `img/ilhas/${kind}.webp`;
    }
    const espaco = () => innerHeight * .8 - TH() * .9 - 74;                                   // do topo até o Dock
    const sobCap = i => barra.getBoundingClientRect().top - caps[i].getBoundingClientRect().bottom - 30;   // entre o texto e o Dock
    let marcaIlha, marcaWs, marcaTema;
    const mostraIlha = k => { const b = q(`.dk[data-kind=${SEQ[k][0]}]`, barra); marcaIlha(k); qa('.dk', barra).forEach(x => x.classList.toggle('ativo', x === b));
      if (b) abre(b, Math.max(200, sobCap(2))); else ilha.classList.remove('aberta'); };
    const cIlhas = Ciclo(SEQ.length, 3300, mostraIlha);
    marcaIlha = pilulas(q('#escolhe-ilhas'), SEQ.map(s => s[1]), k => cIlhas.escolhe(k));
    const dica = (b, some) => { if (aberta) return; rot.textContent = b.dataset.rot; rot.classList.add('aberta');
      const r = b.getBoundingClientRect(), c = cena.getBoundingClientRect(); rot.style.left = Math.max(8, Math.min(c.width - rot.offsetWidth - 8, r.left - c.left + r.width / 2 - rot.offsetWidth / 2)) + 'px';
      if (some) { clearTimeout(dica.t); dica.t = setTimeout(() => rot.classList.remove('aberta'), 1400); } };
    barra.addEventListener('click', e => { const b = e.target.closest('.dk'); if (!b) return;
      if (!ILHAS.has(b.dataset.kind)) return dica(b, true);
      const k = SEQ.findIndex(s => s[0] === b.dataset.kind);
      if (cap === 2 && k >= 0) return cIlhas.escolhe(k);
      if (aberta === b) return fecha();
      abre(b, espaco()); });
    barra.addEventListener('pointerover', e => { const b = e.target.closest('.dk'); if (b && e.pointerType === 'mouse') dica(b); });
    document.addEventListener('click', e => { if (aberta && cap !== 2 && !e.target.closest('#barra')) fecha(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && cap !== 2) fecha(); });
    // ampliação ao passar o mouse, como no Dock de verdade
    let quadro = 0;
    if (!calmo) barra.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse') return; cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(() => qa('.dk', barra).forEach(b => { b.classList.remove('chega');
        const r = b.getBoundingClientRect(), d = Math.abs(e.clientX - (r.left + r.width / 2)) / Math.max(60, r.width * .7), s = 1 + .22 * Math.exp(-d * d * 1.6);
        b.style.transform = s > 1.004 ? `scale(${s.toFixed(3)})` : ''; b.style.zIndex = s > 1.05 ? 2 : ''; })); });
    barra.addEventListener('pointerleave', () => { cancelAnimationFrame(quadro); qa('.dk', barra).forEach(b => { b.style.transform = ''; b.style.zIndex = ''; }); rot.classList.remove('aberta'); });

    // workspaces
    const mostraWs = k => { ws = k; marcaWs(k); troca(WS[k][2]); if (cap === 3 && !fora) mar.clima(WS[k][1]); };
    const cWs = Ciclo(WS.length, 3600, mostraWs);
    marcaWs = pilulas(q('#abas-ws'), WS.map(w => w[0]), k => cWs.escolhe(k));
    marcaWs(0);

    // temas (capturas do Dock de verdade)
    real.replaceChildren(...TEMAS.map(([id, n]) => el('img', { src: `img/dock/${id}.webp`, alt: `Dock no tema ${n}`, loading: 'lazy', width: 2200, height: 160 })));
    const mostraTema = k => { tema = k; marcaTema(k); qa('img', real).forEach((im, i) => im.classList.toggle('on', i === k)); if (cap === 4 && !fora) mar.clima(TEMAS[k][2]); };
    const cTemas = Ciclo(TEMAS.length, 3000, mostraTema);
    marcaTema = pilulas(q('#escolhe-temas'), TEMAS.map(t => t[1]), k => cTemas.escolhe(k));
    mostraTema(0);

    // widgets passando
    const todos = WIDGETS.flatMap(w => w.l.map(([look]) => `${w.id}_${look}_${w.u}`)), hf = innerWidth <= 640 ? 50 : 64;
    q('#passa').replaceChildren(...[0, 1, 2].map(r => { const lista = todos.filter((_, i) => i % 3 === r);
      return el('div', { class: 'trilho' + (r === 1 ? ' volta' : ''), style: `--t:${[130, 160, 145][r]}s` },
        lista.concat(lista).map(t => `<img src="img/tiles/${t}.webp" alt="" width="${larg(partes(t).u, hf)}" height="${hf}">`).join('')); }));

    // capítulos
    const trilha = q('#trilha'), NOMES = ['Início', 'Widgets', 'Ilhas', 'Workspaces', 'Temas'];
    const topoDe = i => jornada.offsetTop + marcos[i].offsetTop;
    trilha.replaceChildren(...NOMES.map((n, i) => { const b = el('button', { type: 'button', 'aria-label': n, title: n, 'aria-current': i === 0 }); b.onclick = () => scrollTo({ top: topoDe(i) }); return b; }));
    const climaDoCap = () => cap === 3 ? WS[ws][1] : cap === 4 ? TEMAS[tema][2] : CLIMA[cap];
    function vaiCap(i) {
      if (i === cap) return; cap = i; cena.dataset.cap = i;
      caps.forEach(c => c.classList.toggle('on', +c.dataset.i === i));
      qa('button', trilha).forEach((b, k) => b.setAttribute('aria-current', k === i));
      fecha(); cIlhas.para(); cWs.para(); cTemas.para();
      barra.classList.toggle('fora', i === 4);
      troca(i === 3 ? WS[ws][2] : PRINCIPAL);
      if (i === 2) setTimeout(() => { if (cap === 2) { mostraIlha(cIlhas.i); cIlhas.anda(); } }, 700);
      if (i === 3) cWs.anda();
      if (i === 4) cTemas.anda();
      mar.clima(climaDoCap());
    }
    const secoes = qa('section[data-clima]');
    let pedido = 0;
    function rola() {
      pedido = 0;
      const y = scrollY - jornada.offsetTop, fim = jornada.offsetTop + jornada.offsetHeight - innerHeight;
      if (scrollY > fim + innerHeight * .45) {           // já saiu da jornada: o céu segue a seção que está no meio da tela
        const meio = innerHeight / 2, s = secoes.find(x => { const r = x.getBoundingClientRect(); return r.top <= meio && r.bottom >= meio; }) || secoes[secoes.length - 1];
        fora = true; cIlhas.para(); cWs.para(); cTemas.para(); mar.clima(s.dataset.clima); return;
      }
      let melhor = 0, dist = Infinity;
      marcos.forEach((m, i) => { const d = Math.abs(m.offsetTop - y); if (d < dist) { dist = d; melhor = i; } });
      if (fora) { fora = false; mar.clima(climaDoCap()); if (cap === 3) cWs.anda(); if (cap === 4) cTemas.anda(); if (cap === 2) cIlhas.anda(); }
      vaiCap(melhor);
    }
    addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(rola); }, { passive: true });
    let espera; addEventListener('resize', () => { clearTimeout(espera); espera = setTimeout(() => { fecha(); monta(itens); rola(); }, 140); });
    rola();
  }

  // ── biblioteca
  const gal = q('#galeria');
  if (gal) {
    const cats = q('#cats'), titulo = q('#bib-nome'); let cat = 'all', tam = 0;
    const conta = id => WIDGETS.filter(w => id === 'all' || w.c === id).reduce((s, w) => s + w.l.length, 0);
    const botCat = (id, rotulo) => { const b = el('button', { type: 'button', 'aria-pressed': id === cat }, `${rotulo}<span>${conta(id)}</span>`); b.onclick = () => { cat = id; pinta(); gal.scrollTop = 0; }; return b; };
    function pinta() {
      cats.replaceChildren(botCat('all', 'Todos'), ...CATS.map(([id, n]) => botCat(id, n)));
      titulo.innerHTML = `${cat === 'all' ? 'Todos os widgets' : CATS.find(c => c[0] === cat)[1]}<span>${conta(cat)}</span>`;
      const hh = innerWidth <= 640 ? 50 : 60;
      gal.replaceChildren(...CATS.filter(([id]) => cat === 'all' || cat === id).map(([id, n]) => {
        const g = el('div', { class: 'grupo' }, cat === 'all' ? `<h3>${n}</h3>` : ''), f = el('div', { class: 'fluxo' });
        WIDGETS.filter(w => w.c === id).forEach(w => w.l.forEach(([look]) => {
          const u = tam && w.s.includes(tam) ? tam : tam ? w.s.reduce((a, b) => Math.abs(b - tam) < Math.abs(a - tam) ? b : a) : w.u;
          f.append(el('figure', { class: 'w' }, `<img src="img/tiles/${w.id}_${look}_${u}.webp" alt="" loading="lazy" width="${larg(u, hh)}" height="${hh}"><figcaption>${nome(w, look)}</figcaption>`));
        }));
        g.append(f); return g;
      }));
    }
    qa('#tam button').forEach(b => b.onclick = () => { tam = +b.dataset.t; qa('#tam button').forEach(x => x.setAttribute('aria-pressed', x === b)); pinta(); });
    pinta();
  }

  // ── filme
  const filme = q('#filme');
  if (filme) { const v = q('video', filme);
    q('#ver-filme').onclick = () => { filme.showModal(); v.play().catch(() => {}); };
    filme.addEventListener('close', () => v.pause());
    filme.addEventListener('click', e => { if (e.target === filme) filme.close(); }); }

  // ── entrada ao rolar
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  qa('.sobe').forEach(e => io.observe(e));
})();
