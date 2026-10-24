"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { useReducedMotion } from "@/lib/useReducedMotion";

const RADIUS = 48;

// Una escena: capa a pantalla completa que tapa a la anterior con una cortinilla de bordes redondeados.
export function Scene({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div data-scene className={`relative overflow-clip bg-cloud ${className}`}>
      <div data-scene-content>{children}</div>
      <div data-scene-shade aria-hidden className="pointer-events-none absolute inset-0 z-40 bg-ink opacity-0" />
    </div>
  );
}

// Encadena las escenas como un vídeo: la saliente queda fija, se aleja y se oscurece mientras la siguiente sube.
// Al soltar el scroll a mitad de una transición, encaja suavemente en la escena más cercana.
export function SceneStack({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !root.current) return;
    const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]", root.current);
    // Cada escena queda fija (sticky) cuando su final llega al borde inferior; la siguiente sube por encima.
    // Se usa sticky y no el pin de GSAP: un pin deja un transform que rompería los pines internos (Servicios).
    const stick = () =>
      scenes.forEach((s, i) => {
        s.style.position = "sticky";
        s.style.zIndex = String(i + 1);
        s.style.top = `${Math.min(0, window.innerHeight - s.offsetHeight)}px`;
      });
    // ScrollTrigger mide con las escenas en su sitio natural y después se vuelven a fijar.
    const unstick = () => scenes.forEach((s) => (s.style.position = s.style.top = ""));
    stick();
    ScrollTrigger.addEventListener("refreshInit", unstick);
    ScrollTrigger.addEventListener("refresh", stick);
    const ctx = gsap.context(() => {
      scenes.forEach((scene, i) => {
        const prev = scenes[i - 1];
        if (!prev) return;
        const content = prev.querySelector<HTMLElement>("[data-scene-content]")!;
        const shade = prev.querySelector<HTMLElement>("[data-scene-shade]")!;
        ScrollTrigger.create({
          trigger: scene,
          start: "top bottom",
          end: "top top",
          onUpdate: ({ progress: p }) => {
            // Cortinilla de entrada: el borde superior redondeado se aplana al llegar arriba.
            const r = RADIUS * (1 - p);
            scene.style.borderRadius = r > 0.5 ? `${r}px ${r}px 0 0` : "";
            // La saliente se aleja y se oscurece. Sin transform en reposo: los `fixed` internos siguen referidos a la ventana.
            content.style.transform = p > 0 && p < 1 ? `scale(${1 - 0.06 * p})` : p >= 1 ? "scale(0.94)" : "";
            content.style.transformOrigin = `50% ${prev.offsetHeight - window.innerHeight / 2}px`;
            shade.style.opacity = String(0.55 * p);
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
      ScrollTrigger.removeEventListener("refreshInit", unstick);
      ScrollTrigger.removeEventListener("refresh", stick);
      ctx.revert();
      scenes.forEach((s) => {
        s.style.position = s.style.top = s.style.zIndex = s.style.borderRadius = "";
      });
    };
  }, [reduced]);

  return <div ref={root}>{children}</div>;
}
