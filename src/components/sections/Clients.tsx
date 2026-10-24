"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SectionTitle } from "@/components/SectionTitle";
import { clients } from "@/content/site";
import { FINE_POINTER, gsap, REDUCED } from "@/lib/gsap";

// Clientes en lista (referencia: Dash). Cada fila responde con rebote; la imagen del cliente sigue al cursor.
export function Clients() {
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
      <SectionTitle id="clients-h" text="Clientes" />

      <ul ref={list} className="mx-[var(--gutter)] mt-12 border-b border-ink" onPointerLeave={() => setHover(null)}>
        {clients.map((c, i) => (
          <li key={c.name} onPointerEnter={() => setHover(i)} className="group border-t border-ink">
            <a
              href="#"
              className="grid w-full grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-6 uppercase focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cobalt sm:grid-cols-[2fr_3fr_auto] sm:py-8"
            >
              <span className="text-[clamp(1.75rem,4.5vw,3.5rem)] font-light leading-none tracking-[-0.03em] transition-transform duration-700 ease-[cubic-bezier(.34,1.56,.64,1)] group-hover:translate-x-4 group-hover:text-cobalt">
                {c.name}
              </span>
              <span className="order-3 col-span-2 text-sm tracking-wide sm:order-none sm:col-span-1">{c.disciplines.join(" · ")}</span>
              <span className="spring inline-flex min-h-11 items-center text-sm font-medium tracking-wide group-hover:text-cobalt">
                View more <span aria-hidden className="ml-2 transition-transform duration-500 group-hover:translate-x-1">→</span>
              </span>
            </a>
          </li>
        ))}
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
