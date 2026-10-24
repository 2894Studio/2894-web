"use client";

import { useEffect, useRef } from "react";

// Nubes volumétricas interactivas sobre un cielo de Magritte.
// Lógica del laboratorio "Nube interactiva 2894_": raymarching de elipsoides + FBM, luz con lightMarch
// y un campo de desplazamiento (muelle + onda) que el cursor empuja. Aquí, varias nubes y fondo transparente
// para que el cielo (CSS) vaya por separado.

const VERT = `#version 300 es
void main(){
  float x = float((gl_VertexID << 1) & 2);
  float y = float(gl_VertexID & 2);
  gl_Position = vec4(x * 2.0 - 1.0, y * 2.0 - 1.0, 0.0, 1.0);
}`;

const COUNT = 7;

const FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
out vec4 outColor;

uniform vec2 uRes;
uniform float uScale;
uniform float uCamY;
uniform float uPhase;
uniform int uSteps;
uniform sampler2D uField;
uniform vec4 uFieldRect;
uniform vec4 uClouds[${COUNT}];
uniform vec3 uLit;
uniform vec3 uShade;

const vec3 LIGHT = vec3(-0.509, 0.694, 0.509);
const mat3 M = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);

float hash(vec3 p){
  p = fract(p * 0.3183099 + vec3(0.1));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x){
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                 mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                 mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p, int oct){
  float f = 0.0, a = 0.5, tot = 0.0;
  for(int i = 0; i < 4; i++){
    if(i >= oct) break;
    f += a * noise(p);
    tot += a;
    p = M * p * 2.02;
    a *= 0.5;
  }
  return f / tot;
}
float smin(float a, float b, float k){
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}
float sdEll(vec3 p, vec3 c, vec3 r){
  vec3 q = (p - c) / r;
  float k0 = length(q);
  float k1 = length(q / r);
  return k0 * (k0 - 1.0) / max(k1, 1e-4);
}
// Una nube (espacio local, ~2.5 de ancho), con base plana como las de Magritte.
float cloudSDF(vec3 p, float seed){
  float t = uPhase * 0.35 + seed * 6.0;
  float d = sdEll(p, vec3(0.0, 0.05, 0.0), vec3(1.25, 0.80, 0.95));
  d = smin(d, sdEll(p, vec3(-1.05 + 0.05 * sin(t), -0.12, 0.10), vec3(0.85, 0.55, 0.70)), 0.6);
  d = smin(d, sdEll(p, vec3(1.00 + 0.05 * cos(t * 1.2), -0.15 + 0.03 * sin(t * 0.8), -0.05), vec3(0.95, 0.60, 0.75)), 0.6);
  d = smin(d, sdEll(p, vec3(0.35, 0.62 + 0.04 * sin(t * 1.1), 0.05), vec3(0.75, 0.62, 0.70)), 0.5);
  d = smin(d, sdEll(p, vec3(-0.45, 0.50 + 0.03 * cos(t), 0.10), vec3(0.60, 0.50, 0.55)), 0.5);
  d = smin(d, sdEll(p, vec3(0.00, -0.25, 0.45), vec3(1.00, 0.50, 0.60)), 0.5);
  float base = -p.y - 0.62;
  float k = 0.35;
  float h = max(k - abs(d - base), 0.0) / k;
  return max(d, base) + h * h * k * 0.25;
}

float density(vec3 p, int oct){
  vec2 fuv = (p.xy - uFieldRect.xy) / uFieldRect.zw;
  vec2 u = textureLod(uField, fuv, 0.0).rg;
  vec3 q = p;
  q.xy -= u;
  float dens = 0.0;
  for(int i = 0; i < ${COUNT}; i++){
    vec4 c = uClouds[i];
    vec3 l = (q - c.xyz) / c.w;
    if(dot(l, l) > 6.5) continue;      // fuera de la caja de esta nube
    float d = cloudSDF(l, float(i));
    if(d > 0.5) continue;
    vec3 w = vec3(uPhase * 0.05, -uPhase * 0.02, uPhase * 0.04);
    float n = fbm(l * 1.45 + w + float(i) * 3.1, oct);
    d += (n - 0.5) * 0.95;
    dens = max(dens, clamp(-d * 2.6, 0.0, 1.0));
  }
  return dens;
}

float lightMarch(vec3 p){
  float acc = 0.0;
  acc += density(p + LIGHT * 0.14, 2) * 0.14;
  acc += density(p + LIGHT * 0.40, 2) * 0.26;
  acc += density(p + LIGHT * 0.80, 2) * 0.40;
  return exp(-acc * 5.0);
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = (frag * 2.0 - uRes) / uRes.y;
  vec3 ro = vec3(0.0, uCamY, 5.0);
  vec3 rd = normalize(vec3(uv * uScale / 5.0, -1.0));

  float t0 = 2.6, t1 = 7.6;
  float dt = (t1 - t0) / float(uSteps);
  float t = t0 + dt * hash(vec3(frag, 1.7));
  vec3 sum = vec3(0.0);
  float T = 1.0;
  for(int i = 0; i < 96; i++){
    if(i >= uSteps) break;
    vec3 p = ro + rd * t;
    float dens = density(p, 4);
    if(dens > 0.01){
      float lt = lightMarch(p);
      vec3 c = mix(uShade, uLit, mix(0.18, 1.0, lt));
      float a = 1.0 - exp(-dens * dt * 5.5);
      sum += T * a * c;
      T *= 1.0 - a;
      if(T < 0.02) break;
    }
    t += dt;
  }
  outColor = vec4(sum, 1.0 - T); // premultiplicado: el cielo va detrás, en CSS
}`;

// Nubes en el mundo: x, y, z, escala.
const CLOUDS: [number, number, number, number][] = [
  [-2.7, 1.25, -0.6, 0.55],
  [0.1, 1.55, -1.3, 0.62],
  [2.8, 1.05, -0.4, 0.5],
  [-1.5, -0.55, 0.2, 0.42],
  [1.7, -0.75, -0.7, 0.55],
  [-3.4, -1.25, -1.6, 0.5],
  [3.6, -1.45, -1.1, 0.46],
];

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

// lit/shade: color de la cara iluminada y de la sombra (por defecto, las nubes de Magritte).
export function CloudSky({ active = true, lit: litHex = "#fefefe", shade: shadeHex = "#9db4d4" }: { active?: boolean; lit?: string; shade?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: true, premultipliedAlpha: true, depth: false, stencil: false });
    if (!gl) {
      el.dataset.fallback = "1";
      return;
    }
    el.appendChild(canvas);

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      el.dataset.fallback = "1";
      canvas.remove();
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      el.dataset.fallback = "1";
      canvas.remove();
      return;
    }
    gl.useProgram(prog);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const L = {
      res: U("uRes"), scale: U("uScale"), camY: U("uCamY"), phase: U("uPhase"), steps: U("uSteps"),
      field: U("uField"), rect: U("uFieldRect"), clouds: U("uClouds"), lit: U("uLit"), shade: U("uShade"),
    };

    // Campo de desplazamiento (muelle + onda), como en el laboratorio.
    const NX = 100, NY = 64, CELL = 0.1, FX0 = -5, FY0 = -2.95, CAMY = 0.25;
    const disp = new Float32Array(NX * NY * 2);
    const vel = new Float32Array(NX * NY * 2);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, NX, NY, 0, gl.RG, gl.FLOAT, disp);

    const P = { push: 1, radius: 0.75, spring: 6 };
    const ptr = { tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0, active: false, on: false, was: false };

    const inject = (h: number) => {
      if (!ptr.on) return;
      const sigma = P.radius * 0.55, inv2 = 1 / (2 * sigma * sigma), rr = sigma * 3;
      const i0 = Math.max(0, Math.floor((ptr.x - rr - FX0) / CELL)), i1 = Math.min(NX - 1, Math.ceil((ptr.x + rr - FX0) / CELL));
      const j0 = Math.max(0, Math.floor((ptr.y - rr - FY0) / CELL)), j1 = Math.min(NY - 1, Math.ceil((ptr.y + rr - FY0) / CELL));
      const sp = Math.min(Math.hypot(ptr.vx, ptr.vy), 5);
      const radial = (P.push * 1.1 * (0.35 + 0.12 * sp)) / sigma;
      const drag = P.push * 1.6;
      for (let j = j0; j <= j1; j++) {
        const dy = FY0 + (j + 0.5) * CELL - ptr.y;
        for (let i = i0; i <= i1; i++) {
          const dx = FX0 + (i + 0.5) * CELL - ptr.x;
          const w = Math.exp(-(dx * dx + dy * dy) * inv2) * h;
          const idx = (j * NX + i) * 2;
          vel[idx] += (dx * radial + ptr.vx * drag) * w;
          vel[idx + 1] += (dy * radial + ptr.vy * drag) * w;
        }
      }
    };
    const simulate = (dt: number) => {
      const sub = 2, h = dt / sub, k = P.spring, damp = 2 * Math.sqrt(k) * 0.62, c2 = 16;
      for (let s = 0; s < sub; s++) {
        inject(h);
        for (let j = 0; j < NY; j++) {
          for (let i = 0; i < NX; i++) {
            const idx = (j * NX + i) * 2;
            for (let c = 0; c < 2; c++) {
              const n = idx + c, u0 = disp[n];
              const l = i > 0 ? disp[n - 2] : 0, r = i < NX - 1 ? disp[n + 2] : 0;
              const d = j > 0 ? disp[n - NX * 2] : 0, up = j < NY - 1 ? disp[n + NX * 2] : 0;
              vel[n] += (c2 * (l + r + d + up - 4 * u0) - k * u0 - damp * vel[n]) * h;
            }
          }
        }
        for (let n = 0; n < disp.length; n += 2) {
          disp[n] += vel[n] * h;
          disp[n + 1] += vel[n + 1] * h;
          const len = Math.hypot(disp[n], disp[n + 1]);
          if (len > 0.6) {
            const f = 0.6 / len;
            disp[n] *= f;
            disp[n + 1] *= f;
          }
        }
      }
    };

    const viewScale = (aspect: number) => Math.min(3.2, Math.max(1.85, 2.4 / aspect));
    const toWorld = (cx: number, cy: number) => {
      const r = canvas.getBoundingClientRect();
      const nx = (cx - r.left) / r.width, ny = (cy - r.top) / r.height, aspect = r.width / r.height, S = viewScale(aspect);
      return [(nx * 2 - 1) * aspect * S, CAMY + (1 - ny * 2) * S, nx, ny];
    };
    const onMove = (e: PointerEvent) => {
      const [x, y, nx, ny] = toWorld(e.clientX, e.clientY);
      ptr.active = nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1;
      ptr.tx = x;
      ptr.ty = y;
    };
    const onLeave = () => {
      ptr.active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    const updatePointer = (dt: number) => {
      const on = ptr.active && activeRef.current && !reduce;
      if (on) {
        if (!ptr.was) {
          ptr.x = ptr.tx;
          ptr.y = ptr.ty;
          ptr.vx = 0;
          ptr.vy = 0;
        }
        const k = 1 - Math.exp(-dt * 16), nx = ptr.x + (ptr.tx - ptr.x) * k, ny = ptr.y + (ptr.ty - ptr.y) * k;
        ptr.vx += ((nx - ptr.x) / dt - ptr.vx) * 0.5;
        ptr.vy += ((ny - ptr.y) / dt - ptr.vy) * 0.5;
        const sp = Math.hypot(ptr.vx, ptr.vy);
        if (sp > 5) {
          ptr.vx *= 5 / sp;
          ptr.vy *= 5 / sp;
        }
        ptr.x = nx;
        ptr.y = ny;
      } else {
        ptr.vx *= 0.8;
        ptr.vy *= 0.8;
      }
      ptr.was = on;
      ptr.on = on;
    };

    // Resolución dinámica: el raymarching es caro, se ajusta a los fps.
    const dprCap = Math.min(window.devicePixelRatio || 1, 1.5);
    let scale = 0.5;
    let W = 2, H = 2;
    const resize = () => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      W = Math.max(2, Math.round(r.width * dprCap * scale));
      H = Math.max(2, Math.round(r.height * dprCap * scale));
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let visible = false;
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(el);

    const lit = hex(litHex);
    const shade = hex(shadeHex);
    const clouds = new Float32Array(COUNT * 4);
    let last = performance.now(), phase = 0, ema = 1 / 60, frames = 0, nextAdapt = 0;
    let raf = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const raw = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!visible || document.hidden) return;
      const dt = Math.min(raw, 1 / 20);
      phase += dt * (reduce ? 0.2 : 1);
      updatePointer(dt);
      simulate(dt);
      // las nubes derivan despacio con el viento y vuelven a entrar por el otro lado
      CLOUDS.forEach(([x, y, z, s], i) => {
        let cx = x + phase * 0.03 * (1 + (i % 3) * 0.3);
        cx = ((((cx + 5) % 10) + 10) % 10) - 5;
        clouds.set([cx, y, z, s], i * 4);
      });
      gl.viewport(0, 0, W, H);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NX, NY, gl.RG, gl.FLOAT, disp);
      gl.uniform1i(L.field, 0);
      gl.uniform4f(L.rect, FX0, FY0, NX * CELL, NY * CELL);
      gl.uniform2f(L.res, W, H);
      gl.uniform1f(L.scale, viewScale(W / H));
      gl.uniform1f(L.camY, CAMY);
      gl.uniform1f(L.phase, phase);
      gl.uniform1i(L.steps, 48);
      gl.uniform4fv(L.clouds, clouds);
      gl.uniform3fv(L.lit, lit);
      gl.uniform3fv(L.shade, shade);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      frames++;
      ema += (raw - ema) * 0.05;
      if (frames > 40 && now > nextAdapt) {
        if (ema > 0.021 && scale > 0.28) {
          scale = Math.max(0.28, scale * 0.88);
          nextAdapt = now + 700;
          resize();
        } else if (ema < 0.0145 && scale < 0.7) {
          scale = Math.min(0.7, scale * 1.06);
          nextAdapt = now + 1500;
          resize();
        }
      }
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      canvas.remove();
    };
  }, [litHex, shadeHex]);

  return (
    <div ref={host} aria-hidden className="group/sky absolute inset-0">
      {/* Sin WebGL2: nubes estáticas desenfocadas */}
      <div className="absolute inset-0 hidden group-data-[fallback=1]/sky:block">
        <i className="absolute left-[8%] top-[12%] h-[22%] w-[26%] rounded-full bg-white blur-2xl" />
        <i className="absolute left-[46%] top-[6%] h-[20%] w-[22%] rounded-full bg-white blur-2xl" />
        <i className="absolute right-[6%] top-[20%] h-[18%] w-[22%] rounded-full bg-white blur-2xl" />
        <i className="absolute bottom-[18%] left-[18%] h-[16%] w-[20%] rounded-full bg-white blur-2xl" />
        <i className="absolute bottom-[12%] right-[14%] h-[18%] w-[24%] rounded-full bg-white blur-2xl" />
      </div>
    </div>
  );
}
