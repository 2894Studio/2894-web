"use client";

import { useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/lenis";
import { reel, useReel } from "@/lib/reel";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { Logo } from "@/components/Logo";
import { nav } from "@/content/site";

// Sección en pantalla: la última escena cuyo borde superior ya ha pasado la mitad de la ventana.
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const items = nav
      .map((n) => {
        const el = document.getElementById(n.href.slice(1));
        return el ? { href: n.href, scene: el.hasAttribute("data-anchor") ? el : (el.closest<HTMLElement>("[data-scene]") ?? el) } : null;
      })
      .filter((x) => x !== null);
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let cur: string | null = null;
      for (const it of items) if (it.scene.getBoundingClientRect().top <= mid) cur = it.href;
      setActive(cur);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return active;
}

// Se oculta mientras se baja y reaparece al subir o en cuanto se deja de hacer scroll (así nunca se "pierde");
// visible siempre arriba del todo y al final.
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY, acc = 0, raf = 0, idle = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY, d = y - last;
      last = y;
      acc = Math.sign(d) === Math.sign(acc) ? acc + d : d;
      // En el pie legal la barra se aparta para no taparlo.
      const legal = document.querySelector("[data-legal]");
      if (legal && legal.getBoundingClientRect().top < window.innerHeight - 40) return setHidden(true);
      if (y < 80 || acc < -24) setHidden(false);
      else if (acc > 24) setHidden(true);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
      clearTimeout(idle);
      idle = window.setTimeout(() => {
        acc = 0;
        const legal = document.querySelector("[data-legal]");
        if (!legal || legal.getBoundingClientRect().top >= window.innerHeight - 40) setHidden(false);
      }, 650);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return hidden;
}

const PlayIcon = ({ playing }: { playing: boolean }) => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="currentColor">
    {playing ? <path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z" /> : <path d="M8 5.2v13.6a.6.6 0 0 0 .9.5l10.6-6.8a.6.6 0 0 0 0-1L8.9 4.7a.6.6 0 0 0-.9.5z" />}
  </svg>
);
const SoundIcon = ({ muted }: { muted: boolean }) => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
  </svg>
);

// Barra inferior de cristal: logo, secciones y CTA. Mientras se ve el showreel lleva además play/pausa y sonido,
// que se pliegan tras el primer scroll.
export function Navbar() {
  const reelState = useReel();
  const reducedMotion = useReducedMotion();
  const player = reelState.active && !reducedMotion;
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const scrolledAway = useHideOnScroll();
  const [focusInside, setFocusInside] = useState(false);
  const hidden = scrolledAway && !open && !focusInside && !player;
  const toggle = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);

  // Menú móvil: detiene el scroll de fondo, lleva el foco dentro, Esc cierra y el foco vuelve al botón.
  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      lenis?.stop();
      document.body.style.overflow = "hidden";
      menu.current?.querySelector("a")?.focus();
    } else if (wasOpen.current) {
      toggle.current?.focus();
    }
    wasOpen.current = open;
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key !== "Tab") return;
      // Foco atrapado entre los enlaces del menú y el botón de cerrar.
      const items = [...(menu.current?.querySelectorAll("a") ?? []), toggle.current].filter(Boolean) as HTMLElement[];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : (i + 1) % items.length;
      e.preventDefault();
      items[next].focus();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lenis?.start();
    };
  }, [open]);

  const links = nav.slice(0, -1);
  const cta = nav[nav.length - 1];
  const current = (href: string) => (active === href ? ("location" as const) : undefined);

  return (
    <>
      <nav
        aria-label="Principal"
        onFocus={() => setFocusInside(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocusInside(false)}
        className={`fixed bottom-[calc(16px+env(safe-area-inset-bottom,0px))] left-1/2 z-[60] w-[min(760px,calc(100vw-32px))] -translate-x-1/2 transition-[translate,opacity] duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${hidden ? "pointer-events-none translate-y-[160%] opacity-0" : "translate-y-0 opacity-100"}`}
      >
        <div className="flex items-center gap-2 rounded-full border border-white/50 bg-white/60 p-1.5 shadow-[0_8px_32px_rgb(11_11_13/0.08),inset_0_1px_0_rgb(255_255_255/0.6)] backdrop-blur-lg backdrop-saturate-150">
          <a href="#top" aria-label="2894_, volver al inicio" className="inline-flex min-h-11 shrink-0 items-center rounded-full pl-4 pr-1 text-base font-bold focus-visible:outline-2 focus-visible:outline-cobalt">
            <Logo />
          </a>

          {/* Controles del showreel: visibles mientras se ve el vídeo; tras el primer scroll se pliegan y la barra
              se queda solo con la navegación (la transformación se ve: el hueco se cierra con suavidad). */}
          <div
            aria-hidden={!player}
            inert={!player}
            className={`flex shrink-0 items-center gap-1 overflow-hidden transition-[max-width,opacity,margin] duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${player ? "max-w-32 opacity-100" : "pointer-events-none -ml-2 max-w-0 opacity-0"}`}
          >
            <button
              type="button"
              onClick={reel.toggle}
              aria-label={reelState.playing ? "Pausar showreel" : "Reproducir showreel"}
              className="spring flex size-11 shrink-0 items-center justify-center rounded-full bg-ink text-cloud hover:bg-cobalt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              <PlayIcon playing={reelState.playing} />
            </button>
            <button
              type="button"
              onClick={reel.toggleSound}
              aria-label={reelState.muted ? "Activar sonido" : "Silenciar"}
              aria-pressed={!reelState.muted}
              className="spring flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-ink/[0.07] focus-visible:outline-2 focus-visible:outline-cobalt"
            >
              <SoundIcon muted={reelState.muted} />
            </button>
          </div>

          <ul className="ml-auto hidden items-center gap-1 sm:flex">
            {links.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  aria-current={current(item.href)}
                  className="relative inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors duration-300 hover:bg-ink hover:text-cloud focus-visible:outline-2 focus-visible:outline-cobalt aria-[current]:bg-ink/[0.07]"
                >
                  {item.label}
                  <span aria-hidden className={`absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-cobalt transition-[opacity,scale] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] ${active === item.href ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
                </a>
              </li>
            ))}
            <li>
              <a
                href={cta.href}
                aria-current={current(cta.href)}
                className="inline-flex min-h-11 items-center rounded-full bg-cobalt px-5 text-sm font-medium text-cloud transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
              >
                {cta.label}
              </a>
            </li>
          </ul>
          <button
            ref={toggle}
            type="button"
            aria-expanded={open}
            aria-controls="menu-movil"
            onClick={() => setOpen((o) => !o)}
            className="ml-auto min-h-11 rounded-full bg-cobalt px-5 text-sm font-medium text-cloud sm:hidden"
          >
            {open ? "Cerrar" : "Menú"}
          </button>
        </div>
      </nav>

      <div ref={menu} id="menu-movil" role="dialog" aria-modal="true" aria-label="Menú" hidden={!open} className="fixed inset-0 z-50 flex flex-col justify-end bg-cobalt px-[var(--gutter)] pb-24 text-cloud sm:hidden">
        <ul className="space-y-1">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                aria-current={current(item.href)}
                onClick={() => setOpen(false)}
                className="block py-1 text-5xl font-light uppercase tracking-[-0.04em] hover:text-sky aria-[current]:text-sky"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
