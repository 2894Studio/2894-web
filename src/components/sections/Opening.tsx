"use client";

import { useEffect, useRef, useState } from "react";
import { CloudSky } from "@/components/CloudSky";
import { ProjectBrowser } from "@/components/ProjectBrowser";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { getReel, reel as reelCtl, setReel } from "@/lib/reel";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { SphereItem } from "@/lib/projects";
import { studio } from "@/content/site";

// Apertura: showreel con el cielo de nubes por debajo → Proyectos, en una sola escena guiada por el scroll.
// "El vídeo es el primer proyecto": el vídeo se encoge sobre el cielo hasta el tamaño de una ficha y vuela a su
// sitio en la esfera; el cielo pasa a blanco y aparecen las demás fichas.
const TRACK_SVH = 320;
const PROJECTS_AT = 0.62; // la esfera ya está formada (destino del ancla #proyectos)
const SKY = "linear-gradient(180deg,#0a62ae 0%,#0b84ca 58%,#4ea6d8 100%)";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function Opening({ items }: { items: SphereItem[] }) {
  const reduced = useReducedMotion();
  if (reduced)
    return (
      <>
        <Hero />
        <Projects items={items} />
      </>
    );
  return <ScrollOpening items={items} />;
}

function ScrollOpening({ items }: { items: SphereItem[] }) {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const projectsEl = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [skyOn, setSkyOn] = useState(true);

  useEffect(() => {
    const st = stage.current, tr = track.current;
    if (!st || !tr) return;
    let raf = 0, inView = true, muteCalled = false;
    const io = new IntersectionObserver(([e]) => (inView = e.isIntersecting));
    io.observe(tr);
    const header = () => st.querySelector<HTMLElement>("[data-reel-header]");
    const frameEl = () => st.querySelector<HTMLElement>("[data-reel-frame]");
    // Solo en móvil en vertical el vídeo horizontal no se recorta: se ve entero, centrado, con el estudio
    // presentado encima y debajo. Su hueco es el elemento [data-reel-slot]; desde él arranca el vuelo hacia la ficha.
    const vertical = window.matchMedia("(max-width: 640px) and (max-aspect-ratio: 87/100)");

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!inView) return;
      const r = tr.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - window.innerHeight), 0, 1);
      const W = st.clientWidth, H = st.clientHeight;
      const head = header(), fr = frameEl();
      if (!st.dataset.ready) st.dataset.ready = "1";
      setReel({ active: p < 0.03 }); // play/pausa en la barra solo al principio
      // El sonido se apaga (con fundido) al dejar de ver el showreel: así nunca queda sonando sin control a la vista.
      if (p > 0.16) {
        if (!muteCalled && !getReel().muted) {
          muteCalled = true;
          reelCtl.mute();
        }
      } else muteCalled = false;

      // 1 · Se enmarca: aparece el cielo alrededor del vídeo.
      const a = smooth(seg(p, 0, 0.12));
      const inset = a * clamp(W * 0.07, 24, 110);
      const radius = a * 40;

      if (head && fr) {
        // 2 · El vídeo vuela hasta la ficha del primer proyecto (la sigue aunque la esfera gire).
        const f = easeInOut(seg(p, 0.14, 0.5));
        const card = cards.current[0];
        const sr = st.getBoundingClientRect();
        const cr = card?.getBoundingClientRect();
        const tx = cr ? cr.left - sr.left : W / 2, ty = cr ? cr.top - sr.top : H / 2;
        const tw = cr ? cr.width : 0, th = cr ? cr.height : 0;
        // Rectángulo de partida: pantalla enmarcada (horizontal) o el hueco centrado del vídeo entero (vertical).
        let x0 = inset, y0 = inset, w0 = W - 2 * inset, h0 = H - 2 * inset, r0 = radius;
        const slot = vertical.matches ? st.querySelector<HTMLElement>("[data-reel-slot]") : null;
        if (slot) {
          const b = slot.getBoundingClientRect();
          x0 = b.left - sr.left;
          y0 = b.top - sr.top;
          w0 = b.width;
          h0 = b.height;
          r0 = 14;
        }
        const x = lerp(x0, tx, f), y = lerp(y0, ty, f);
        const w = lerp(w0, tw, f), h = lerp(h0, th, f);
        Object.assign(head.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px`, right: "auto", bottom: "auto", padding: "0" });
        fr.style.borderRadius = `${lerp(r0, 6, f)}px`;
        // Al posarse, el vídeo se funde con la ficha.
        const land = smooth(seg(p, 0.5, 0.58));
        head.style.opacity = String(1 - land);
        head.style.visibility = land >= 1 ? "hidden" : "";
      }

      // Presentación en vertical: se desvanece y sube un poco al empezar el scroll.
      if (intro.current) {
        const k = smooth(seg(p, 0.01, 0.1));
        intro.current.querySelectorAll<HTMLElement>("[data-fade]").forEach((el) => {
          el.style.opacity = String(1 - k);
          el.style.transform = `translateY(${-28 * k}px)`;
        });
      }

      // 3 · El cielo se desvanece a blanco.
      if (sky.current) {
        const s = sky.current.style;
        const out = smooth(seg(p, 0.36, 0.56));
        s.opacity = String(1 - out);
        const visible = Number(s.opacity) > 0.001;
        setSkyOn((v) => (v === visible ? v : visible));
      }

      // 4 · Proyectos: las fichas aparecen alrededor del vídeo.
      if (projectsEl.current) {
        const pe = projectsEl.current.style;
        const k = smooth(seg(p, 0.3, 0.52));
        pe.opacity = String(k);
        pe.pointerEvents = k > 0.95 ? "auto" : "none";
      }
      const ttl = seg(p, 0.52, 0.62);
      title.current?.querySelectorAll<HTMLElement>("[data-char]").forEach((sp, i) => {
        const kk = smooth(clamp((ttl - i * 0.06) / 0.4, 0, 1));
        sp.style.transform = `translateY(${110 * (1 - kk)}%)`;
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      setReel({ active: false });
    };
  }, []);

  const titleChars = "Proyectos_".split("");
  return (
    <section ref={track} id="top" aria-label="Showreel y proyectos" className="relative" style={{ height: `${TRACK_SVH}svh` }}>
      <div id="proyectos" data-anchor aria-hidden className="pointer-events-none absolute left-0 w-px" style={{ top: `${PROJECTS_AT * (TRACK_SVH - 100)}svh` }} />
      <div ref={stage} data-reel-stage className="sticky top-0 h-svh overflow-hidden bg-cloud">
        {/* Cielo con nubes por debajo del vídeo */}
        <div ref={sky} aria-hidden className="absolute inset-0" style={{ backgroundImage: SKY }}>
          <CloudSky active={skyOn} lit="#f6f3ea" shade="#a7b7cc" />
        </div>

        {/* Proyectos (debajo del vídeo mientras vuela) */}
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
          <div className="relative mt-6 min-h-0 flex-1 sm:mt-2 lg:px-[var(--gutter)]">
            <ProjectBrowser items={items} controlled cardsRef={cards} sizeClass="w-[min(92vw,66svh)]" />
          </div>
        </div>

        {/* Vertical: presentación del estudio y hueco para el vídeo entero (en horizontal esto no se ve) */}
        <div ref={intro} aria-hidden className="reel-intro pointer-events-none absolute inset-0 z-[5] flex-col justify-center gap-6 px-[var(--gutter)] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-8 text-cloud">
          <div data-fade className="will-change-transform">
            <p className="text-[clamp(4.5rem,24vw,8rem)] font-bold leading-none tracking-tighter">
              2894<span className="blink">_</span>
            </p>
            <p className="mt-2 text-lg font-light">Estudio multidisciplinar de IA aplicada al Diseño</p>
          </div>
          <div data-reel-slot className="aspect-video w-full" />
          <p data-fade className="flex items-center gap-2 text-sm will-change-transform">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce">
              <path d="M12 5v14M6 13l6 6 6-6" />
            </svg>
            Desliza para ver proyectos
          </p>
        </div>

        {/* El título principal vive aquí (no dentro del vídeo, que se oculta al hacer scroll) */}
        <h1 className="sr-only">2894_ Studio: {studio.headline}</h1>

        {/* Showreel */}
        <div className="pointer-events-none absolute inset-0 z-10 [&>header]:pointer-events-auto">
          <Hero managed />
        </div>
      </div>
    </section>
  );
}
