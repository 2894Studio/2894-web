"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CloudSky } from "@/components/CloudSky";
import GridScan from "@/components/GridScan";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { applyImages, services } from "@/content/site";

const LAST = services.length - 1;
// Fondo de cada palabra: Discover = escáner sobre tinta; Apply = cielo claro; Grow = cielo de Magritte con nubes.
const BG = [
  [11, 11, 13],
  [219, 232, 251],
  [120, 166, 222],
];
const DARK = [true, false, false];

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

// Discover. Apply. Grow. como recorrido horizontal: el scroll vertical pasa de una palabra a otra y cambia el mundo de fondo.
export function Services() {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const bg = useRef<HTMLDivElement>(null);
  const scanLayer = useRef<HTMLDivElement>(null);
  const skyLayer = useRef<HTMLDivElement>(null);
  const shots = useRef<(HTMLDivElement | null)[]>([]);
  const [sky, setSky] = useState(false);
  const [active, setActive] = useState(0);
  const [near, setNear] = useState(false);

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
      if (scanLayer.current) scanLayer.current.style.opacity = String(0.6 * (1 - smooth(0.2, 0.5, x)));
      if (skyLayer.current) skyLayer.current.style.opacity = String(smooth(1.3, 1.7, x));
      setSky(x > 1.2);
      // Apply: cada imagen se descubre desde abajo según avanza el recorrido y se va al pasar a Grow.
      shots.current.forEach((el, k) => {
        if (!el) return;
        const t = smooth(0.45 + k * 0.08, 0.7 + k * 0.08, x) * (1 - smooth(1.3, 1.55, x));
        el.style.clipPath = `inset(${(1 - t) * 100}% 0 0 0 round 16px)`;
        el.style.transform = `translate3d(${(1 - x) * SLOTS[k].d * 120}px, 0, 0) scale(${1.15 - 0.15 * t})`;
      });
      if (fill.current) fill.current.style.transform = `scaleX(${p})`;
      setActive(Math.min(LAST, Math.round(x)));
    };
    const ctx = gsap.context(() => {
      gsap.to(track.current, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${dist() * 1.3}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => paint(self.progress),
        },
      });
    }, section);
    paint(0);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  const dark = DARK[active];
  const brand = active === LAST; // sobre el cielo el acento es la tinta

  return (
    <section ref={section} id="servicios" aria-labelledby="servicios-h" className="relative overflow-hidden">
      <h2 id="servicios-h" className="sr-only">
        Discover. Apply. Grow.
      </h2>

      {!reduced && (
        <div ref={bg} aria-hidden className="absolute inset-0" style={{ backgroundColor: "rgb(11,11,13)" }}>
          <div ref={scanLayer} className="absolute inset-0" style={{ opacity: 0.6 }}>
            {near && (
              <GridScan linesColor="#4d4757" scanColor="#7dd3fc" cells={8} depth={3} scanDuration={2.4} scanDelay={1.6} clickEffect="ping" dpr={1.5} />
            )}
          </div>
          <div ref={skyLayer} className="absolute inset-0 bg-[linear-gradient(180deg,#4f88d0_0%,#7aa9e0_45%,#cfe3f7_100%)]" style={{ opacity: 0 }}>
            {near && <CloudSky active={sky} />}
          </div>
        </div>
      )}

      {!reduced && (
        <div aria-hidden className={`absolute inset-x-[var(--gutter)] top-8 z-10 transition-colors duration-700 ${dark ? "text-cloud" : "text-ink"}`}>
          <div className={`relative h-0.5 ${dark ? "bg-cloud/25" : "bg-ink/20"}`}>
            <div ref={fill} style={{ transform: "scaleX(0)" }} className={`absolute inset-0 origin-left ${brand ? "bg-ink" : dark ? "bg-sky" : "bg-cobalt"}`} />
          </div>
          <div className="mt-3 flex justify-between text-sm font-medium uppercase tracking-wide">
            {services.map((s, i) => (
              <span key={s.key} className={i === active ? (brand ? "underline underline-offset-4" : dark ? "text-sky" : "text-cobalt") : "opacity-70"}>
                {s.key}
              </span>
            ))}
          </div>
        </div>
      )}

      <div ref={track} className={`relative ${reduced ? "flex flex-col" : "flex h-svh w-max"}`}>
        {services.map((s, i) => {
          const on = reduced || i === active;
          const isDark = DARK[i];
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
                    className="absolute aspect-[4/5] overflow-hidden rounded-2xl will-change-transform"
                    style={{ left: SLOTS[k].l, top: SLOTS[k].t, width: SLOTS[k].w, clipPath: "inset(100% 0 0 0)" }}
                  >
                    <Image src={img.src} alt="" fill sizes="15vw" className="object-cover" />
                  </div>
                ))}
              {/* Margen interno en la máscara para que ninguna letra (p. ej. la Y) quede cortada. */}
              <h3 aria-label={s.key} className="relative flex overflow-hidden px-[0.04em] pb-[0.14em] pt-[0.08em] text-[clamp(4rem,18vw,20rem)] font-light uppercase leading-none tracking-[-0.05em]">
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
                className="relative mt-2 max-w-xl text-lg font-medium sm:text-xl transition-[transform,opacity] duration-700 ease-out"
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
