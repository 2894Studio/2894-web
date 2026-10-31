"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

// Busto de marca que mira a quien lo observa (adaptado de head-follow.js).
// Dos efectos combinados: parallax 2.5D con un mapa de profundidad (los píxeles del PNG se desplazan según
// su profundidad) y una inclinación 3D real del conjunto, para que gire en todas las direcciones.
// La mirada sigue al puntero o, si `target.current.active`, a la cara detectada por la cámara.

export type LookTarget = { active: boolean; x: number; y: number };

const STRENGTH = 0.1; // desplazamiento máximo del parallax, en fracción del ancho de la imagen
const PIVOT = 0.45; // profundidad que no se mueve (0 lejos, 1 cerca)
const SMOOTHING = 11; // frecuencia del muelle: más alto, más rápido
const TILT_Y = 16; // grados de giro máximo a izquierda/derecha
const TILT_X = 11; // grados de giro máximo arriba/abajo

const VERT = "attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}";
// Inversión por punto fijo del desplazamiento s + o·(h(s)−pivot) = uv.
const FRAG =
  "precision highp float;varying vec2 uv;uniform sampler2D img,dep;uniform vec2 o;uniform float pivot;" +
  "void main(){vec2 s=uv;for(int i=0;i<6;i++){s=uv-o*(texture2D(dep,s).r-pivot);}" +
  "if(s.x<0.||s.y<0.||s.x>1.||s.y>1.){gl_FragColor=vec4(0.);return;}gl_FragColor=texture2D(img,s);}";

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = src;
  });

export function HeadFollow({
  src,
  depth,
  alt,
  className = "",
  target,
}: {
  src: string;
  depth: string;
  alt: string;
  className?: string;
  target?: MutableRefObject<LookTarget>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = box.current, tiltEl = tilt.current, image = img.current;
    if (!el || !tiltEl || !image || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;";
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false });
    if (!gl) return;

    const sh = (type: number, code: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, code);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uO = gl.getUniformLocation(prog, "o");
    const uPivot = gl.getUniformLocation(prog, "pivot");

    const texture = (unit: number, source: TexImageSource, premultiply: boolean) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultiply);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };

    let art: HTMLImageElement | null = null, artWidth = 0;
    // Sin mipmaps: se reescala antes al tamaño del lienzo para reducir sin aliasing.
    const uploadArt = (w: number, h: number) => {
      if (!art) return;
      let source: TexImageSource = art;
      if (w < art.naturalWidth * 0.9) {
        if (w === artWidth) return;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d")!;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(art, 0, 0, w, h);
        source = c;
        artWidth = w;
      } else {
        if (artWidth === art.naturalWidth) return;
        artWidth = art.naturalWidth;
      }
      texture(0, source, true);
    };

    const st = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, lastMove: performance.now() };
    let raf = 0, ready = false, visible = true, last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(el.clientWidth * dpr), h = Math.round(el.clientHeight * dpr);
      if (w < 2 || h < 2) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      uploadArt(w, h);
      wake();
    };

    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
      st.tx = Math.tanh(nx * 1.5);
      st.ty = Math.tanh(ny * 1.5);
      st.lastMove = performance.now();
      wake();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.relatedTarget) return;
      st.tx = st.ty = 0;
      wake();
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min((now - (last || now)) / 1000, 1 / 20);
      last = now;
      const cam = target?.current;
      let tx = cam?.active ? cam.x : st.tx, ty = cam?.active ? cam.y : st.ty;
      const idle = (now - st.lastMove) / 1000;
      if (!cam?.active && idle > 2.5) {
        // Respiración leve cuando nadie mueve el puntero.
        const k = Math.min((idle - 2.5) / 2, 1) * 0.1;
        tx += Math.sin(now / 2300) * k;
        ty += Math.sin(now / 3100) * k * 0.6;
      }
      // Muelle críticamente amortiguado: inercia sin rebote.
      const w = SMOOTHING;
      st.vx += (w * w * (tx - st.x) - 2 * w * st.vx) * dt;
      st.vy += (w * w * (ty - st.y) - 2 * w * st.vy) * dt;
      st.x += st.vx * dt;
      st.y += st.vy * dt;

      const aspect = el.clientWidth / el.clientHeight;
      gl.uniform2f(uO, st.x * STRENGTH, st.y * STRENGTH * aspect);
      gl.uniform1f(uPivot, PIVOT);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      tiltEl.style.transform = `perspective(1100px) rotateY(${(st.x * TILT_Y).toFixed(2)}deg) rotateX(${(-st.y * TILT_X).toFixed(2)}deg)`;
      wake();
    };
    function wake() {
      if (!raf && ready && visible) raf = requestAnimationFrame(frame);
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting && !document.hidden;
      if (!visible) last = 0;
      wake();
    });
    const ro = new ResizeObserver(resize);
    let cancelled = false;

    Promise.all([image.complete && image.naturalWidth ? Promise.resolve(image) : load(image.currentSrc || image.src), load(depth)])
      .then(([a, d]) => {
        if (cancelled) return;
        texture(1, d, false);
        art = a;
        gl.uniform1i(gl.getUniformLocation(prog, "img"), 0);
        gl.uniform1i(gl.getUniformLocation(prog, "dep"), 1);
        tiltEl.appendChild(canvas);
        image.style.visibility = "hidden";
        ready = true;
        window.addEventListener("pointermove", onPointer, { passive: true });
        window.addEventListener("pointerdown", onPointer, { passive: true });
        document.addEventListener("pointerout", onLeave);
        io.observe(el);
        ro.observe(el);
        resize();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("pointerout", onLeave);
      io.disconnect();
      ro.disconnect();
      canvas.remove();
      image.style.visibility = "";
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [depth, target]);

  return (
    <div ref={box} className={`select-none ${className}`}>
      <div ref={tilt} className="relative h-full w-full [transform-style:preserve-3d]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={img} src={src} alt={alt} draggable={false} className="block h-full w-full" />
      </div>
    </div>
  );
}
