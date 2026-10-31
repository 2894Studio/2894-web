"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CloudSky, SKY_DEFAULTS, type SkyControls } from "@/components/CloudSky";
import { getLenis } from "@/lib/lenis";
import GridScan from "@/components/GridScan";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { applyImages, services } from "@/content/site";

const LAST = services.length - 1;
// Fondo de cada palabra: Discover = escáner sobre tinta; Apply = cielo claro; Grow = cielo azul con nubes.
const BG = [
  [247, 248, 250],
  [219, 232, 251],
  [58, 109, 189],
];
const DARK = [false, false, true];

// Posición de las imágenes alrededor de "Apply" (en % del panel) y su parallax propio.
const SLOTS = [
  { l: "6%", t: "12%", w: "clamp(7rem,15vw,15rem)", d: 1.4 },
  { l: "30%", t: "11%", w: "clamp(5rem,10vw,10rem)", d: 0.8 },
  { l: "74%", t: "10%", w: "clamp(6rem,13vw,13rem)", d: 1.2 },
  { l: "80%", t: "62%", w: "clamp(7rem,15vw,15rem)", d: 1.6 },
  { l: "52%", t: "74%", w: "clamp(5rem,10vw,10rem)", d: 0.9 },
  { l: "10%", t: "66%", w: "clamp(6rem,12vw,12rem)", d: 1.1 },
];

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Cielos para el panel de Grow (degradado de arriba abajo; el blanco del texto mantiene contraste en los tres).
const SKIES = [
  { key: "magritte", label: "Magritte", css: "linear-gradient(180deg,#2a5aa8 0%,#3a6dbd 60%,#5a8cd0 100%)" },
  { key: "atardecer", label: "Atardecer", css: "linear-gradient(180deg,#24305e 0%,#7a4f8a 55%,#c9736a 100%)" },
  { key: "noche", label: "Noche", css: "linear-gradient(180deg,#05081a 0%,#101d4a 60%,#1f3270 100%)" },
];

// Discover. Apply. Grow. como recorrido horizontal: el scroll vertical pasa de una palabra a otra y cambia el mundo de fondo.
export function Services() {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const scanLayer = useRef<HTMLDivElement>(null);
  const skyLayer = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLDivElement>(null);
  const cloudLayer = useRef<HTMLDivElement>(null);
  const shots = useRef<(HTMLDivElement | null)[]>([]);
  const [sky, setSky] = useState(false);
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);
  const skyControls = useRef<SkyControls>({ ...SKY_DEFAULTS });
  const [ctrl, setCtrl] = useState<SkyControls>({ ...SKY_DEFAULTS });
  const [skyKey, setSkyKey] = useState(SKIES[0].key);
  const [panelOpen, setPanelOpen] = useState(false);
  const pinST = useRef<ScrollTrigger | null>(null);
  const setControl = (k: keyof SkyControls, v: number) => {
    skyControls.current = { ...skyControls.current, [k]: v };
    setCtrl(skyControls.current);
  };
  // Las etiquetas de la barra de progreso llevan a cada palabra.
  const goTo = (i: number) => {
    const st = pinST.current;
    if (!st) return;
    const y = st.start + ((st.end - st.start) * i) / LAST;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo(0, y);
  };

  // El escáner (WebGL) solo se monta cuando la sección se acerca.
  useEffect(() => {
    if (reduced || !section.current) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: "100% 0px" });
    io.observe(section.current);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (reduced || !section.current || !track.current) return;
    const dist = () => track.current!.scrollWidth - window.innerWidth;
    const paint = (p: number) => {
      const x = p * LAST;
      const i = Math.min(LAST - 1, Math.floor(x));
      const c = mix(BG[i], BG[i + 1], smooth(0.35, 0.65, x - i));
      if (bg.current) bg.current.style.backgroundColor = `rgb(${c.join(",")})`;
      if (scanLayer.current) scanLayer.current.style.opacity = String(0.9 * (1 - smooth(0.2, 0.5, x)));
      const skyOn = String(smooth(1.3, 1.7, x));
      if (skyLayer.current) skyLayer.current.style.opacity = skyOn;
      if (cloudLayer.current) cloudLayer.current.style.opacity = skyOn;
      setSky(x > 1.2);
      // Apply: cada imagen entra creciendo desde su centro (con un leve rebote) y sale encogiéndose al pasar a Grow.
      shots.current.forEach((el, k) => {
        if (!el) return;
        const t = smooth(0.45 + k * 0.08, 0.7 + k * 0.08, x) * (1 - smooth(1.3, 1.55, x));
        const sc = t * (1 + 0.12 * Math.sin(Math.PI * t));
        el.style.transform = `translate3d(${(1 - x) * SLOTS[k].d * 120}px, 0, 0) scale(${sc})`;
        el.style.visibility = t > 0.001 ? "" : "hidden";
      });
      if (fill.current) fill.current.style.transform = `scaleX(${p})`;
      setActive(Math.min(LAST, Math.round(x)));
    };
    const ctx = gsap.context(() => {
      const tween = gsap.to(track.current, {
        x: () => -dist(),
        ease: "none",
        // Las nubes viven dentro del recorrido (grupo aislado sin el cielo): así el texto de Grow, en modo
        // diferencia, solo se invierte donde hay nube. Se contrarrestan para que parezcan fijas.
        onUpdate() {
          if (cloudLayer.current) cloudLayer.current.style.transform = `translate3d(${-Number(gsap.getProperty(track.current, "x"))}px,0,0)`;
          paint(this.progress());
        },
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${dist() * 1.3}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          // La barra de progreso solo aparece con la sección ya fijada en pantalla.
          onToggle: (self) => {
            if (!ruler.current) return;
            ruler.current.style.opacity = self.isActive ? "1" : "0";
            ruler.current.style.pointerEvents = self.isActive ? "auto" : "none";
          },
        },
      });
      pinST.current = tween.scrollTrigger ?? null;
    }, section);
    paint(0);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  const dark = DARK[active];
  const brand = active === LAST; // sobre el cielo azul el acento es blanco

  return (
    <section ref={section} id="servicios" aria-labelledby="servicios-h" className="relative overflow-hidden">
      <h2 id="servicios-h" className="sr-only">
        Discover. Apply. Grow.
      </h2>

      {!reduced && (
        <div ref={bg} aria-hidden className="absolute inset-0" style={{ backgroundColor: "rgb(11,11,13)" }}>
          <div ref={scanLayer} className="absolute inset-0" style={{ opacity: 0.9 }}>
            {near && (
              <GridScan lightMode linesColor="#86a9ec" scanColor="#0a46ff" cells={8} depth={3} scanDuration={2.4} scanDelay={1.6} clickEffect="ping" dpr={1.5} />
            )}
          </div>
          {/* Cielo de Grow (Magritte): azul profundo arriba, más claro abajo, sin llegar al blanco. */}
          <div ref={skyLayer} className="absolute inset-0 transition-[background] duration-700" style={{ opacity: 0, background: SKIES.find((k) => k.key === skyKey)?.css }} />
        </div>
      )}

      {!reduced && (
        <nav ref={ruler} aria-label="Discover, Apply, Grow" className={`absolute inset-x-[var(--gutter)] top-8 z-30 transition-[color,opacity] duration-700 ${dark ? "text-cloud" : "text-ink"}`} style={{ opacity: 0, pointerEvents: "none" }}>
          <div className={`relative h-0.5 ${dark ? "bg-cloud/25" : "bg-ink/20"}`}>
            <div ref={fill} style={{ transform: "scaleX(0)" }} className={`absolute inset-0 origin-left ${brand ? "bg-cloud" : dark ? "bg-sky" : "bg-cobalt"}`} />
          </div>
          <div className="mt-3 flex justify-between text-sm font-medium uppercase tracking-wide">
            {services.map((s, i) => (
              <button
                key={s.key}
                type="button"
                onClick={() => goTo(i)}
                aria-current={i === active ? "step" : undefined}
                className={`-mx-2 min-h-11 px-2 uppercase hover:underline hover:underline-offset-4 ${i === active ? (brand ? "underline underline-offset-4" : dark ? "text-sky" : "text-cobalt") : brand ? "" : "opacity-70"}`}
              >
                {s.key}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Grow: panel para jugar con el cielo, como en un laboratorio. */}
      {!reduced && active === LAST && (
        <div className="absolute bottom-[calc(96px+env(safe-area-inset-bottom,0px))] right-[var(--gutter)] z-20 w-[min(300px,calc(100vw-32px))] text-ink">
          <button
            type="button"
            aria-expanded={panelOpen}
            aria-controls="sky-panel"
            onClick={() => setPanelOpen((o) => !o)}
            className="spring ml-auto flex min-h-11 items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 text-sm font-medium backdrop-blur-lg"
          >
            {panelOpen ? "Cerrar" : "Ajustar el cielo"}
          </button>
          <div id="sky-panel" hidden={!panelOpen} className="mt-2 space-y-3 rounded-3xl border border-white/50 bg-white/75 p-4 text-sm backdrop-blur-lg">
            {([
              ["count", "Nubes", 1, 7, 1],
              ["size", "Tamaño", 0.6, 1.6, 0.05],
              ["wind", "Viento", 0, 4, 0.1],
              ["softness", "Bordes", 0.3, 1.8, 0.05],
            ] as const).map(([k, label, min, max, step]) => (
              <label key={k} className="grid grid-cols-[5.5rem_1fr_2.5rem] items-center gap-2">
                <span>{label}</span>
                <input type="range" min={min} max={max} step={step} value={ctrl[k]} onChange={(e) => setControl(k, Number(e.target.value))} className="accent-cobalt" />
                <span className="text-right tabular-nums">{k === "count" ? ctrl[k] : ctrl[k].toFixed(1)}</span>
              </label>
            ))}
            <div role="group" aria-label="Color del cielo" className="flex flex-wrap gap-1">
              {SKIES.map((k) => (
                <button key={k.key} type="button" aria-pressed={skyKey === k.key} onClick={() => setSkyKey(k.key)} className={`min-h-11 rounded-full px-3 ${skyKey === k.key ? "bg-ink text-cloud" : "bg-ink/5"}`}>
                  {k.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                skyControls.current = { ...SKY_DEFAULTS };
                setCtrl(skyControls.current);
                setSkyKey(SKIES[0].key);
              }}
              className="min-h-11 font-medium underline underline-offset-4"
            >
              Restablecer
            </button>
          </div>
        </div>
      )}

      <div ref={track} className={`relative ${reduced ? "flex flex-col" : "flex h-svh w-max"}`}>
        {!reduced && (
          <div ref={cloudLayer} aria-hidden className="absolute left-0 top-0 h-svh w-screen" style={{ opacity: 0 }}>
            {near && <CloudSky active={sky} controls={skyControls} />}
          </div>
        )}
        {services.map((s, i) => {
          const on = reduced || i === active;
          const isDark = DARK[i];
          // Grow: texto blanco en modo diferencia dentro del grupo de las nubes → blanco sobre el cielo, invertido donde pasa una nube.
          const blend = i === LAST && !reduced ? "text-cloud mix-blend-difference" : "";
          return (
            <div
              key={s.key}
              className={`relative flex shrink-0 flex-col items-center justify-center px-6 text-center ${reduced ? "min-h-[70svh] w-full" : "h-svh w-screen"} ${isDark ? "text-cloud" : "text-ink"}`}
              style={reduced ? { backgroundColor: `rgb(${BG[i].join(",")})` } : undefined}
            >
              {i === 1 && !reduced &&
                applyImages.map((img, k) => (
                  <div
                    key={img.src}
                    ref={(el) => {
                      shots.current[k] = el;
                    }}
                    aria-hidden
                    className="absolute aspect-[4/5] overflow-hidden will-change-transform"
                    style={{ left: SLOTS[k].l, top: SLOTS[k].t, width: SLOTS[k].w, transform: "scale(0)", visibility: "hidden" }}
                  >
                    <Image src={img.src} alt="" fill sizes="15vw" className="object-cover" />
                  </div>
                ))}
              {/* Margen interno en la máscara para que ninguna letra (p. ej. la Y) quede cortada. */}
              <h3 aria-label={s.key} className={`relative flex overflow-hidden ${blend} px-[0.04em] pb-[0.14em] pt-[0.08em] text-[clamp(4rem,18vw,20rem)] font-light uppercase leading-none tracking-[-0.05em]`}>
                {s.key.split("").map((ch, j) => (
                  <span
                    key={j}
                    aria-hidden
                    className="inline-block transition-[transform,opacity] duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)]"
                    style={{ transform: on ? "translateY(0)" : "translateY(105%)", opacity: on ? 1 : 0, transitionDelay: on ? `${j * 40}ms` : "0ms" }}
                  >
                    {ch}
                  </span>
                ))}
              </h3>
              <p
                className={`relative mt-2 max-w-xl text-lg font-medium sm:text-xl transition-[transform,opacity] duration-700 ease-out ${blend}`}
                style={{ transform: on ? "translateY(0)" : "translateY(16px)", opacity: on ? 1 : 0, transitionDelay: on ? "250ms" : "0ms" }}
              >
                {s.text}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
