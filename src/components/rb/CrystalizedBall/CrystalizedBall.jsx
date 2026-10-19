'use client';

import { useEffect, useRef } from 'react';

import './CrystalizedBall.css';

const reducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const hexToRgb = hex => {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0');
  return [0, 2, 4].map(i => parseInt(v.slice(i, i + 2), 16) / 255);
};

const VERT = `
attribute vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }
`;

/* Küre, Fibonacci dağılımlı yön kümesine göre yüzeylere bölünür (küresel Voronoi):
   her piksel en yakın yönün düz normalini alır, böylece kesme kristal görünümü çıkar.
   Işık: iki renkli ortam + keskin parıltı + kenar Fresnel + üç kanallı hafif kırılma. */
const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uTilt;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uInk;
uniform float uFacets;
uniform float uLight;
const int MAXF = 64;

mat3 rotY(float a){ float c=cos(a), s=sin(a); return mat3(c,0.,-s, 0.,1.,0., s,0.,c); }
mat3 rotX(float a){ float c=cos(a), s=sin(a); return mat3(1.,0.,0., 0.,c,s, 0.,-s,c); }

vec3 facet(vec3 n, out float edge){
  float best = -2.0; float second = -2.0; vec3 bn = n;
  for (int i = 0; i < MAXF; i++) {
    if (float(i) >= uFacets) break;
    float fi = float(i) + 0.5;
    float y = 1.0 - 2.0 * fi / uFacets;
    float r = sqrt(max(0.0, 1.0 - y*y));
    float th = 2.39996323 * float(i);
    vec3 d = vec3(cos(th)*r, y, sin(th)*r);
    float k = dot(n, d);
    if (k > best) { second = best; best = k; bn = d; }
    else if (k > second) { second = k; }
  }
  edge = best - second;
  return bn;
}

vec3 env(vec3 d){
  float t = d.y * 0.5 + 0.5;
  vec3 c = mix(uInk, uA, smoothstep(0.0, 0.9, t));
  c = mix(c, uB, smoothstep(0.55, 1.0, t) * 0.8);
  float band = smoothstep(0.92, 1.0, sin(d.x * 6.0 + d.y * 3.0 + uTime * 0.4) * 0.5 + 0.5);
  return c + band * 0.35;
}

void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / min(uRes.x, uRes.y);
  float R = 0.86;
  float d2 = dot(uv, uv);
  float a = 0.0;
  vec3 col = vec3(0.0);
  if (d2 < R*R) {
    vec3 n = normalize(vec3(uv, sqrt(R*R - d2)));
    mat3 m = rotY(uTime * 0.25 + uTilt.x) * rotX(0.35 + uTilt.y);
    vec3 nl = m * n;
    float edge;
    vec3 f = facet(nl, edge);
    vec3 fn = normalize(transpose(m) * f);
    vec3 v = vec3(0.0, 0.0, 1.0);
    vec3 refl = reflect(-v, fn);
    vec3 rr = refract(-v, fn, 0.66);
    vec3 rg = refract(-v, fn, 0.68);
    vec3 rb = refract(-v, fn, 0.70);
    vec3 inner = vec3(env(rr).r, env(rg).g, env(rb).b);
    float fres = pow(1.0 - max(dot(fn, v), 0.0), 2.4);
    col = mix(inner * 0.9, env(refl), 0.25 + fres * 0.6);
    vec3 L = normalize(vec3(-0.5, 0.7, 0.6));
    float spec = pow(max(dot(reflect(-L, fn), v), 0.0), 40.0) * uLight;
    col += spec;
    col += (1.0 - smoothstep(0.0, 0.035, edge)) * 0.22;
    col = mix(col, uA, smoothstep(R*R*0.82, R*R, d2) * 0.35);
    a = smoothstep(R*R, R*R - 0.012, d2);
  }
  // yumuşak dış hale
  float halo = exp(-max(0.0, sqrt(d2) - R) * 9.0) * 0.28 * step(R*R, d2);
  col += uA * halo;
  a = max(a, halo);
  gl_FragColor = vec4(col * a, a);
}
`;

const compile = (gl, type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('CrystalizedBall shader:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
};

export default function CrystalizedBall({
  color = '#b6e04a',
  secondaryColor = '#fffdf8',
  inkColor = '#101317',
  facets = 42,
  speed = 1,
  light = 1,
  interactive = true,
  maxDevicePixelRatio = 2,
  className = '',
  style
}) {
  const ref = useRef(null);
  const propsRef = useRef(null);
  propsRef.current = { color, secondaryColor, inkColor, facets, speed, light, interactive };

  useEffect(() => {
    const host = ref.current;
    if (!host) return undefined;
    const canvas = document.createElement('canvas');
    host.appendChild(canvas);
    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
    if (!gl || !gl.getExtension) {
      host.classList.add('crystal-ball--fallback');
      return () => canvas.remove();
    }
    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    // WebGL1'de transpose yok; kendi yardımcımızı ekleriz.
    const fs = compile(
      gl,
      gl.FRAGMENT_SHADER,
      FRAG.replace(
        'mat3 rotY',
        'mat3 transpose(mat3 m){ return mat3(m[0][0],m[1][0],m[2][0], m[0][1],m[1][1],m[2][1], m[0][2],m[1][2],m[2][2]); }\nmat3 rotY'
      )
    );
    if (!vs || !fs) {
      host.classList.add('crystal-ball--fallback');
      return () => canvas.remove();
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = name => gl.getUniformLocation(prog, name);
    const u = {
      res: U('uRes'), time: U('uTime'), tilt: U('uTilt'), a: U('uA'), b: U('uB'), ink: U('uInk'), facets: U('uFacets'), light: U('uLight')
    };
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const still = reducedMotion();
    let raf = 0;
    let visible = true;
    let t = 0;
    let last = 0;
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
      const r = host.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const draw = () => {
      const p = propsRef.current;
      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.time, t);
      gl.uniform2f(u.tilt, tilt.x, tilt.y);
      gl.uniform3fv(u.a, hexToRgb(p.color));
      gl.uniform3fv(u.b, hexToRgb(p.secondaryColor));
      gl.uniform3fv(u.ink, hexToRgb(p.inkColor));
      gl.uniform1f(u.facets, Math.max(6, Math.min(64, p.facets)));
      gl.uniform1f(u.light, p.light);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = now => {
      raf = 0;
      if (!visible) return;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      t += dt * propsRef.current.speed;
      tilt.x += (tilt.tx - tilt.x) * 0.06;
      tilt.y += (tilt.ty - tilt.y) * 0.06;
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (still) {
        draw();
        return;
      }
      if (!raf && visible) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    resize();
    start();
    const ro = new ResizeObserver(() => {
      resize();
      if (still) draw();
    });
    ro.observe(host);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    io.observe(host);

    const onMove = ev => {
      if (!propsRef.current.interactive) return;
      const r = host.getBoundingClientRect();
      tilt.tx = ((ev.clientX - r.left) / r.width - 0.5) * 1.6;
      tilt.ty = ((ev.clientY - r.top) / r.height - 0.5) * 1.2;
    };
    const onLeave = () => {
      tilt.tx = 0;
      tilt.ty = 0;
    };
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, [maxDevicePixelRatio]);

  return (
    <div
      ref={ref}
      className={`crystal-ball${className ? ` ${className}` : ''}`}
      style={{ '--cb-color': color, '--cb-ink': inkColor, ...style }}
      aria-hidden="true"
    />
  );
}
