"use client";

import { useEffect, useState } from "react";
import { nav } from "@/content/site";

// Desktop: pastilla flotante inferior-centrada (referencia: mendesaltaren). Móvil: "MENU +" a pantalla completa.
export function Navbar() {
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <nav aria-label="Principal" className="fixed bottom-5 left-1/2 z-50 hidden -translate-x-1/2 sm:block">
        <ul className="flex items-center gap-1 rounded-full border border-white/40 bg-cloud/85 p-1.5 backdrop-blur-xl">
          <li className="pl-4 pr-3 text-sm font-bold">
            2894<span className="text-cobalt">_</span>
          </li>
          {links.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-ink hover:text-cloud focus-visible:outline-2 focus-visible:outline-cobalt"
              >
                {item.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={cta.href}
              className="inline-flex min-h-11 items-center rounded-full bg-cobalt px-5 text-sm font-medium text-cloud transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt"
            >
              {cta.label}
            </a>
          </li>
        </ul>
      </nav>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-movil"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-4 right-4 z-[60] min-h-11 rounded-full bg-cobalt px-5 text-sm font-medium uppercase text-cloud sm:hidden"
      >
        {open ? "Cerrar" : "Menu +"}
      </button>

      <div id="menu-movil" hidden={!open} className="fixed inset-0 z-50 flex flex-col justify-end bg-cobalt px-[var(--gutter)] pb-24 text-cloud sm:hidden">
        <ul className="space-y-1">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-1 text-5xl font-light uppercase tracking-[-0.04em] hover:text-sky"
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
