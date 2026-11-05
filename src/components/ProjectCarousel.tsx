"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Media } from "@/lib/projects";

// Carrusel de la página de un proyecto: desplazamiento horizontal con encaje, arrastre/gesto, flechas y teclado.
export function ProjectCarousel({ items, title }: { items: Media[]; title: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [scrollable, setScrollable] = useState(true); // si todas caben a la vez, sin flechas ni contador

  // Diapositiva visible: la más cercana al borde izquierdo del carrusel.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const slides = [...el.children] as HTMLElement[];
        let best = 0, dist = Infinity;
        slides.forEach((s, i) => {
          const d = Math.abs(s.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft) - el.scrollLeft);
          if (d < dist) {
            dist = d;
            best = i;
          }
        });
        // al llegar al final, la última cuenta como visible aunque no alcance el borde izquierdo
        setIndex(el.scrollLeft >= el.scrollWidth - el.clientWidth - 2 ? slides.length - 1 : best);
      });
    };
    const fit = () => setScrollable(el.scrollWidth > el.clientWidth + 2);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const go = useCallback(
    (to: number) => {
      const el = track.current;
      const slide = el?.children[Math.max(0, Math.min(items.length - 1, to))] as HTMLElement | undefined;
      if (el && slide) el.scrollTo({ left: slide.offsetLeft - parseFloat(getComputedStyle(el).paddingLeft), behavior: "smooth" });
    },
    [items.length],
  );

  return (
    <section aria-roledescription="carrusel" aria-label={`Imágenes de ${title}`} className="mt-16">
      <div
        ref={track}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
          e.preventDefault();
          go(index + (e.key === "ArrowRight" ? 1 : -1));
        }}
        className="relative -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-4 overflow-x-auto scroll-smooth px-[var(--gutter)] pb-2 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt [&::-webkit-scrollbar]:hidden"
      >
        {items.map((m, i) => (
          <figure
            key={m.src}
            role="group"
            aria-roledescription="diapositiva"
            aria-label={`${i + 1} de ${items.length}`}
            className="relative h-[min(70svh,52rem)] shrink-0 snap-start overflow-hidden rounded-2xl bg-ink/5"
            style={{ aspectRatio: m.width && m.height ? `${m.width} / ${m.height}` : "4 / 3" }}
          >
            {m.kind === "video" ? (
              <video src={m.src} poster={m.poster} muted loop playsInline controls preload="metadata" className="h-full w-full object-cover" />
            ) : (
              <Image src={m.src} alt={`${m.alt} (${i + 1} de ${items.length})`} fill sizes="(max-width: 640px) 90vw, 60vw" className="object-cover" />
            )}
          </figure>
        ))}
      </div>
      <div className={`mt-4 flex items-center gap-3 ${scrollable ? "" : "hidden"}`}>
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Imagen anterior" className="spring flex size-11 items-center justify-center rounded-full border border-ink/20 hover:bg-ink hover:text-cloud disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink">
          ←
        </button>
        <button type="button" onClick={() => go(index + 1)} disabled={index >= items.length - 1} aria-label="Imagen siguiente" className="spring flex size-11 items-center justify-center rounded-full border border-ink/20 hover:bg-ink hover:text-cloud disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink">
          →
        </button>
        <p aria-live="polite" className="ml-2 text-sm tabular-nums text-ink/70">
          {index + 1} / {items.length}
        </p>
      </div>
    </section>
  );
}
