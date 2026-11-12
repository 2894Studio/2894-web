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

export function HalftoneBust({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dots: Dot[] = [];
    let cols = SAMPLE_W, rows = 0, raf = 0, alive = true, visible = false;
    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };

    const draw = () => {
      const g = cv.getContext("2d");
      if (!g) return;
      const W = cv.width, H = cv.height;
      g.clearRect(0, 0, W, H);
      const cell = Math.min(W / cols, H / rows);
      const ox = (W - cell * cols) / 2, oy = (H - cell * rows) / 2;
      const sx = cur.x * SHIFT * W, sy = cur.y * SHIFT * W * 0.6;
      g.fillStyle = "#fff";
      g.beginPath();
      for (const p of dots) {
        const x = ox + (p.x + 0.5) * cell + sx * p.d;
        const y = oy + (p.y + 0.5) * cell + sy * p.d;
        const r = p.r * cell * 0.5;
        g.moveTo(x + r, y);
        g.arc(x, y, r, 0, Math.PI * 2);
      }
      g.fill();
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
      draw();
      if (Math.abs(target.x - cur.x) + Math.abs(target.y - cur.y) > 0.001 && visible) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && !reduced) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
      kick();
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
    };
  }, []);

  return <canvas ref={canvas} aria-hidden className={className} />;
}
