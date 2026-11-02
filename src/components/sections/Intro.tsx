"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CloudSky, SKY_DEFAULTS, type SkyControls } from "@/components/CloudSky";
import { HeadFollow, type LookTarget } from "@/components/HeadFollow";
import { ProjectSphere } from "@/components/ProjectSphere";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { startFaceTracking, type FaceTracker } from "@/lib/faceTracking";
import { setReel } from "@/lib/reel";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { SphereItem } from "@/lib/projects";

// Apertura en una sola escena fijada y guiada por el scroll:
// showreel con el cielo ya detrás → el vídeo queda recortado dentro de "2894" → aparece el "_" → logo blanco
// sobre el cielo y, debajo, "Una nueva forma de diseñar" palabra a palabra → zoom out: el cielo era la frente
// del busto (máscara con su silueta) y aparece el busto grande → espejo de la cámara → el busto se parte en las
// tarjetas de la esfera → "PROYECTOS_".
// Variante "directo" (alternativa): el showreel lleva "Una nueva forma de diseñar" abajo; al bajar, el vídeo se
// retira y el cielo de detrás se convierte en el busto de inmediato, sin el paso por el logo.
export type IntroVariant = "logo" | "directo";
// Tramos de cada variante (fracciones del recorrido). track: alto en svh; at: la esfera ya está formada (#proyectos).
const TIMING = {
  logo: { track: 600, zoom: [0.27, 0.43], burst: [0.6, 0.8], title: [0.8, 0.88], at: 0.86 },
  directo: { track: 480, zoom: [0.08, 0.26], burst: [0.44, 0.64], title: [0.64, 0.72], at: 0.7 },
} as const;
const IMG_W = 1063, IMG_H = 1518;
const BBOX = [0.206, 0.108, 0.752, 0.882]; // figura dentro del PNG del busto
const FOCUS = [0.5, 0.3]; // punto de la frente desde el que se aleja la cámara
const FOCUS_R = 0.24; // radio (fracción del ancho) del círculo opaco alrededor de FOCUS
const COLS = 2;
// Colores muestreados de la pintura del busto, para que el cielo y el busto sean el mismo cielo.
export const BUST_SKY = "linear-gradient(180deg,#0a62ae 0%,#0b84ca 58%,#4ea6d8 100%)";
const CLOUD_LIT = "#f6f3ea";
const CLOUD_SHADE = "#a7b7cc";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type CamState = "idle" | "asking" | "on" | "off";

// "2894" y "_" en SVG: la misma geometría sirve de recorte del vídeo y de logo blanco, así nunca se desajustan.
// (Dentro de <clipPath> no se admite <g>: cada texto lleva su propia transformación.)
const GLYPH_STYLE = { fontWeight: 700, letterSpacing: "-0.05em" } as const;
type GlyphRef = (el: SVGTextElement | null) => void;
const Glyphs = ({ num, us, fill }: { num: GlyphRef; us: GlyphRef; fill?: string }) => (
  <>
    <text ref={num} fill={fill} style={GLYPH_STYLE}>2894</text>
    <text ref={us} fill={fill} style={GLYPH_STYLE}>_</text>
  </>
);

export function Intro({ items, variant = "logo" }: { items: SphereItem[]; variant?: IntroVariant }) {
  const reduced = useReducedMotion();
  if (reduced) return <StaticIntro items={items} />;
  return <ScrollIntro items={items} variant={variant} />;
}

function ScrollIntro({ items, variant }: { items: SphereItem[]; variant: IntroVariant }) {
  const T = TIMING[variant];
  const direct = variant === "directo";
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const clipRect = useRef<SVGRectElement>(null);
  const logoSvg = useRef<SVGSVGElement>(null);
  const nums = useRef<(SVGTextElement | null)[]>([]);
  const uss = useRef<(SVGTextElement | null)[]>([]);
  const phrase = useRef<HTMLDivElement>(null);
  const sides = useRef<HTMLDivElement>(null);
  const mirrorVideo = useRef<HTMLDivElement>(null);
  const mirror = useRef<HTMLDivElement>(null);
  const bust = useRef<HTMLDivElement>(null);
  const tilesEl = useRef<HTMLDivElement>(null);
  const projectsEl = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const look = useRef<LookTarget>({ active: false, x: 0, y: 0 });
  const skyCtrl = useRef<SkyControls>({ ...SKY_DEFAULTS, size: 1.7 });
  const [skyOn, setSkyOn] = useState(false);
  const [cam, setCam] = useState<CamState>("idle");
  const camRef = useRef<{ state: CamState; tracker: FaceTracker | null; granted: boolean }>({ state: "idle", tracker: null, granted: false });
  const clipId = `reel-clip-${useId().replace(/:/g, "")}`;

  // Cámara: se pide al aparecer el busto; si no hay permiso o soporte, el busto sigue al ratón o al dedo.
  const startCam = () => {
    const c = camRef.current;
    if (c.state === "asking" || c.state === "on" || c.state === "off") return;
    c.state = "asking";
    setCam("asking");
    startFaceTracking(
      (x, y) => {
        look.current.active = true;
        look.current.x = x;
        look.current.y = y;
      },
      () => (look.current.active = false),
    )
      .then((t) => {
        c.tracker = t;
        mirrorVideo.current?.replaceChildren(t.video);
        c.granted = true;
        c.state = "on";
        setCam("on");
      })
      .catch(() => {
        c.state = "off";
        setCam("off");
      });
  };
  const pauseCam = () => {
    const c = camRef.current;
    if (c.state !== "on") return;
    c.tracker?.stop();
    c.tracker = null;
    look.current.active = false;
    c.state = "idle"; // con permiso ya concedido, al volver se reanuda sin volver a preguntar
    setCam("idle");
  };
  const stopCam = () => {
    pauseCam();
    camRef.current.state = "off";
    setCam("off");
  };

  useEffect(() => {
    const st = stage.current, tr = track.current;
    if (!st || !tr) return;
    const camera = camRef.current;
    let raf = 0, W = 0, H = 0, bh = 0, bw = 0, fs = 0, numW = 0, usW = 0, inView = true;

    // Piezas del busto que vuelan a la esfera (cara A: trozo del busto; cara B: el proyecto).
    const ROWS = Math.ceil(items.length / COLS);
    const tiles = items.map((p, i) => {
      const el = document.createElement("div");
      el.className = "absolute left-0 top-0 [transform-style:preserve-3d]";
      const front = document.createElement("div");
      front.className = "absolute inset-0 [backface-visibility:hidden] bg-no-repeat";
      front.style.backgroundImage = "url(/brand/head.webp)";
      const back = document.createElement("div");
      back.className = "absolute inset-0 bg-cover bg-center [backface-visibility:hidden] [transform:rotateY(180deg)]";
      back.style.backgroundImage = `url(${p.image})`;
      el.append(front, back);
      tilesEl.current?.appendChild(el);
      return { el, front, back, col: i % COLS, row: Math.floor(i / COLS) };
    });

    const measure = () => {
      W = st.clientWidth;
      H = st.clientHeight;
      // Busto grande: la figura ocupa ~3/4 del alto (o ~82 % del ancho en pantallas estrechas).
      bh = Math.min(H * 0.95, ((W * 0.82) / (BBOX[2] - BBOX[0])) * IMG_H / IMG_W);
      bw = bh * IMG_W / IMG_H;
      if (bust.current) {
        const b = bust.current.style;
        b.width = `${bw}px`;
        b.height = `${bh}px`;
        b.left = `${(W - bw) / 2}px`;
        b.top = `${(H - bh) / 2}px`;
        b.transformOrigin = `${FOCUS[0] * bw}px ${FOCUS[1] * bh}px`;
      }
      // Tamaño del logo (igual que clamp(6rem,27vw,30rem)) y anchos medidos de "2894" y "_".
      fs = clamp(W * 0.27, 96, 480);
      logoSvg.current?.setAttribute("viewBox", `0 0 ${W} ${H}`);
      [...nums.current, ...uss.current].forEach((el) => el && (el.style.fontSize = `${fs}px`));
      numW = nums.current[0]?.getComputedTextLength() ?? fs * 2.2;
      usW = uss.current[0]?.getComputedTextLength() ?? fs * 0.5;
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting));
    io.observe(tr);

    const headerEl = () => st.querySelector<HTMLElement>("[data-reel-header]");
    const frameEl = () => st.querySelector<HTMLElement>("[data-reel-frame]");

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = tr.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - window.innerHeight), 0, 1);
      const cx = W / 2, cy = H / 2;

      // 1 · Showreel: se enmarca con bordes redondeados y alrededor ya está el cielo.
      const a = smooth(seg(p, 0, 0.05));
      const head = headerEl(), fr = frameEl();
      const inset = a * clamp(W * 0.06, 24, 96);
      if (head) head.style.padding = `${inset}px`;
      if (fr) fr.style.borderRadius = `${a * 48}px`;
      setReel({ active: inView && p < (direct ? 0.07 : 0.055) });

      // 2 · El vídeo queda recortado dentro de "2894": el marco se encoge hacia el centro mientras las letras
      // (enormes al principio) bajan a su tamaño. Fuera de las letras se ve el cielo.
      const clipOn = !direct && p > 0.05;
      const rk = smooth(seg(p, 0.05, 0.1));
      const shrink = easeOut(seg(p, 0.05, 0.12));
      const sc = Math.exp(lerp(Math.log(2.6), 0, shrink));
      const us = smooth(seg(p, 0.11, 0.15)); // aparece el guion y el número se recentra
      // En la variante directa el vídeo se aleja y se apaga hacia el centro, dejando el cielo de detrás.
      const videoOut = direct ? smooth(seg(p, 0.07, 0.13)) : smooth(seg(p, 0.12, 0.17));
      const reelScale = direct ? lerp(1, 0.82, videoOut) : 1;
      if (head) {
        head.style.clipPath = clipOn ? `url(#${clipId})` : "";
        head.style.opacity = String(1 - videoOut);
        head.style.transform = direct ? `scale(${reelScale})` : "";
        head.style.visibility = videoOut >= 1 ? "hidden" : "";
      }
      if (clipRect.current) {
        const w = (W - 2 * inset) * (1 - rk), h = (H - 2 * inset) * (1 - rk);
        clipRect.current.setAttribute("x", String(cx - w / 2));
        clipRect.current.setAttribute("y", String(cy - h / 2));
        clipRect.current.setAttribute("width", String(Math.max(w, 0)));
        clipRect.current.setAttribute("height", String(Math.max(h, 0)));
        clipRect.current.setAttribute("rx", String(48 * (1 - rk) + 24 * rk));
      }

      // 3 · Zoom out: el cielo es la frente del busto. La silueta (máscara) pasa de cubrir toda la pantalla
      // a su tamaño final; el punto de la frente viaja del centro de la pantalla a su sitio en el busto.
      const k = smooth(seg(p, T.zoom[0], T.zoom[1]));
      const s0 = (Math.hypot(W, H) / 2 / (FOCUS_R * bw)) * 1.08;
      const s = Math.exp(lerp(Math.log(s0), 0, k));
      const t = s0 > 1 ? (1 / s - 1 / s0) / (1 - 1 / s0) : 1;
      const fxF = (W - bw) / 2 + FOCUS[0] * bw, fyF = (H - bh) / 2 + FOCUS[1] * bh; // frente en su sitio final
      const X = lerp(cx, fxF, t), Y = lerp(cy, fyF, t);
      if (sky.current) {
        const m = sky.current.style;
        const size = `${bw * s}px ${bh * s}px`, pos = `${X - FOCUS[0] * bw * s}px ${Y - FOCUS[1] * bh * s}px`;
        m.setProperty("mask-size", size);
        m.setProperty("-webkit-mask-size", size);
        m.setProperty("mask-position", pos);
        m.setProperty("-webkit-mask-position", pos);
        m.opacity = String(1 - smooth(seg(k, 0.9, 1)));
      }
      skyCtrl.current.size = lerp(1.7, 0.8, k);
      const skyVisible = p > 0.002 && k < 1;
      setSkyOn((v) => (v === skyVisible ? v : skyVisible));

      // Logo: recorte del vídeo y, cuando el vídeo se apaga, el mismo logo en blanco; se aleja con el cielo.
      const total = numW + usW * us;
      const x0 = cx - total / 2, base = cy + fs * 0.35;
      const logoIn = smooth(seg(p, 0.12, 0.17));
      const logoOut = smooth(seg(k, 0.1, 0.45));
      [0, 1].forEach((i) => {
        // i 0 = recorte (escala del encogimiento); i 1 = logo blanco (se aleja con el cielo)
        const z = i === 0 ? sc : s / s0;
        const dx = i === 0 ? 0 : X - cx, dy = i === 0 ? 0 : Y - cy;
        const G = `translate(${cx + dx} ${cy + dy}) scale(${z}) translate(${-cx} ${-cy})`;
        const n = nums.current[i], u = uss.current[i];
        n?.setAttribute("x", String(x0));
        n?.setAttribute("y", String(base));
        n?.setAttribute("transform", G);
        if (u) {
          const ux = x0 + numW;
          u.setAttribute("x", String(ux));
          u.setAttribute("y", String(base));
          u.setAttribute("transform", `${G} translate(${ux} 0) scale(${Math.max(us, 0.0001)} 1) translate(${-ux} 0)`);
        }
      });
      if (logoSvg.current) logoSvg.current.style.opacity = direct ? "0" : String(logoIn * (1 - logoOut));

      // 4 · La pintura del busto aparece encima del cielo con la misma escala y posición.
      const bustIn = smooth(seg(k, 0.55, 0.92));
      const burst = seg(p, T.burst[0], T.burst[1]);
      if (bust.current) {
        bust.current.style.opacity = String(burst > 0 ? 0 : bustIn);
        bust.current.style.visibility = bustIn > 0 && burst <= 0 ? "visible" : "hidden";
        bust.current.style.transform = `translate(${X - fxF}px,${Y - fyF}px) scale(${s})`;
        // Contorno: sombra muy suave para que las nubes del borde no se confundan con el fondo blanco
        // (solo a tamaño final: el filtro sobre el busto ampliado sería caro).
        bust.current.style.filter = s < 1.6 ? "drop-shadow(0 0 1px rgb(10 50 120 / 0.35)) drop-shadow(0 18px 36px rgb(11 11 13 / 0.12))" : "";
      }
      // "Una nueva forma de diseñar" bajo el logo, palabra a palabra; se aleja con el logo en el zoom out.
      if (phrase.current) {
        const ph = phrase.current;
        const line = ph.querySelector<HTMLElement>("[data-line]");
        if (direct) {
          // Alternativa: el vídeo va sin texto (la frase queda junto al busto).
          ph.style.opacity = "0";
          ph.style.transform = `scale(${reelScale})`;
          if (line) line.style.top = `${H - inset - Math.max(H * 0.05, 24) - 72 - line.offsetHeight}px`; // por encima de la barra reproductor
        } else {
          ph.style.opacity = String(1 - logoOut);
          ph.style.transform = `translate(${X - cx}px,${Y - cy}px) scale(${s / s0})`;
          if (line) line.style.top = `${cy + fs * 0.35 + fs * 0.2}px`; // justo bajo la línea base del logo
        }
        ph.querySelectorAll<HTMLElement>("[data-word]").forEach((w, i) => {
          const kk = direct ? easeOut(seg(p, 0.008 + i * 0.008, 0.03 + i * 0.008)) : easeOut(seg(p, 0.15 + i * 0.014, 0.19 + i * 0.014));
          w.style.transform = `translateY(${150 * (1 - kk)}%)`; // 150 %: también oculta la tilde de la Ñ
        });
      }
      const gone = smooth(seg(p, T.burst[0] - 0.025, T.burst[0] + 0.005)); // todo se retira cuando el busto se parte
      if (mirror.current) mirror.current.style.opacity = String(smooth(seg(p, T.zoom[1] - 0.01, T.zoom[1] + 0.03)) * (1 - gone));
      // La frase queda de forma sutil a los lados del busto.
      if (sides.current) sides.current.style.opacity = String(smooth(seg(k, 0.85, 1)) * (1 - gone));

      // Cámara: se pide al terminar el zoom y se pausa fuera del tramo del busto.
      const c = camRef.current;
      if (p > T.zoom[1] - 0.03 && p < T.burst[0] + 0.02 && inView) {
        if (c.state === "idle") startCam();
      } else if (c.state === "on") pauseCam();

      // 5 · El busto se parte: cada pieza vuela a su tarjeta de la esfera y se gira para mostrar el proyecto.
      const bx = cx - bw / 2, by = cy - bh / 2;
      const fx0 = bx + BBOX[0] * bw, fy0 = by + BBOX[1] * bh;
      const fw = (BBOX[2] - BBOX[0]) * bw / COLS, fh = (BBOX[3] - BBOX[1]) * bh / ROWS;
      const sr = st.getBoundingClientRect();
      const formed = burst >= 1;
      if (tilesEl.current) tilesEl.current.style.visibility = burst > 0 && !formed ? "visible" : "hidden";
      if (burst > 0 && !formed) {
        tiles.forEach((tl, i) => {
          const card = cards.current[i];
          if (!card) return;
          const cr = card.getBoundingClientRect();
          const kk = smooth(clamp((burst - (i % ROWS) * 0.06) / 0.7, 0, 1));
          const sx = fx0 + tl.col * fw + fw / 2, sy = fy0 + tl.row * fh + fh / 2;
          const tx = cr.left - sr.left + cr.width / 2, ty = cr.top - sr.top + cr.height / 2;
          const x = lerp(sx, tx, kk), y = lerp(sy, ty, kk), zz = Math.sin(Math.PI * kk) * 200;
          const w = lerp(fw, cr.width, kk), h = lerp(fh, cr.height, kk);
          const flip = 180 * smooth(clamp((kk - 0.15) / 0.7, 0, 1));
          tl.el.style.width = `${w}px`;
          tl.el.style.height = `${h}px`;
          tl.el.style.transform = `translate3d(${x - w / 2}px,${y - h / 2}px,${zz}px) rotateY(${flip}deg)`;
          const op = String(lerp(1, Number(card.style.opacity || 1), kk));
          tl.front.style.opacity = op;
          tl.back.style.opacity = op;
          tl.el.style.zIndex = String(Math.round(lerp(50, Number(card.style.zIndex || 50), kk)));
          // La cara A muestra exactamente el trozo que ocupaba en el busto.
          tl.front.style.backgroundSize = `${(bw * w) / fw}px ${(bh * h) / fh}px`;
          tl.front.style.backgroundPosition = `${(-(sx - fw / 2 - bx) * w) / fw}px ${(-(sy - fh / 2 - by) * h) / fh}px`;
        });
      }
      if (projectsEl.current) {
        projectsEl.current.style.opacity = formed ? "1" : "0";
        projectsEl.current.style.pointerEvents = formed ? "auto" : "none";
      }

      // 6 · "PROYECTOS_"
      const ttl = seg(p, T.title[0], T.title[1]);
      title.current?.querySelectorAll<HTMLElement>("[data-char]").forEach((sp, i) => {
        const kk = easeOut(clamp((ttl - i * 0.06) / 0.4, 0, 1));
        sp.style.transform = `translateY(${110 * (1 - kk)}%)`;
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      tiles.forEach((tl) => tl.el.remove());
      camera.tracker?.stop();
      setReel({ active: false });
    };
  }, [items, clipId, direct, T]);

  const titleChars = "Proyectos_".split("");

  return (
    <section ref={track} aria-label="Apertura" className="relative" style={{ height: `${T.track}svh` }}>
      {/* Anclas de navegación dentro del recorrido */}
      <div id="proyectos" data-anchor aria-hidden className="pointer-events-none absolute left-0 w-px" style={{ top: `${T.at * (T.track - 100)}svh` }} />

      <div ref={stage} className="sticky top-0 h-svh overflow-hidden bg-cloud">
        {/* Recorte del vídeo: marco que se encoge + "2894_" */}
        <svg aria-hidden width="0" height="0" className="absolute">
          <defs>
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              <rect ref={clipRect} />
              <Glyphs num={(el) => void (nums.current[0] = el)} us={(el) => void (uss.current[0] = el)} />
            </clipPath>
          </defs>
        </svg>

        {/* Cielo = la pintura del busto: siempre detrás del vídeo; su silueta se reduce en el zoom out */}
        <div
          ref={sky}
          aria-hidden
          className="absolute inset-0 [mask-image:url(/brand/head.webp)] [mask-repeat:no-repeat] [-webkit-mask-image:url(/brand/head.webp)] [-webkit-mask-repeat:no-repeat]"
          style={{ backgroundImage: BUST_SKY, maskSize: "4000% 4000%", maskPosition: "50% 30%" }}
        >
          <CloudSky active={skyOn} lit={CLOUD_LIT} shade={CLOUD_SHADE} controls={skyCtrl} />
        </div>

        {/* Showreel (recortado por el clip-path cuando entra en las letras) */}
        <Hero managed />

        {/* Logo blanco sobre el cielo (misma geometría que el recorte) */}
        <svg ref={logoSvg} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-0" preserveAspectRatio="none">
          <Glyphs fill="#ffffff" num={(el) => void (nums.current[1] = el)} us={(el) => void (uss.current[1] = el)} />
        </svg>

        {/* "Una nueva forma de diseñar" bajo el logo */}
        <div ref={phrase} className="pointer-events-none absolute inset-0 px-[var(--gutter)] text-cloud" style={{ transformOrigin: "50% 50%" }}>
          <p className="sr-only">Una nueva forma de diseñar</p>
          <p data-line aria-hidden className="absolute inset-x-[var(--gutter)] flex flex-wrap justify-center gap-x-[0.3em] text-center text-[clamp(1.4rem,4vw,3.4rem)] font-medium uppercase leading-none tracking-[-0.03em]">
            {["Una", "nueva", "forma", "de", "diseñar"].map((w) => (
              <span key={w} className="-mb-[0.12em] -mt-[0.24em] inline-block overflow-hidden pb-[0.12em] pt-[0.24em]">
                <span data-word className="inline-block" style={{ transform: "translateY(150%)" }}>
                  {w}
                </span>
              </span>
            ))}
          </p>
        </div>

        {/* La frase, sutil, a los lados del busto (en móvil, arriba) */}
        <div ref={sides} aria-hidden className="pointer-events-none absolute inset-0 text-[clamp(0.95rem,1.5vw,1.4rem)] font-medium uppercase tracking-[0.04em] text-ink/45 opacity-0">
          {direct ? (
            // Alternativa: el nombre del estudio a un lado y la frase al otro.
            <>
              <span className="absolute left-[var(--gutter)] top-[calc(20px+env(safe-area-inset-top,0px))] sm:top-1/2 sm:-translate-y-1/2">
                2894<span className="blink">_</span> Studio
              </span>
              <span className="absolute right-[var(--gutter)] top-[calc(20px+env(safe-area-inset-top,0px))] max-w-[48%] text-right sm:top-1/2 sm:max-w-[min(30vw,22rem)] sm:-translate-y-1/2">Una nueva forma de diseñar</span>
            </>
          ) : (
            <>
              <span className="absolute left-[var(--gutter)] top-[calc(20px+env(safe-area-inset-top,0px))] sm:top-1/2 sm:-translate-y-1/2">Una nueva forma</span>
              <span className="absolute right-[var(--gutter)] top-[calc(20px+env(safe-area-inset-top,0px))] sm:top-1/2 sm:-translate-y-1/2">de diseñar</span>
            </>
          )}
        </div>

        {/* Busto */}
        <div ref={bust} className="invisible absolute opacity-0 will-change-transform">
          <HeadFollow src="/brand/head.webp" depth="/brand/head-depth.png" alt="Busto de 2894_: una cabeza azul con nubes" className="h-full w-full" target={look} />
        </div>

        {/* Cámara: aviso al pedir permiso y, con permiso, un espejo pequeño con la imagen de la cámara */}
        {cam === "asking" && (
          <div className="absolute inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] z-20 flex justify-center px-[var(--gutter)]">
            <p className="rounded-full bg-white/80 px-4 py-2 text-center text-sm text-ink backdrop-blur-md">
              Permite la cámara para que el busto te mire. La imagen se procesa en tu dispositivo y no se guarda.
            </p>
          </div>
        )}
        <div
          ref={mirror}
          hidden={cam !== "on"}
          className="absolute bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-[var(--gutter)] z-20 w-[clamp(150px,18vw,240px)] overflow-hidden rounded-3xl border border-white/60 bg-ink shadow-[0_12px_40px_rgb(11_11_13/0.18)] max-sm:w-[132px]"
        >
          <div ref={mirrorVideo} aria-hidden className="relative aspect-[4/3] w-full [&>video]:absolute [&>video]:inset-0 [&>video]:h-full [&>video]:w-full [&>video]:-scale-x-100 [&>video]:object-cover" />
          <p className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-ink/70 to-transparent px-4 pb-6 pt-3.5 text-[11px] sm:px-5 sm:pt-4 font-medium uppercase leading-tight tracking-wide text-cloud sm:text-xs">
            Bienvenido a 2894<span className="blink">_</span> Studio
          </p>
          <button type="button" onClick={stopCam} className="flex min-h-11 w-full items-center justify-center bg-white/90 text-xs font-medium text-ink hover:bg-white">
            Usar el ratón
          </button>
        </div>

        {/* Piezas en vuelo */}
        <div ref={tilesEl} aria-hidden className="pointer-events-none absolute inset-0 [perspective:1600px]" />

        {/* Proyectos */}
        <div ref={projectsEl} className="absolute inset-0 flex flex-col pt-[clamp(3.5rem,9svh,6rem)] opacity-0">
          <h2 ref={title} id="proyectos-h" className="px-[var(--gutter)] text-[clamp(2.4rem,9vw,7rem)] font-light uppercase leading-none tracking-[-0.04em]">
            <span className="sr-only">Proyectos</span>
            <span aria-hidden>
              {titleChars.map((ch, i) => (
                <span key={i} className="-mx-[0.02em] -mb-[0.14em] -mt-[0.08em] inline-block overflow-hidden px-[0.02em] pb-[0.14em] pt-[0.08em] align-bottom">
                  <span data-char className={`inline-block ${ch === "_" ? "blink text-cobalt" : ""}`} style={{ transform: "translateY(110%)" }}>
                    {ch}
                  </span>
                </span>
              ))}
            </span>
          </h2>
          <div className="relative mt-2 flex flex-1 flex-col justify-center pb-[12svh] lg:px-[var(--gutter)] lg:pb-0">
            <ProjectSphere items={items} controlled cardsRef={cards} sizeClass="w-[min(92vw,66svh)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Movimiento reducido: la misma historia, estática y en orden.
function StaticIntro({ items }: { items: SphereItem[] }) {
  return (
    <>
      <Hero />
      <section aria-label="Una nueva forma de diseñar" className="grid min-h-svh place-items-center gap-8 bg-[linear-gradient(180deg,#0a62ae,#0b84ca_58%,#4ea6d8)] px-[var(--gutter)] py-16 text-center text-cloud">
        <p className="text-[clamp(3rem,12vw,10rem)] font-bold uppercase leading-[0.9] tracking-[-0.05em]">Una nueva forma de diseñar</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/head.webp" alt="Busto de 2894_: una cabeza azul con nubes" className="h-[60svh] w-auto" />
      </section>
      <Projects items={items} />
    </>
  );
}
