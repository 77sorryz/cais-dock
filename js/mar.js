// A arte do Cais: céu, sol e mar desenhados ao vivo (WebGL), no mundo do ícone do app.
// Cada "clima" é um conjunto de cores; trocar de clima faz a cena derreter de um para o outro.
(() => {
  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  const C = (top, mid, hor, sun, sea, deep, glit, o = {}) => ({
    top: hex(top), mid: hex(mid), hor: hex(hor), sun: hex(sun), sea: hex(sea), deep: hex(deep), glit: hex(glit),
    sunY: -.012, sunR: .085, glow: 1, stars: .12, snow: 0, city: 0, ...o });
  const CLIMAS = {
    por:    C('#1f2260', '#5b3f97', '#e8839a', '#ffe3ad', '#2a2c78', '#0e1038', '#ffd9a0', { stars: .28 }),
    noite:  C('#04060f', '#0a1126', '#1b2b4a', '#e4ecff', '#0a1122', '#03050b', '#cfe0ff', { sunY: .34, sunR: .034, glow: .5, stars: 1 }),
    dia:    C('#3f8fe0', '#8cc6f4', '#ffe7c9', '#fffbea', '#3c86cf', '#174a8c', '#ffffff', { sunY: .44, sunR: .045, glow: .62, stars: 0 }),
    neon:   C('#07061c', '#2b0f63', '#ff3f9e', '#ff7ad9', '#150a44', '#04030f', '#49f2ff', { sunY: .02, sunR: .12, glow: 1.1, stars: .35 }),
    neve:   C('#6f8fbd', '#aebfdd', '#eef3fb', '#ffffff', '#7c97c0', '#34507f', '#ffffff', { sunY: .3, sunR: .035, glow: .36, stars: 0, snow: 1 }),
    cidade: C('#090c26', '#1a2150', '#f0a45c', '#ffcf8a', '#12173e', '#05071a', '#ffc070', { sunY: -.2, sunR: .06, glow: .75, stars: .7, city: 1 }),
    manha:  C('#2c4f9a', '#7f8fd6', '#ffc2a8', '#fff1c9', '#31549e', '#12265c', '#ffe6bd', { sunY: .1, sunR: .06, glow: 1.05, stars: 0 }),
  };
  const FRAG = `
precision highp float;
uniform vec2 R; uniform float T;
uniform vec3 cTop, cMid, cHor, cSun, cSea, cDeep, cGlit;
uniform float uSunX, uSunY, uSunR, uGlow, uStars, uSnow, uCity, uHor;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a*noise(p); p *= 2.03; a *= .5; } return s; }
void main(){
  vec2 uv = gl_FragCoord.xy / R; float asp = R.x / R.y;
  vec2 p = vec2((uv.x - .5) * asp, uv.y);
  float h = uHor; vec2 sun = vec2(uSunX * asp, h + uSunY);
  vec3 col;
  if (uv.y >= h) {
    float y = (uv.y - h) / (1. - h);
    col = mix(cHor, cMid, smoothstep(0., .42, y));
    col = mix(col, cTop, smoothstep(.28, 1., y));
    float d = length(p - sun);
    col += cSun * uGlow * (exp(-d * 6.) * .5 + exp(-d * 1.7) * .2);
    float c = fbm(vec2(p.x * 1.5 + T * .01, y * 8. - T * .003));
    c = smoothstep(.5, .82, c) * (1. - y);
    col = mix(col, mix(cHor, cSun, .45), c * .32);
    vec2 sg = gl_FragCoord.xy / R.y * 70., sc = floor(sg);
    float sr = hash(sc); vec2 so = vec2(hash(sc + 1.7), hash(sc + 5.3)) - .5;
    float star = smoothstep(.2, 0., length(fract(sg) - .5 - so * .6)) * step(.94, sr);
    col += star * (.5 + .5 * sin(T * 1.3 + sr * 90.)) * uStars * smoothstep(.1, .5, y);
    col = mix(col, cSun, smoothstep(uSunR, uSunR - .004, d));
    float bx = floor(p.x * 46.), bh = (.012 + hash(vec2(bx, 3.)) * .05) * uCity, yy = uv.y - h;
    if (yy < bh) {
      col = mix(col, cDeep * .55, .92);
      vec2 w = vec2(fract(p.x * 46.) * 4., yy * 260.);
      float on = step(.62, hash(floor(w) + bx * 7.)) * step(.25, fract(w.x)) * step(.3, fract(w.y));
      col += vec3(1., .82, .42) * on * .85;
    }
  } else {
    float d = (h - uv.y) / h;
    col = mix(cSea, cDeep, smoothstep(0., 1., d));
    col = mix(col, cHor, exp(-d * 10.) * .5);
    float z = 1. / (d + .03);
    float w = noise(vec2(p.x * z * 1.3 + T * .22, z * 5.2 + T * .5)) * .6
            + noise(vec2(p.x * z * 3.4 - T * .16, z * 11. - T * .34)) * .4;
    col += (w - .5) * .07 * mix(cHor, vec3(1.), .3);
    float dx = abs(p.x - sun.x), wd = .045 + d * .34;
    float colm = exp(-dx * dx / (wd * wd));
    float lit = uGlow * smoothstep(-.3, .05, uSunY);
    col += cGlit * lit * (smoothstep(.56, .8, w) * colm * .95 + colm * exp(-d * 2.4) * .2);
    float cl = step(.5, hash(vec2(floor(p.x * 46.), 9.)));
    col += vec3(1., .78, .4) * uCity * cl * exp(-d * 7.) * smoothstep(.35, .75, w) * .5;
  }
  for (int i = 0; i < 3; i++) {
    float fi = float(i); vec2 q = gl_FragCoord.xy / R.y * (9. + fi * 7.);
    q.y += T * (.22 + .09 * fi); q.x += sin(T * .3 + q.y * .7 + fi) * .25;
    vec2 cell = floor(q), f = fract(q) - .5; float r = hash(cell + fi * 17.);
    col += smoothstep(.05 + .07 * r, 0., length(f + (r - .5) * .6)) * step(.55, r) * uSnow * .75;
  }
  col *= 1. - .22 * pow(length(uv - vec2(.5, .45)) * 1.25, 2.);
  col += (hash(gl_FragCoord.xy + fract(T) * 91.) - .5) * .032;
  gl_FragColor = vec4(col, 1.);
}`;
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mix = (a, b, k) => typeof a === 'number' ? a + (b - a) * k : a.map((v, i) => v + (b[i] - v) * k);
  const css = c => `rgb(${c.map(v => Math.round(v * 255)).join(',')})`;

  // Cria a cena num <canvas>. opts: clima inicial, hor (altura do horizonte, 0 a 1 a partir de baixo), sunX (-.5 a .5).
  window.Mar = function (canvas, opts = {}) {
    let de = { ...CLIMAS[opts.clima || 'por'] }, para = de, t0 = 0, dur = 1, agora = de;
    const hor = opts.hor ?? .3, sunX = opts.sunX ?? 0;
    const pinta = c => canvas.style.background = `linear-gradient(${css(c.top)}, ${css(c.mid)} ${(1 - hor) * 45}%, ${css(c.hor)} ${(1 - hor) * 100}%, ${css(c.sea)} ${(1 - hor) * 100}%, ${css(c.deep)})`;
    pinta(de);
    const api = { clima(nome, ms = 1100) { if (!CLIMAS[nome]) return; de = agora; para = CLIMAS[nome]; t0 = performance.now(); dur = calmo ? 1 : ms; pinta(para); pede(); } };
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return api;
    const sh = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return api;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const a = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    const U = n => gl.getUniformLocation(prog, n);
    const u = { R: U('R'), T: U('T'), cTop: U('cTop'), cMid: U('cMid'), cHor: U('cHor'), cSun: U('cSun'), cSea: U('cSea'), cDeep: U('cDeep'), cGlit: U('cGlit'),
      sunX: U('uSunX'), sunY: U('uSunY'), sunR: U('uSunR'), glow: U('uGlow'), stars: U('uStars'), snow: U('uSnow'), city: U('uCity'), hor: U('uHor') };
    let visivel = false, quadro = 0, nasce = performance.now();
    const mede = () => { const k = Math.min(devicePixelRatio || 1, 1.5) * (opts.escala || .75);
      const w = Math.max(2, Math.round(canvas.clientWidth * k)), h = Math.max(2, Math.round(canvas.clientHeight * k));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); } };
    function desenha(now) {
      quadro = 0; mede();
      const k = Math.min(1, (now - t0) / dur), e = k * k * (3 - 2 * k);
      agora = {}; for (const key in para) agora[key] = mix(de[key], para[key], e);
      // ao abrir a página o sol sobe até o lugar dele
      const sobe = opts.nascer && !calmo ? (1 - Math.min(1, (now - nasce) / 2600)) ** 3 * .14 : 0;
      gl.uniform2f(u.R, canvas.width, canvas.height); gl.uniform1f(u.T, calmo ? 12 : now / 1000);
      for (const [n, key] of [['cTop', 'top'], ['cMid', 'mid'], ['cHor', 'hor'], ['cSun', 'sun'], ['cSea', 'sea'], ['cDeep', 'deep'], ['cGlit', 'glit']]) gl.uniform3fv(u[n], agora[key]);
      gl.uniform1f(u.sunX, sunX); gl.uniform1f(u.sunY, agora.sunY - sobe); gl.uniform1f(u.sunR, agora.sunR); gl.uniform1f(u.glow, agora.glow);
      gl.uniform1f(u.stars, agora.stars); gl.uniform1f(u.snow, agora.snow); gl.uniform1f(u.city, agora.city); gl.uniform1f(u.hor, hor);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (visivel && !calmo) pede();
    }
    function pede() { if (!quadro) quadro = requestAnimationFrame(desenha); }
    new IntersectionObserver(es => { visivel = es[0].isIntersecting; if (visivel) pede(); }, { rootMargin: '80px' }).observe(canvas);
    addEventListener('resize', pede);
    pede();
    return api;
  };
  window.Mar.CLIMAS = Object.keys(CLIMAS);
})();
