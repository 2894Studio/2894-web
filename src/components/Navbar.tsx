"use client";

import { useEffect, useState } from "react";
import { nav } from "@/content/site";

// Aparece por primera vez al hacer scroll (pasado el 60% del primer viewport).
export function Navbar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Principal"
      aria-hidden={!visible}
      className={`fixed left-1/2 top-4 z-50 -translate-x-1/2 transition-all duration-500 ease-out sm:top-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-6 opacity-0"
      }`}
    >
      <ul className="flex items-center gap-0.5 rounded-full border border-white/40 bg-cloud/80 p-1 shadow-[0_8px_30px_rgb(0_0_0/0.08)] backdrop-blur-xl sm:gap-1 sm:p-1.5">
        <li className="hidden pl-4 pr-2 text-sm font-bold sm:block">2894_</li>
        {nav.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              tabIndex={visible ? 0 : -1}
              className="inline-flex min-h-11 items-center rounded-full px-3 text-[13px] font-medium transition-colors hover:bg-ink hover:text-cloud focus-visible:outline-2 focus-visible:outline-cobalt sm:px-4 sm:text-sm"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
