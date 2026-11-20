"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { CardMedia } from "@/components/ProjectSphere";
import { VideoLightbox } from "@/components/VideoLightbox";
import { track } from "@/lib/track";
import type { SphereItem } from "@/lib/projects";

// Proyectos en móvil: carrusel que se desliza de lado (en vez de la esfera, que en pantalla pequeña es difícil de usar).
// Cada proyecto es una diapositiva con su imagen o vídeo, el texto y los botones siempre visibles (sin hover).
// Solo se anima (fotos que pasan / vídeo) la diapositiva que se está viendo.
// `mediaRef`: expone la caja de imagen de cada diapositiva para que el showreel vuele hasta la primera.
// `fill`: ocupa todo el alto disponible de su contenedor (dentro de la apertura, que está fijada a la pantalla): si el texto
// de un proyecto no cabe, el área de las diapositivas se desplaza hacia abajo, sin que nada quede tapado por la barra.
export function ProjectSlider({ items, mediaRef, fill = false }: { items: SphereItem[]; mediaRef?: MutableRefObject<(HTMLDivElement | null)[]>; fill?: boolean }) {
  const scroller = useRef<HTMLUListElement>(null);
  const slides = useRef<(HTMLLIElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState<SphereItem | null>(null);

  // Diapositiva activa = la que ocupa más pantalla.
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) setCurrent(slides.current.indexOf(e.target as HTMLLIElement));
        });
      },
      { root, threshold: [0.6, 0.9] },
    );
    slides.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  const go = (i: number) => {
    const el = slides.current[Math.max(0, Math.min(items.length - 1, i))];
    el?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div role="region" aria-roledescription="carrusel" aria-label="Proyectos" className={fill ? "absolute inset-0 flex flex-col" : "relative"}>
      <ul
        ref={scroller}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") { e.preventDefault(); go(current + 1); }
          if (e.key === "ArrowLeft") { e.preventDefault(); go(current - 1); }
        }}
        data-lenis-prevent
        className={`flex snap-x snap-mandatory gap-5 overflow-x-auto px-[10vw] pb-4 [scrollbar-width:none] ${fill ? "min-h-0 flex-1 overflow-y-auto" : ""} focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cobalt [&::-webkit-scrollbar]:hidden`}
      >
        {items.map((p, i) => {
          const link = p.links[0];
          return (
            <li
              key={p.id}
              ref={(n) => { slides.current[i] = n; }}
              aria-roledescription="diapositiva"
              aria-label={`${i + 1} de ${items.length}`}
              className="w-[80vw] shrink-0 snap-center"
            >
              <div
                ref={(n) => { if (mediaRef) mediaRef.current[i] = n; }}
                className={`relative overflow-hidden rounded-2xl bg-ink/5 ${fill ? "aspect-video" : "aspect-[16/10]"}`}
              >
                <CardMedia item={p} index={i} active={i === current} />
              </div>
              <div className="px-1 pt-3">
                {p.category && <p className="text-sm text-ink/80">{p.category}</p>}
                <h3 className="mt-1 text-xl font-light uppercase leading-tight tracking-tight">{p.title}</h3>
                {p.review && <p className="mt-2 text-base leading-snug">{p.review}</p>}
                {(link || p.clickVideo) && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {p.clickVideo && (
                      <button type="button" onClick={() => { track("proyecto_video", { proyecto: p.id }); setPlaying(p); }} className="spring inline-flex min-h-11 items-center gap-2 rounded-full bg-cobalt px-5 text-sm font-medium uppercase text-cloud active:bg-ink">
                        <span aria-hidden>▶</span> Ver vídeo
                      </button>
                    )}
                    {p.links.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noreferrer" onClick={() => track("proyecto_web", { proyecto: p.id })} className="spring inline-flex min-h-11 items-center gap-2 rounded-full bg-cobalt px-5 text-sm font-medium uppercase text-cloud active:bg-ink">
                        {l.label} <span aria-hidden>↗</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Contador y flechas (zonas táctiles de 44 px) */}
      <div className={`mt-1 flex shrink-0 items-center justify-between px-[10vw] ${fill ? "mb-[calc(5.25rem+env(safe-area-inset-bottom,0px))]" : ""}`}>
        <p aria-live="polite" className="text-sm tabular-nums text-ink/70">
          {current + 1} / {items.length}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(current - 1)} disabled={current === 0} aria-label="Proyecto anterior" className="spring flex size-11 items-center justify-center rounded-full border border-ink/20 text-lg disabled:opacity-30 active:bg-ink active:text-cloud">
            <span aria-hidden>←</span>
          </button>
          <button type="button" onClick={() => go(current + 1)} disabled={current === items.length - 1} aria-label="Proyecto siguiente" className="spring flex size-11 items-center justify-center rounded-full border border-ink/20 text-lg disabled:opacity-30 active:bg-ink active:text-cloud">
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      <VideoLightbox video={playing?.clickVideo ?? null} title={playing?.title ?? ""} onClose={() => setPlaying(null)} />
    </div>
  );
}
