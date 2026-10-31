"use client";

import { useEffect, useRef, useState } from "react";
import { CloudSky } from "@/components/CloudSky";
import { HeadFollow, type LookTarget } from "@/components/HeadFollow";
import { ProjectSphere } from "@/components/ProjectSphere";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { startFaceTracking, type FaceTracker } from "@/lib/faceTracking";
import { setReel } from "@/lib/reel";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { projects } from "@/content/site";

// Apertura en una sola escena fijada y guiada por el scroll:
// showreel → el vídeo queda dentro de "2894" → aparece el "_" → cielo con nubes y logo blanco →
// zoom out: el busto en el centro rodeado por "Una nueva forma de diseñar" → el busto se parte en las tarjetas
// de la esfera de proyectos → "PROYECTOS_".
const TRACK_SVH = 720;
const PROJECTS_AT = 0.86; // progreso en el que la esfera ya está formada (destino del ancla #proyectos)
const IMG_W = 1063, IMG_H = 1518;
const BBOX = [0.206, 0.108, 0.752, 0.882]; // figura dentro del PNG del busto
const COLS = 2, ROWS = 5;

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type CamState = "idle" | "asking" | "on" | "off";

// Logo con el número y el guion separados, para que el guion entre después y el conjunto se recentre.
const Wordmark = ({ underscore }: { underscore: React.Ref<HTMLSpanElement> }) => (
  <span className="flex items-baseline whitespace-nowrap font-bold leading-none tracking-[-0.05em]">
    <span>2894</span>
    <span ref={underscore} data-us className="inline-block overflow-hidden" style={{ width: 0 }}>
      <span className="blink inline-block">_</span>
    </span>
  </span>
);

export function Intro() {
  const reduced = useReducedMotion();
  if (reduced) return <StaticIntro />;
  return <ScrollIntro />;
}

function ScrollIntro() {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const knock = useRef<HTMLDivElement>(null);
  const knockText = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);
  const usA = useRef<HTMLSpanElement>(null);
  const usB = useRef<HTMLSpanElement>(null);
  const slogan = useRef<HTMLDivElement>(null);
  const bust = useRef<HTMLDivElement>(null);
  const tilesEl = useRef<HTMLDivElement>(null);
  const projectsEl = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const look = useRef<LookTarget>({ active: false, x: 0, y: 0 });
  const [skyOn, setSkyOn] = useState(false);
  const [cam, setCam] = useState<CamState>("idle");
  const camRef = useRef<{ state: CamState; tracker: FaceTracker | null; granted: boolean }>({ state: "idle", tracker: null, granted: false });

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
    let raf = 0, W = 0, H = 0, bh = 0, bw = 0, usW = 0, inView = true;

    // Piezas del busto que vuelan a la esfera (cara A: trozo del busto; cara B: el proyecto).
    const tiles = projects.map((p, i) => {
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
      bh = Math.min(H * (W < 640 ? 0.56 : 0.68), W * 0.9 * IMG_H / IMG_W);
      bw = bh * IMG_W / IMG_H;
      if (bust.current) {
        bust.current.style.width = `${bw}px`;
        bust.current.style.height = `${bh}px`;
      }
      // Ancho natural del guion, para abrirlo desde 0.
      const probe = usA.current?.firstElementChild as HTMLElement | null;
      usW = probe ? probe.offsetWidth / (parseFloat(getComputedStyle(probe).fontSize) || 1) : 0.5;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting));
    io.observe(tr);

    const frameEl = () => st.querySelector<HTMLElement>("[data-reel-frame]");
    const headerEl = () => st.querySelector<HTMLElement>("[data-reel-header]");

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = tr.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - window.innerHeight), 0, 1);
      const cx = W / 2, cy = H / 2;

      // 1 · Showreel: se enmarca con bordes redondeados.
      const a = smooth(seg(p, 0, 0.06));
      const head = headerEl(), fr = frameEl();
      const inset = a * clamp(W * 0.06, 24, 96);
      if (head) head.style.padding = `${inset}px`;
      if (fr) fr.style.borderRadius = `${a * 48}px`;
      setReel({ active: inView && p < 0.07 });

      // 2 · El vídeo queda dentro de "2894": capa blanca con texto negro en modo "screen" (el negro deja ver el vídeo).
      const knockIn = smooth(seg(p, 0.06, 0.1));
      const shrink = easeOut(seg(p, 0.06, 0.17));
      const scale = Math.exp(lerp(Math.log(2.6), 0, shrink));
      const us = smooth(seg(p, 0.17, 0.22)); // aparece el guion y el número se recentra
      // Orden: el cielo ya está detrás; el vídeo se apaga dentro de las letras (se ve el cielo en ellas)
      // y después la capa blanca se retira y el logo queda en blanco sobre el cielo.
      const skyIn = smooth(seg(p, 0.19, 0.22));
      const videoOut = smooth(seg(p, 0.21, 0.26));
      const toSky = smooth(seg(p, 0.26, 0.31));
      if (head) head.style.opacity = String(1 - videoOut);
      if (knock.current) knock.current.style.opacity = String(knockIn * (1 - toSky));
      if (knockText.current) knockText.current.style.transform = `scale(${scale})`;
      [usA.current, usB.current].forEach((u) => u && (u.style.width = `${usW * us}em`));

      // 3 · Cielo con nubes detrás y el logo en blanco.
      const zoom = smooth(seg(p, 0.32, 0.47)); // zoom out hacia el busto y el slogan
      const skyOut = smooth(seg(p, 0.62, 0.78));
      if (sky.current) {
        sky.current.style.opacity = String(skyIn * (1 - skyOut));
        sky.current.style.transform = `scale(${lerp(1.25, 1, zoom)})`;
      }
      const skyVisible = skyIn > 0 && skyOut < 1;
      setSkyOn((v) => (v === skyVisible ? v : skyVisible));
      const logoOut = smooth(seg(p, 0.32, 0.4));
      if (logo.current) {
        logo.current.style.opacity = String(toSky * (1 - logoOut));
        logo.current.style.transform = `scale(${lerp(1, 0.45, logoOut)})`;
      }

      // 4 · Busto en el centro y el slogan a gran tamaño alrededor.
      const bustIn = smooth(seg(p, 0.34, 0.44));
      const burst = seg(p, 0.58, 0.8);
      if (bust.current) {
        bust.current.style.opacity = String(burst > 0 ? 0 : bustIn);
        bust.current.style.transform = `translate(-50%,-50%) scale(${lerp(1.45, 1, easeOut(bustIn))})`;
      }
      const sloganIn = smooth(seg(p, 0.33, 0.47)), sloganOut = smooth(seg(p, 0.58, 0.64));
      if (slogan.current) {
        slogan.current.style.opacity = String(sloganIn * (1 - sloganOut));
        slogan.current.style.transform = `scale(${lerp(1.35, 1, easeOut(sloganIn)) * lerp(1, 1.08, sloganOut)})`;
        slogan.current.querySelectorAll<HTMLElement>("[data-from]").forEach((el) => {
          const [dx, dy] = (el.dataset.from ?? "0,0").split(",").map(Number);
          const k = 1 - easeOut(sloganIn);
          el.style.transform = `translate(${dx * k * 20}vw, ${dy * k * 20}vh)`;
        });
      }

      // Cámara: se pide al aparecer el busto y se pausa fuera de su tramo.
      const c = camRef.current;
      if (p > 0.36 && p < 0.6 && inView) {
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
        tiles.forEach((t, i) => {
          const card = cards.current[i];
          if (!card) return;
          const cr = card.getBoundingClientRect();
          const k = smooth(clamp((burst - (i % 5) * 0.06) / 0.7, 0, 1));
          const sx = fx0 + t.col * fw + fw / 2, sy = fy0 + t.row * fh + fh / 2;
          const tx = cr.left - sr.left + cr.width / 2, ty = cr.top - sr.top + cr.height / 2;
          const x = lerp(sx, tx, k), y = lerp(sy, ty, k), z = Math.sin(Math.PI * k) * 200;
          const w = lerp(fw, cr.width, k), h = lerp(fh, cr.height, k);
          const flip = 180 * smooth(clamp((k - 0.15) / 0.7, 0, 1));
          t.el.style.width = `${w}px`;
          t.el.style.height = `${h}px`;
          t.el.style.transform = `translate3d(${x - w / 2}px,${y - h / 2}px,${z}px) rotateY(${flip}deg)`;
          const op = String(lerp(1, Number(card.style.opacity || 1), k));
          t.front.style.opacity = op;
          t.back.style.opacity = op;
          t.el.style.zIndex = String(Math.round(lerp(50, Number(card.style.zIndex || 50), k)));
          // La cara A muestra exactamente el trozo que ocupaba en el busto.
          t.front.style.backgroundSize = `${(bw * w) / fw}px ${(bh * h) / fh}px`;
          t.front.style.backgroundPosition = `${(-(sx - fw / 2 - bx) * w) / fw}px ${(-(sy - fh / 2 - by) * h) / fh}px`;
        });
      }
      if (projectsEl.current) {
        projectsEl.current.style.opacity = formed ? "1" : "0";
        projectsEl.current.style.pointerEvents = formed ? "auto" : "none";
      }

      // 6 · "PROYECTOS_"
      const ttl = seg(p, 0.8, 0.88);
      title.current?.querySelectorAll<HTMLElement>("[data-char]").forEach((s, i) => {
        const k = easeOut(clamp((ttl - i * 0.06) / 0.4, 0, 1));
        s.style.transform = `translateY(${110 * (1 - k)}%)`;
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      tiles.forEach((t) => t.el.remove());
      camera.tracker?.stop();
      setReel({ active: false });
    };
  }, []);

  const titleChars = "Proyectos_".split("");

  return (
    <section ref={track} aria-label="Apertura" className="relative" style={{ height: `${TRACK_SVH}svh` }}>
      {/* Anclas de navegación dentro del recorrido */}
      <div id="proyectos" data-anchor aria-hidden className="pointer-events-none absolute left-0 w-px" style={{ top: `${PROJECTS_AT * (TRACK_SVH - 100)}svh` }} />

      <div ref={stage} className="sticky top-0 h-svh overflow-hidden bg-cloud">
        {/* Cielo (detrás de todo) */}
        <div ref={sky} aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,#2a5aa8_0%,#3a6dbd_60%,#5a8cd0_100%)] opacity-0">
          {skyOn && <CloudSky active={skyOn} />}
        </div>

        {/* Showreel */}
        <Hero managed />

        {/* El vídeo dentro de "2894" */}
        <div ref={knock} aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center bg-white opacity-0 mix-blend-screen">
          <div ref={knockText} className="text-[clamp(6rem,27vw,30rem)] text-black">
            <Wordmark underscore={usA} />
          </div>
        </div>

        {/* Logo blanco sobre el cielo */}
        <div aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
          <div ref={logo} className="text-[clamp(6rem,27vw,30rem)] text-cloud opacity-0">
            <Wordmark underscore={usB} />
          </div>
        </div>

        {/* Slogan a pantalla completa alrededor del busto */}
        <div ref={slogan} className="pointer-events-none absolute inset-0 text-cloud opacity-0">
          <p className="sr-only">Una nueva forma de diseñar</p>
          <div aria-hidden className="absolute inset-0 px-[var(--gutter)] text-[clamp(3.4rem,15vw,9rem)] font-bold sm:text-[clamp(4rem,11vw,15rem)] uppercase leading-[0.86] tracking-[-0.055em]">
            <span data-from="0,-1" className="absolute inset-x-0 top-[3svh] block text-center">Una nueva</span>
            {/* En móvil "Forma de" va bajo la primera línea; en pantallas anchas, a los lados del busto. */}
            <span data-from="-1,0" className="absolute left-[var(--gutter)] top-[15svh] block sm:top-1/2 sm:-translate-y-1/2">Forma</span>
            <span data-from="1,0" className="absolute right-[var(--gutter)] top-[15svh] block sm:top-1/2 sm:-translate-y-1/2">de</span>
            <span data-from="0,1" className="absolute inset-x-0 bottom-[5svh] block text-center">diseñar</span>
          </div>
        </div>

        {/* Busto */}
        <div ref={bust} className="absolute left-1/2 top-1/2 opacity-0 will-change-transform">
          <HeadFollow src="/brand/head.webp" depth="/brand/head-depth.png" alt="Busto de 2894_: una cabeza azul con nubes" className="h-full w-full" target={look} />
        </div>

        {/* Aviso de la cámara */}
        {(cam === "asking" || cam === "on") && (
          <div className="absolute inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom,0px))] z-20 flex justify-center px-[var(--gutter)]">
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-full bg-white/70 px-4 py-2 text-center text-sm text-ink backdrop-blur-md">
              {cam === "asking" ? "Permite la cámara para que el busto te mire. La imagen se procesa en tu dispositivo y no se guarda." : "El busto te sigue con la cámara."}
              {cam === "on" && (
                <button type="button" onClick={stopCam} className="min-h-11 font-medium underline underline-offset-4">
                  Usar el ratón
                </button>
              )}
            </p>
          </div>
        )}

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
          <div className="relative mt-2 flex-1 lg:px-[var(--gutter)]">
            <ProjectSphere controlled cardsRef={cards} sizeClass="w-[min(92vw,66svh)]" />
          </div>
        </div>
      </div>
    </section>
  );
}

// Movimiento reducido: la misma historia, estática y en orden.
function StaticIntro() {
  return (
    <>
      <Hero />
      <section aria-label="Una nueva forma de diseñar" className="grid min-h-svh place-items-center gap-8 bg-[linear-gradient(180deg,#2a5aa8,#5a8cd0)] px-[var(--gutter)] py-16 text-center text-cloud">
        <p className="text-[clamp(3rem,12vw,10rem)] font-bold uppercase leading-[0.9] tracking-[-0.05em]">Una nueva forma de diseñar</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/head.webp" alt="Busto de 2894_: una cabeza azul con nubes" className="h-[60svh] w-auto" />
      </section>
      <Projects />
    </>
  );
}
