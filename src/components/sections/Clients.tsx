"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Pill } from "@/components/Pill";
import { clients } from "@/content/site";
import { FINE_POINTER, gsap, REDUCED } from "@/lib/gsap";

// Clientes en lista (referencia: Dash). Cada fila responde con rebote; la imagen del cliente sigue al cursor.
export function Clients() {
  const [open, setOpen] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const float = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = float.current;
    const ul = list.current;
    if (!el || !ul || !window.matchMedia(FINE_POINTER).matches || window.matchMedia(REDUCED).matches) return;
    const x = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      x(e.clientX + 24);
      y(e.clientY - 120);
    };
    ul.addEventListener("pointermove", move);
    return () => ul.removeEventListener("pointermove", move);
  }, []);

  return (
    <section id="clients" className="py-[var(--section-y)]" aria-labelledby="clients-h">
      <h2 id="clients-h" className="px-[var(--gutter)] text-[clamp(2.4rem,9vw,7rem)] font-light uppercase leading-[0.9] tracking-[-0.04em] text-balance">
        Clientes<span className="text-cobalt">.</span>
      </h2>

      <ul ref={list} className="mx-[var(--gutter)] mt-12 border-b border-ink" onPointerLeave={() => setHover(null)}>
        {clients.map((c, i) => {
          const isOpen = open === c.name;
          return (
            <li key={c.name} onPointerEnter={() => setHover(i)} className="group border-t border-ink">
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`cliente-${i}`}
                onClick={() => setOpen(isOpen ? null : c.name)}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-6 text-left uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt sm:grid-cols-[2fr_3fr_auto] sm:py-8"
              >
                <span className="text-[clamp(1.75rem,4.5vw,3.5rem)] font-light leading-none tracking-[-0.03em] transition-transform duration-700 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:translate-x-4 group-hover:text-cobalt">
                  {c.name}
                </span>
                <span className="order-3 col-span-2 text-sm tracking-wide sm:order-none sm:col-span-1">{c.disciplines.join(" · ")}</span>
                <span className="text-sm font-medium tracking-wide">{isOpen ? "LESS −" : "MORE +"}</span>
              </button>
              <div id={`cliente-${i}`} className={`grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                <div className="overflow-hidden">
                  <div className="pb-8" hidden={!isOpen}>
                    <Pill href="#">View case study</Pill>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div
        ref={float}
        aria-hidden
        className={`pointer-events-none fixed left-0 top-0 z-30 hidden aspect-[4/5] w-56 overflow-hidden transition-[opacity,scale] duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] [@media(hover:hover)_and_(pointer:fine)]:block ${hover === null ? "scale-75 opacity-0" : "scale-100 opacity-100"}`}
      >
        {clients.map((c, i) => (
          <Image key={c.name} src={c.image} alt="" fill sizes="224px" className={`object-cover transition-opacity duration-300 ${hover === i ? "opacity-100" : "opacity-0"}`} />
        ))}
      </div>
    </section>
  );
}
