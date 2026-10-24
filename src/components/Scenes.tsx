"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Una escena: una sección a pantalla completa.
export function Scene({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div data-scene className={`relative overflow-clip bg-cloud ${className}`}>
      <div data-scene-content>{children}</div>
    </div>
  );
}

const clear = (el: HTMLElement) => {
  el.style.transform = el.style.opacity = el.style.filter = el.style.transformOrigin = "";
};

// Encadena las escenas como un vídeo guiado por el scroll, con parallax: la escena que sale avanza a media
// velocidad, se reduce y se desenfoca; la nueva entra con su propio desfase.
// Al soltar el scroll a mitad de una transición, encaja suavemente en la escena más cercana.
export function SceneStack({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !root.current) return;
    const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]", root.current);
    const contents = scenes.map((s) => s.querySelector<HTMLElement>("[data-scene-content]")!);
    const vh = () => window.innerHeight;
    scenes.forEach((s, i) => (s.style.zIndex = String(i + 1)));

    const ctx = gsap.context(() => {
      scenes.forEach((scene, i) => {
        const prev = scenes[i - 1];
        if (!prev) return;
        const out = contents[i - 1];
        const inn = contents[i];
        ScrollTrigger.create({
          trigger: scene,
          start: "top bottom",
          end: "top top",
          onUpdate: ({ progress: p }) => {
            // En reposo no queda ningún transform: los `fixed` internos siguen referidos a la ventana.
            if (p <= 0 || p >= 1) {
              clear(out);
              clear(inn);
              return;
            }
            const e = p * p * (3 - 2 * p);
            out.style.transformOrigin = `50% ${prev.offsetHeight - vh() / 2}px`;
            if (i === 1) {
              // El showreel solo se queda atrás: su propio encuadre (se hace pequeño con bordes redondeados) sigue visible.
              out.style.transform = `translate3d(0,${vh() * 0.5 * p}px,0)`;
            } else {
              out.style.transform = `translate3d(0,${vh() * 0.5 * p}px,0) scale(${1 - 0.05 * e})`;
              out.style.filter = `blur(${4 * e}px)`;
              out.style.opacity = String(1 - 0.7 * e);
            }
            inn.style.transform = `translate3d(0,${-vh() * 0.12 * (1 - p)}px,0)`;
          },
        });
      });
    }, root);
    ScrollTrigger.refresh();

    // Encaje suave: solo dentro de las transiciones entre escenas; el scroll interno de cada escena es libre.
    let timer = 0;
    let snapping = false;
    const settle = () => {
      const lenis = getLenis();
      if (!lenis || snapping) return;
      // Mientras el scroll suave sigue en marcha (inercia o navegación por anclas) se espera a que termine.
      if (lenis.isScrolling) {
        timer = window.setTimeout(settle, 160);
        return;
      }
      const y = window.scrollY;
      const zone = ScrollTrigger.getAll().find((st) => scenes.includes(st.trigger as HTMLElement) && y > st.start + 2 && y < st.end - 2);
      if (!zone) return;
      const target = (y - zone.start) / (zone.end - zone.start) < 0.5 ? zone.start : zone.end;
      snapping = true;
      lenis.scrollTo(target, { duration: 0.8, easing: (t) => 1 - Math.pow(1 - t, 3), onComplete: () => (snapping = false) });
      window.setTimeout(() => (snapping = false), 1200);
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      if (!snapping) timer = window.setTimeout(settle, 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
      ctx.revert();
      scenes.forEach((s) => {
        s.style.zIndex = s.style.transform = s.style.opacity = "";
      });
      contents.forEach(clear);
      ScrollTrigger.refresh();
    };
  }, [reduced]);

  return <div ref={root}>{children}</div>;
}
