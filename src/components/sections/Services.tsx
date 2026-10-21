"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { services } from "@/content/site";

const LAST = services.length - 1;

// Discover. Apply. Grow. como recorrido horizontal: el scroll vertical desplaza una palabra tras otra (referencia: Numa).
export function Services() {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (reduced || !section.current || !track.current) return;
    const dist = () => track.current!.scrollWidth - window.innerWidth;
    const ctx = gsap.context(() => {
      gsap.to(track.current, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: section.current,
          start: "top top",
          end: () => `+=${dist()}`,
          pin: true,
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (fill.current) fill.current.style.transform = `scaleX(${self.progress})`;
            setActive(Math.min(LAST, Math.round(self.progress * LAST)));
          },
        },
      });
    }, section);
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={section} id="servicios" aria-labelledby="servicios-h" className="relative overflow-hidden bg-cloud">
      <h2 id="servicios-h" className="sr-only">
        Discover. Apply. Grow.
      </h2>

      {!reduced && (
        <div aria-hidden className="absolute inset-x-[var(--gutter)] top-8 z-10">
          <div className="relative h-4 bg-[repeating-linear-gradient(to_right,var(--ink-black)_0_1px,transparent_1px_24px)] opacity-25" />
          <div className="relative mt-2 h-0.5 bg-ink/15">
            <div ref={fill} style={{ transform: "scaleX(0)" }} className="absolute inset-0 origin-left bg-cobalt" />
          </div>
          <div className="mt-3 flex justify-between text-sm font-medium uppercase tracking-wide">
            {services.map((s, i) => (
              <span key={s.key} className={`transition-colors duration-500 ${i === active ? "text-cobalt" : "text-ink/65"}`}>
                {s.key}
              </span>
            ))}
          </div>
        </div>
      )}

      <div ref={track} className={reduced ? "flex flex-col" : "flex h-svh w-max"}>
        {services.map((s) => (
          <div key={s.key} className={`relative flex shrink-0 items-center justify-center ${reduced ? "min-h-[70svh] w-full" : "h-svh w-screen"}`}>
            <h3 className="text-[clamp(4rem,19vw,21rem)] font-light uppercase leading-none tracking-[-0.05em]">
              {s.key}
              <span className="text-cobalt">.</span>
            </h3>
            <p className="absolute inset-x-6 bottom-12 mx-auto max-w-md text-center text-base">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
