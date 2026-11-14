/* Yön 1 · Akışkan — dil, kapılar, sekmeler, kopyala, akışkan ipek (WebGL). Tüm sayfalarda ortak. */
(function () {
  'use strict';
  var root = document.documentElement;
  function $$(s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); }

  /* Doküman menüsü mobilde kapalı başlar */
  if (window.matchMedia('(max-width: 1080px)').matches) $$('.side-in[open]').forEach(function (d) { d.open = false; });

  /* ---- TR / EN ---- */
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function setLang(lang) {
    root.lang = lang;
    $$('[data-en],[data-en-html]').forEach(function (el) {
      if (el.dataset.tr === undefined) el.dataset.tr = el.innerHTML;
      if (lang === 'en') el.innerHTML = el.dataset.enHtml !== undefined ? el.dataset.enHtml : escapeHtml(el.dataset.en);
      else el.innerHTML = el.dataset.tr;
    });
    $$('[data-en-label]').forEach(function (el) {
      if (el.dataset.trLabel === undefined) el.dataset.trLabel = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', lang === 'en' ? el.dataset.enLabel : el.dataset.trLabel);
    });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    try { localStorage.setItem('kt-lang', lang); } catch (e) {}
    if (cmdEl && activeTool) cmdEl.textContent = cmds[activeTool];
  }
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });

  /* ---- Kurulum kapıları ---- */
  var doors = $$('.door');
  function openDoor(d) {
    doors.forEach(function (x) {
      var on = x === d;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
  }
  doors.forEach(function (d, i) {
    d.addEventListener('click', function () { openDoor(d); });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = doors[(i + (e.key === 'ArrowRight' ? 1 : doors.length - 1)) % doors.length]; openDoor(n); n.focus(); }
    });
  });

  /* ---- Genel sekmeler: [data-tabs=ad] > [data-tab=x]  ↔  [data-tabpanel="ad:x"] ---- */
  $$('[data-tabs]').forEach(function (list) {
    var name = list.dataset.tabs;
    var tabs = $$('[data-tab]', list);
    function sel(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute('aria-selected', String(on));
        x.tabIndex = on ? 0 : -1;
        $$('[data-tabpanel="' + name + ':' + x.dataset.tab + '"]').forEach(function (p) { p.hidden = !on; });
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(t); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; sel(n); n.focus(); e.preventDefault(); }
      });
    });
  });

  /* ---- Ana sayfa: araç sekmeleri kurulum satırını değiştirir ---- */
  var cmds = {
    claude: 'claude mcp add kt-mcp -e KT_ENV=sandbox -- npx -y {KT_MCP_PAKETI}',
    cursor: '# .cursor/mcp.json → "kuveytturk": npx -y {KT_MCP_PAKETI} (KT_ENV=sandbox)',
    codex: 'codex mcp add kt-mcp --env KT_ENV=sandbox -- npx -y {KT_MCP_PAKETI}',
    chatgpt: '# ChatGPT → Connectors → kt-mcp (sandbox)'
  };
  var cmdEl = document.getElementById('tool-cmd'), activeTool = cmdEl ? 'claude' : null;
  if (cmdEl) {
    $$('.tools button[data-tool]').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.tools button[data-tool]').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
        activeTool = b.dataset.tool;
        cmdEl.textContent = cmds[activeTool];
      });
    });
    cmdEl.textContent = cmds.claude;
  }

  /* ---- Kopyala: data-copy = görünür hedefin seçicisi ---- */
  $$('.copy[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = $$(b.dataset.copy).filter(function (el) { return !el.closest('[hidden]'); })[0];
      if (!t) return;
      var label = b.querySelector('.copy-label') || b;
      var done = function () { var o = label.innerHTML; label.textContent = root.lang === 'en' ? 'Copied' : 'Kopyalandı'; setTimeout(function () { label.innerHTML = o; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(t.innerText).then(done, done); else done();
    });
  });

  var q = new URLSearchParams(location.search).get('lang');
  var saved = null; try { saved = localStorage.getItem('kt-lang'); } catch (e) {}
  if ((q || saved) === 'en') setLang('en');

  /* ---- Akışkan ipek: görsel dokusu, zamanla dalgalanan UV kaydırması ---- */
  var img = document.getElementById('ipek');
  var canvas = document.getElementById('akis');
  var wrap = canvas && canvas.parentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || !img || reduce) return;
  var gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) return;

  var vs = 'attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var fs = [
    'precision highp float;',
    'uniform sampler2D tex;uniform vec2 res;uniform vec2 isz;uniform vec2 pos;uniform float t;varying vec2 uv;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int k=0;k<4;k++){v+=a*n(p);p*=2.03;a*=.5;}return v;}',
    'void main(){',
    '  float ra=res.x/res.y, ia=isz.x/isz.y;',
    '  vec2 s= ra>ia ? vec2(1.,ia/ra) : vec2(ra/ia,1.);',
    '  vec2 st=vec2(uv.x,1.-uv.y);',
    '  vec2 c=st*s+(1.-s)*pos;',
    '  float w=fbm(c*2.2+vec2(t*.035,-t*.025));',
    '  vec2 d=vec2(sin(c.y*5.5+t*.42+w*3.2),cos(c.x*4.2-t*.33+w*2.6))*.0042;',
    '  d+= (w-.5)*vec2(.006,-.004);',
    '  vec3 col=texture2D(tex,clamp(c+d,.001,.999)).rgb;',
    '  vec3 cream=vec3(.965,.945,.902);',
    '  float silk=smoothstep(.06,.22,distance(col,cream));',
    '  float band=sin((c.x*1.3+c.y)*7.-t*.55+w*4.);',
    '  col+=silk*.045*smoothstep(.55,1.,band)*vec3(1.,.95,.82);',
    '  col-=silk*.03*smoothstep(.6,1.,-band);',
    '  gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
  var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) return;
  var pr = gl.createProgram(); gl.attachShader(pr, v); gl.attachShader(pr, f); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['tex', 'res', 'isz', 'pos', 't'].forEach(function (k) { U[k] = gl.getUniformLocation(pr, k); });

  var ready = false, visible = true, t0 = performance.now();
  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(canvas.clientWidth * dpr), hh = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== hh) { canvas.width = w; canvas.height = hh; }
    gl.viewport(0, 0, w, hh);
    var cs = getComputedStyle(wrap);
    gl.uniform2f(U.res, w, hh);
    gl.uniform2f(U.pos, parseFloat(cs.getPropertyValue('--pos-x')) || .78, parseFloat(cs.getPropertyValue('--pos-y')) || .5);
  }
  function load() {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img); } catch (e) { return; }
    gl.uniform1i(U.tex, 0);
    gl.uniform2f(U.isz, img.naturalWidth, img.naturalHeight);
    size(); ready = true; frame(); wrap.classList.add('gl');
  }
  function frame() {
    if (!ready) return;
    gl.uniform1f(U.t, (performance.now() - t0) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function loop() { if (visible && !document.hidden) frame(); requestAnimationFrame(loop); }
  if (img.complete && img.naturalWidth) load(); else img.addEventListener('load', load);
  window.addEventListener('resize', function () { if (ready) { size(); frame(); } });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(canvas);
  requestAnimationFrame(loop);
})();
