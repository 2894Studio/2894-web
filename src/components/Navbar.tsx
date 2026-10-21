"use client";

import { useEffect, useState } from "react";
import { nav } from "@/content/site";

// Aparece por primera vez al hacer scroll. Desktop: pill central. Móvil: "MENU +" a pantalla completa.
export function Navbar() {
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
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

  return (
    <>
      <nav
        aria-label="Principal"
        className={`fixed left-1/2 top-4 z-50 hidden -translate-x-1/2 transition-all duration-500 ease-out sm:block sm:top-6 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-6 opacity-0"
        }`}
      >
        <ul className="flex items-center gap-1 rounded-full border border-white/50 bg-cloud/80 p-1.5 shadow-[0_8px_30px_rgb(0_0_0/0.08)] backdrop-blur-xl">
          <li className="pl-4 pr-2 text-sm font-bold">2894_</li>
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                tabIndex={visible ? 0 : -1}
                className="inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors hover:bg-ink hover:text-cloud focus-visible:outline-2 focus-visible:outline-cobalt"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-movil"
        onClick={() => setOpen((o) => !o)}
        className={`fixed right-[var(--gutter)] top-3 z-[60] min-h-11 rounded-full bg-cloud/85 px-4 text-sm font-medium uppercase backdrop-blur-md transition-all duration-500 sm:hidden ${
          visible || open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {open ? "Close —" : "Menu +"}
      </button>

      <div
        id="menu-movil"
        hidden={!open}
        className="fixed inset-0 z-50 flex flex-col justify-end bg-cloud px-[var(--gutter)] pb-10 sm:hidden"
      >
        <ul className="space-y-1">
          {nav.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={() => setOpen(false)}
                className="block py-1 text-5xl font-light uppercase tracking-[-0.04em] hover:text-cobalt"
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
