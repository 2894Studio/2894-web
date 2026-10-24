"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Dos formas de pasar de una escena a otra, en evaluación:
// - fade: la escena nueva aparece en el mismo sitio con un fundido; la anterior sube, se desenfoca y se desvanece.
// - parallax: el scroll es continuo; la escena que sale se queda atrás (más lenta, pequeña y desenfocada).
export type Transition = "fade" | "parallax";
export const TRANSITIONS: { key: Transition; label: string }[] = [
  { key: "fade", label: "Fundido" },
  { key: "parallax", label: "Parallax" },
];
const KEY = "2894-transition";
const EVENT = "transition-change";

const readMode = (): Transition => {
  try {
    const q = new URLSearchParams(window.location.search).get("t");
    const v = q ?? window.localStorage.getItem(KEY);
    return v === "parallax" ? "parallax" : "fade";
  } catch {
    return "fade";
  }
};
const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
};
export const useTransition = () => useSyncExternalStore(subscribe, readMode, () => "fade" as Transition);
export const setTransition = (t: Transition) => {
  try {
    window.localStorage.setItem(KEY, t);
    const url = new URL(window.location.href);
    url.searchParams.delete("t");
    window.history.replaceState(null, "", url);
  } catch {}
  window.dispatchEvent(new Event(EVENT));
};

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

// Encadena las escenas como un vídeo guiado por el scroll.
// Al soltar el scroll a mitad de una transición, encaja suavemente en la escena más cercana.
export function SceneStack({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const mode = useTransition();
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !root.current) return;
    const scenes = gsap.utils.toArray<HTMLElement>("[data-scene]", root.current);
    const contents = scenes.map((s) => s.querySelector<HTMLElement>("[data-scene-content]")!);
    const fade = mode === "fade";
    const vh = () => window.innerHeight;

    // Fundido: cada escena queda fija (sticky) cuando su final llega al borde inferior, para que la siguiente
    // aparezca encima en el mismo sitio. Se usa sticky y no el pin de GSAP: el pin deja un transform que
    // rompería los pines internos (Servicios).
    const stick = () =>
      scenes.forEach((s, i) => {
        s.style.zIndex = String(i + 1);
        if (!fade) return;
        s.style.position = "sticky";
        s.style.top = `${Math.min(0, vh() - s.offsetHeight)}px`;
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
              scene.style.transform = scene.style.opacity = "";
              return;
            }
            const e = p * p * (3 - 2 * p);
            if (fade) {
              // La nueva escena se queda en su sitio (compensa el scroll) y aparece con un fundido.
              scene.style.transform = `translate3d(0,${-vh() * (1 - p)}px,0)`;
              scene.style.opacity = String(e);
              inn.style.transform = `translate3d(0,${40 * (1 - e)}px,0)`;
              out.style.transform = `translate3d(0,${-48 * e}px,0)`;
              out.style.filter = `blur(${6 * e}px)`;
              out.style.opacity = String(1 - e);
            } else {
              // La saliente avanza a media velocidad, se reduce y desenfoca; la nueva entra con su propio desfase.
              out.style.transformOrigin = `50% ${prev.offsetHeight - vh() / 2}px`;
              out.style.transform = `translate3d(0,${vh() * 0.5 * p}px,0) scale(${1 - 0.05 * e})`;
              out.style.filter = `blur(${4 * e}px)`;
              out.style.opacity = String(1 - 0.7 * e);
              inn.style.transform = `translate3d(0,${-vh() * 0.12 * (1 - p)}px,0)`;
            }
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
        s.style.position = s.style.top = s.style.zIndex = s.style.transform = s.style.opacity = "";
      });
      contents.forEach(clear);
      ScrollTrigger.refresh();
    };
  }, [reduced, mode]);

  return <div ref={root}>{children}</div>;
}

// Selector temporal para comparar transiciones (solo en vistas previas: NEXT_PUBLIC_TRANSITION_PICKER=1).
export function TransitionPicker() {
  const mode = useTransition();
  if (process.env.NEXT_PUBLIC_TRANSITION_PICKER !== "1") return null;
  return (
    <div role="group" aria-label="Transición entre secciones" className="fixed right-3 top-3 z-50 flex gap-1 rounded-full bg-cloud/90 p-1 text-sm shadow-lg backdrop-blur">
      {TRANSITIONS.map((t) => (
        <button
          key={t.key}
          type="button"
          aria-pressed={mode === t.key}
          onClick={() => setTransition(t.key)}
          className={`min-h-11 rounded-full px-4 font-medium ${mode === t.key ? "bg-cobalt text-cloud" : "text-ink hover:bg-ink/5"}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
