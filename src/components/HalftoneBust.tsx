"use client";

import { useEffect, useRef } from "react";

// Busto de 2894_ en trama de puntos (halftone) blanca, pensado para el fondo cobalto del cierre: sutil, como un
// guiño final. Cada punto sale de la pintura del busto (más claro = punto más grande, así las nubes se leen) y se
// desplaza según el mapa de profundidad hacia donde está el ratón: el busto "gira" levemente siguiéndolo.
const SRC = "/brand/head.webp";
const DEPTH = "/brand/head-depth.png";
const SAMPLE_W = 90; // columnas de la trama (la altura sale de la proporción del busto)
const SHIFT = 0.05; // desplazamiento máximo (fracción del ancho) de los puntos más cercanos
const SPRING = 0.08;
// Recorte a la silueta (fracciones del PNG: izquierda, arriba, derecha, abajo): sin márgenes vacíos, el busto llena su caja.
export const BUST_BOX = [0.206, 0.108, 0.752, 0.882] as const;
export const BUST_ASPECT = ((BUST_BOX[2] - BUST_BOX[0]) * 2126) / ((BUST_BOX[3] - BUST_BOX[1]) * 3036);

type Dot = { x: number; y: number; r: number; d: number };

function load(src: string) {
  return new Promise<HTMLImageElement>((ok, ko) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = ko;
    im.src = src;
  });
}

function sample(im: HTMLImageElement, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  const [l, t, r, b] = BUST_BOX;
  const W = im.naturalWidth, H = im.naturalHeight;
  g.drawImage(im, l * W, t * H, (r - l) * W, (b - t) * H, 0, 0, w, h);
  return g.getImageData(0, 0, w, h).data;
}

const REPEL_R = 0.16; // radio (fracción del ancho) en el que el ratón aparta los puntos
const REPEL_F = 0.9;
const BACK = 0.06; // muelle que devuelve cada punto a su sitio
const DAMP = 0.82;

export type HalftoneHandle = { burst: () => void };

// `burstRef`: permite pedir desde fuera la "explosión" de los puntos (antes de pasar a la página del busto).
export function HalftoneBust({ className = "", burstRef }: { className?: string; burstRef?: React.MutableRefObject<HalftoneHandle | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dots: Dot[] = [];
    let ox = new Float32Array(0), oy = new Float32Array(0), vx = new Float32Array(0), vy = new Float32Array(0);
    let cols = SAMPLE_W, rows = 0, raf = 0, alive = true, visible = false, fade = 1, bursting = false;
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const ptr = { x: 0, y: 0, in: false }; // puntero en píxeles del canvas

    const layout = () => {
      const W = cv.width, H = cv.height;
      const cell = Math.min(W / cols, H / rows);
      return { W, H, cell, x0: (W - cell * cols) / 2, y0: (H - cell * rows) / 2 };
    };

    const draw = () => {
      const g = cv.getContext("2d");
      if (!g) return;
      const { W, H, cell, x0, y0 } = layout();
      g.clearRect(0, 0, W, H);
      const sx = cur.x * SHIFT * W, sy = cur.y * SHIFT * W * 0.6;
      g.globalAlpha = fade;
      g.fillStyle = "#fff";
      g.beginPath();
      for (let k = 0; k < dots.length; k++) {
        const p = dots[k];
        const x = x0 + (p.x + 0.5) * cell + sx * p.d + ox[k];
        const y = y0 + (p.y + 0.5) * cell + sy * p.d + oy[k];
        const r = p.r * cell * 0.5;
        g.moveTo(x + r, y);
        g.arc(x, y, r, 0, Math.PI * 2);
      }
      g.fill();
    };

    // Física de los puntos: el ratón los aparta (o la explosión los lanza) y un muelle los devuelve.
    const step = () => {
      const { W, cell, x0, y0 } = layout();
      const R = REPEL_R * W, R2 = R * R;
      let moving = 0;
      for (let k = 0; k < dots.length; k++) {
        const p = dots[k];
        if (ptr.in && !bursting) {
          const dx = x0 + (p.x + 0.5) * cell + ox[k] - ptr.x, dy = y0 + (p.y + 0.5) * cell + oy[k] - ptr.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            const d = Math.sqrt(d2), f = (1 - d / R) * REPEL_F * cell;
            vx[k] += (dx / d) * f;
            vy[k] += (dy / d) * f;
          }
        }
        if (!bursting) {
          vx[k] += -ox[k] * BACK;
          vy[k] += -oy[k] * BACK;
        }
        vx[k] *= bursting ? 0.97 : DAMP;
        vy[k] *= bursting ? 0.97 : DAMP;
        ox[k] += vx[k];
        oy[k] += vy[k];
        moving += Math.abs(vx[k]) + Math.abs(vy[k]) + Math.abs(ox[k]) * 0.05;
      }
      return moving / Math.max(1, dots.length) > 0.01;
    };

    const resize = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
      draw();
    };

    const tick = () => {
      raf = 0;
      cur.x += (target.x - cur.x) * SPRING;
      cur.y += (target.y - cur.y) * SPRING;
      const moving = step();
      if (bursting) fade = Math.max(0, fade - 0.035);
      draw();
      const turning = Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.001;
      if (visible && (turning || moving || ptr.in || (bursting && fade > 0))) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && !reduced) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      const k = cv.width / Math.max(1, r.width);
      ptr.x = (e.clientX - r.left) * k;
      ptr.y = (e.clientY - r.top) * k;
      ptr.in = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      kick();
    };

    if (burstRef)
      burstRef.current = {
        burst: () => {
          // Todos los puntos salen despedidos desde el centro del busto y se desvanecen.
          const { W, H, cell, x0, y0 } = layout();
          bursting = true;
          for (let k = 0; k < dots.length; k++) {
            const dx = x0 + (dots[k].x + 0.5) * cell - W / 2, dy = y0 + (dots[k].y + 0.5) * cell - H / 2;
            const d = Math.hypot(dx, dy) || 1;
            const v = (0.02 + Math.random() * 0.03) * W;
            vx[k] = (dx / d) * v;
            vy[k] = (dy / d) * v;
          }
          kick();
        },
      };

    Promise.all([load(SRC), load(DEPTH)])
      .then(([im, dm]) => {
        if (!alive) return;
        cols = SAMPLE_W;
        rows = Math.round(SAMPLE_W / BUST_ASPECT);
        const px = sample(im, cols, rows), dp = sample(dm, cols, rows);
        dots = [];
        for (let y = 0; y < rows; y++)
          for (let x = 0; x < cols; x++) {
            const i = (y * cols + x) * 4;
            const a = px[i + 3] / 255;
            if (a < 0.4) continue;
            const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
            // Mínimo para que la silueta se lea entera; las nubes (claras) llenan la celda.
            const r = Math.min(1, 0.18 + lum * lum * 1.05) * a;
            dots.push({ x, y, r, d: dp[i] / 255 - 0.5 });
          }
        ox = new Float32Array(dots.length);
        oy = new Float32Array(dots.length);
        vx = new Float32Array(dots.length);
        vy = new Float32Array(dots.length);
        resize();
      })
      .catch(() => {});

    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(cv);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      if (burstRef) burstRef.current = null;
    };
  }, [burstRef]);

  return <canvas ref={canvas} aria-hidden className={className} />;
}
