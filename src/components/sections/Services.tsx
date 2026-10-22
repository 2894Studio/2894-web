"use client";

import { useEffect, useRef, useState } from "react";
import GridScan from "@/components/GridScan";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { services } from "@/content/site";

const LAST = services.length - 1;
// Fondo de cada palabra: Discover = escáner sobre tinta; Apply = cielo claro; Grow = azul de marca.
const BG = [
  [11, 11, 13],
  [219, 232, 251],
  [10, 70, 255],
];
const DARK = [true, false, true];

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
  const brand = active === LAST; // sobre el azul de marca el acento es blanco

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
        </div>
      )}

      {!reduced && (
        <div aria-hidden className={`absolute inset-x-[var(--gutter)] top-8 z-10 transition-colors duration-700 ${dark ? "text-cloud" : "text-ink"}`}>
          <div className={`relative h-0.5 ${dark ? "bg-cloud/25" : "bg-ink/20"}`}>
            <div ref={fill} style={{ transform: "scaleX(0)" }} className={`absolute inset-0 origin-left ${brand ? "bg-cloud" : dark ? "bg-sky" : "bg-cobalt"}`} />
          </div>
          <div className="mt-3 flex justify-between text-sm font-medium uppercase tracking-wide">
            {services.map((s, i) => (
              <span key={s.key} className={i === active ? (brand ? "text-cloud underline underline-offset-4" : dark ? "text-sky" : "text-cobalt") : brand ? "" : "opacity-70"}>
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
              className={`flex shrink-0 flex-col items-center justify-center px-6 text-center ${reduced ? "min-h-[70svh] w-full" : "h-svh w-screen"} ${isDark ? "text-cloud" : "text-ink"}`}
              style={reduced ? { backgroundColor: `rgb(${BG[i].join(",")})` } : undefined}
            >
              <h3 aria-label={s.key} className="flex overflow-hidden text-[clamp(4rem,18vw,20rem)] font-light uppercase leading-[0.95] tracking-[-0.05em]">
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
                className="mt-6 max-w-xl text-lg font-medium sm:text-xl transition-[transform,opacity] duration-700 ease-out"
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
