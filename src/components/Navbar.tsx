"use client";

import { useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/lenis";
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

// Pastilla inferior siempre visible (escritorio) que marca la sección actual; "MENU +" a pantalla completa en móvil.
export function Navbar() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();
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
      <nav aria-label="Principal" className="fixed bottom-5 left-1/2 z-50 hidden -translate-x-1/2 sm:block">
        <ul className="flex items-center gap-1 rounded-full border border-white/40 bg-cloud/85 p-1.5 shadow-[0_10px_40px_rgb(10_70_255/0.25)] backdrop-blur-xl">
          <li>
            <a href="#top" aria-label="2894_, volver al inicio" className="inline-flex min-h-11 items-center rounded-full pl-4 pr-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-cobalt">
              2894_
            </a>
          </li>
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
      </nav>

      <button
        ref={toggle}
        type="button"
        aria-expanded={open}
        aria-controls="menu-movil"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-[60] min-h-11 rounded-full bg-cobalt px-5 text-sm font-medium uppercase text-cloud shadow-[0_10px_30px_rgb(10_70_255/0.35)] sm:hidden"
      >
        {open ? "Cerrar" : "Menu +"}
      </button>

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
