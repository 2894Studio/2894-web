"use client";

import { useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/lenis";
import { Logo } from "@/components/Logo";
import { nav } from "@/content/site";

// Sección en pantalla: la última escena cuyo borde superior ya ha pasado la mitad de la ventana.
function useActiveSection() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const items = nav
      .map((n) => {
        const el = document.getElementById(n.href.slice(1));
        return el ? { href: n.href, scene: el.closest<HTMLElement>("[data-scene]") ?? el } : null;
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

// Se oculta al bajar y reaparece al subir (con margen para no parpadear); visible siempre arriba del todo y al final.
function useHideOnScroll() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY, acc = 0, raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY, d = y - last;
      last = y;
      acc = Math.sign(d) === Math.sign(acc) ? acc + d : d;
      const nearEnd = y + window.innerHeight >= document.documentElement.scrollHeight - 4;
      if (y < 80 || nearEnd || acc < -24) setHidden(false);
      else if (acc > 24) setHidden(true);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return hidden;
}

// Barra inferior de cristal: logo a la izquierda y secciones a la derecha (en móvil, "Menú" abre la lista a pantalla completa).
export function Navbar() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
  const scrolledAway = useHideOnScroll();
  const [focusInside, setFocusInside] = useState(false);
  const hidden = scrolledAway && !open && !focusInside;
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
        <div className="flex items-center justify-between gap-6 rounded-full border border-white/50 bg-white/60 p-1.5 shadow-[0_8px_32px_rgb(11_11_13/0.08),inset_0_1px_0_rgb(255_255_255/0.6)] backdrop-blur-lg backdrop-saturate-150">
          <a href="#top" aria-label="2894_, volver al inicio" className="inline-flex min-h-11 items-center rounded-full pl-4 pr-3 text-base font-bold focus-visible:outline-2 focus-visible:outline-cobalt">
            <Logo />
          </a>
          <ul className="hidden items-center gap-1 sm:flex">
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
            className="min-h-11 rounded-full bg-cobalt px-5 text-sm font-medium text-cloud sm:hidden"
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
