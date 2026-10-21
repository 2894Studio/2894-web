"use client";

import { useEffect, useRef, useState } from "react";
import { Magnetic } from "@/components/Magnetic";
import { nav } from "@/content/site";

// Pastilla inferior: se oculta al bajar y reaparece al subir (el scroll gobierna la navegación).
export function Navbar() {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const d = y - last.current;
      if (y < 80) setHidden(false);
      else if (Math.abs(d) > 6) setHidden(d > 0);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = nav.slice(0, -1);
  const cta = nav[nav.length - 1];
  const away = hidden && !open;

  return (
    <>
      <nav
        aria-label="Principal"
        data-hidden={away}
        className="fixed bottom-5 left-1/2 z-50 hidden -translate-x-1/2 transition-[transform,opacity] duration-700 ease-[cubic-bezier(.16,1,.3,1)] data-[hidden=true]:pointer-events-none data-[hidden=true]:translate-y-24 data-[hidden=true]:opacity-0 sm:block"
      >
        <ul className="flex items-center gap-1 rounded-full border border-ink/10 bg-cloud/85 p-1.5 backdrop-blur-xl">
          <li className="pl-4 pr-3 text-sm font-bold">
            2894<span className="text-cobalt">_</span>
          </li>
          {links.map((item) => (
            <li key={item.href}>
              <Magnetic strength={0.25}>
                <a href={item.href} className="spring inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium hover:bg-ink hover:text-cloud focus-visible:outline-2 focus-visible:outline-cobalt">
                  {item.label}
                </a>
              </Magnetic>
            </li>
          ))}
          <li>
            <Magnetic strength={0.25}>
              <a href={cta.href} className="spring inline-flex min-h-11 items-center rounded-full bg-cobalt px-5 text-sm font-medium text-cloud hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt">
                {cta.label}
              </a>
            </Magnetic>
          </li>
        </ul>
      </nav>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-movil"
        data-hidden={away}
        onClick={() => setOpen((o) => !o)}
        className="spring fixed bottom-4 right-4 z-[60] min-h-11 rounded-full bg-cobalt px-5 text-sm font-medium uppercase text-cloud transition-[opacity,translate] duration-700 data-[hidden=true]:pointer-events-none data-[hidden=true]:translate-y-24 data-[hidden=true]:opacity-0 sm:hidden"
      >
        {open ? "Cerrar" : "Menu +"}
      </button>

      <div id="menu-movil" hidden={!open} className="fixed inset-0 z-50 flex flex-col justify-end bg-cobalt px-[var(--gutter)] pb-24 text-cloud sm:hidden">
        <ul className="space-y-1">
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setOpen(false)} className="block py-1 text-5xl font-light uppercase tracking-[-0.04em] hover:text-sky">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
