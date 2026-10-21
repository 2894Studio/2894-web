"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { Pill } from "@/components/Pill";
import { projects } from "@/content/site";

type Project = (typeof projects)[number];

// Nube flotante de miniaturas: parallax por profundidad, deriva suave y vista ampliada "View case".
export function ProjectCloud() {
  const scroller = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Project | null>(null);

  // En móvil el lienzo es más ancho que la pantalla: se arrastra con el dedo (scroll nativo), empezando centrado.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  // Parallax con el ratón (solo puntero fino y sin reduced-motion).
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const root = canvas.current;
    if (!mq.matches || !root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      const ny = ((e.clientY - r.top) / r.height - 0.5) * 2;
      items.forEach((el) => {
        const d = Number(el.dataset.depth);
        gsap.to(el, { x: -nx * d * 36, y: -ny * d * 36, duration: 1.1, ease: "power3.out", overwrite: "auto" });
      });
    };
    root.addEventListener("pointermove", move);
    return () => {
      root.removeEventListener("pointermove", move);
      gsap.killTweensOf(items);
    };
  }, []);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (active && !d.open) d.showModal();
    if (!active && d.open) d.close();
  }, [active]);

  return (
    <>
      <div ref={scroller} className="mt-10 overflow-x-auto [scrollbar-width:none] md:overflow-hidden [&::-webkit-scrollbar]:hidden">
        <div ref={canvas} className="relative h-[130vw] min-w-[190vw] md:h-[min(60vw,60rem)] md:min-w-0">
          {projects.map((p, i) => (
            <div
              key={p.id}
              data-depth={p.depth}
              className="absolute"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%` }}
            >
              <button
                type="button"
                onClick={() => setActive(p)}
                aria-label={`${p.title}, ${p.category}. Ver caso`}
                className="group relative block w-full cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
                style={
                  {
                    aspectRatio: String(p.ar),
                    "--rot": `${p.rot}deg`,
                    "--dx": `${(i % 3) * 3 + 4}px`,
                    "--dy": `${-6 - (i % 4) * 3}px`,
                    animation: `drift ${9 + (i % 5) * 1.7}s ease-in-out ${-i * 1.3}s infinite`,
                  } as React.CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.25] group-focus-visible:scale-[1.25]"
                />
                <span className="pointer-events-none absolute left-0 top-full z-10 mt-2 whitespace-nowrap bg-cobalt px-2 py-1 text-[13px] font-medium uppercase tracking-wide text-cloud opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {p.title} · {p.category}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-2 px-[var(--gutter)] text-sm uppercase tracking-wide text-ink md:hidden">Arrastra para explorar →</p>

      <details className="mt-10 px-[var(--gutter)]">
        <summary className="min-h-11 cursor-pointer py-3 text-base uppercase tracking-wide">Índice</summary>
      <ul className="mt-2 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setActive(p)}
              className="flex min-h-11 w-full items-baseline justify-between gap-4 py-3 text-left uppercase transition-colors hover:text-cobalt focus-visible:outline-2 focus-visible:outline-cobalt"
            >
              <span className="flex-1 text-base tracking-tight">{p.title}</span>
              <span className="text-sm text-ink">{p.category}</span>
            </button>
          </li>
        ))}
      </ul>
      </details>

      <dialog
        ref={dialog}
        onClose={() => setActive(null)}
        onClick={(e) => e.target === dialog.current && setActive(null)}
        aria-label={active ? `Caso: ${active.title}` : "Caso"}
        className="m-auto w-[min(94vw,1000px)] bg-cloud p-0 backdrop:bg-ink/70"
      >
        {active && (
          <div className="grid md:grid-cols-[1.4fr_1fr]">
            <div className="relative min-h-[50svh] md:min-h-[70svh]"><Image src={active.imageLarge} alt={active.imageAlt} fill sizes="(min-width:768px) 600px, 94vw" className="object-cover" /></div>
            <div className="flex flex-col justify-between gap-8 p-6 md:p-8">
              <div>
                <p className="text-[13px] uppercase tracking-wide text-ink/70">{active.meta.join(" · ")}</p>
                <h3 className="mt-3 text-3xl font-light uppercase tracking-tight">{active.title}</h3>
                <p className="mt-6 text-[13px] text-ink">Imagen de stock: {active.credit}</p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Pill href="#">View case study</Pill>
                <button
                  type="button"
                  autoFocus
                  onClick={() => setActive(null)}
                  className="min-h-11 rounded-full border border-ink px-4 text-sm font-medium uppercase hover:bg-ink hover:text-cloud"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
