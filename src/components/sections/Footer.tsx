"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { CopyEmail } from "@/components/CopyEmail";
import { useTransition } from "@/components/Scenes";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { nav, studio } from "@/content/site";
import { stock } from "@/content/stock";

const Chars = ({ text }: { text: string }) => (
  <>
    {text.split("").map((ch, i) => (
      <span key={i} className="-mx-[0.02em] -mb-[0.12em] -mt-[0.06em] inline-block overflow-hidden px-[0.02em] pb-[0.12em] pt-[0.06em] align-bottom">
        <span data-char className="inline-block">
          {ch}
        </span>
      </span>
    ))}
  </>
);

// Cierre: la página pasa poco a poco de blanco a azul y después aparece el contacto, letra a letra.
export function Footer() {
  const reduced = useReducedMotion();
  // Con parallax el cierre entra en blanco y se tiñe una vez arriba; con fundido el azul empieza durante el fundido.
  const fadeIn = useTransition() === "fade";
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !root.current || !stage.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: fadeIn ? "top bottom" : "top top", end: "bottom bottom", scrub: 0.6 },
      });
      tl.fromTo(stage.current, { backgroundColor: "#ffffff", color: "#0b0b0d" }, { backgroundColor: "#0a46ff", color: "#ffffff", duration: 1 })
        .from("[data-email] [data-char]", { yPercent: 110, stagger: 0.02, duration: 0.5, ease: "power2.out" }, 0.75)
        .from("[data-reveal]", { y: 24, opacity: 0, stagger: 0.12, duration: 0.4, ease: "power2.out" }, 1.1)
        .from("[data-mark] [data-char]", { yPercent: 110, stagger: 0.05, duration: 0.6, ease: "power3.out" }, 1.2)
        .to({}, { duration: 0.3 });
    }, root);
    return () => ctx.revert();
  }, [reduced, fadeIn]);

  return (
    <footer ref={root} id="contacto" className={reduced ? "" : "h-[220svh]"}>
      <div ref={stage} className={`flex flex-col px-[var(--gutter)] pt-[clamp(4rem,10vh,8rem)] ${reduced ? "bg-cobalt text-cloud" : "sticky top-0 h-svh bg-cloud text-ink"}`}>
        <a
          href={`mailto:${studio.email}`}
          data-email
          className="block break-words text-[clamp(2rem,7.5vw,7rem)] font-light uppercase leading-none tracking-[-0.04em] hover:text-sky focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cloud"
        >
          <span className="sr-only">{studio.email}</span>
          <span aria-hidden>
            <Chars text={studio.email} />
          </span>
        </a>
        <div data-reveal className="mt-4 flex flex-wrap items-center gap-3">
          <a href={`tel:${studio.phone.replace(/\s/g, "")}`} className="inline-block min-h-11 py-2 text-xl hover:text-sky">
            {studio.phone}
          </a>
          <CopyEmail email={studio.email} />
        </div>

        <div data-reveal className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="spring inline-block min-h-11 py-2 hover:text-sky">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <p>{studio.facts.location}</p>
        </div>

        <div data-mark aria-hidden className="mt-auto select-none whitespace-nowrap text-[clamp(4.5rem,25vw,24rem)] font-bold leading-none tracking-tighter">
          <Chars text="2894_" />
        </div>

        <details data-reveal className="relative pb-24 text-sm sm:pb-6">
          <summary className="min-h-11 cursor-pointer py-3">Créditos de imagen</summary>
          <ul className="absolute bottom-full left-0 grid max-h-[50svh] w-full gap-1 overflow-auto rounded-2xl bg-cobalt p-4 text-cloud sm:grid-cols-2">
            {stock.map((s) => (
              <li key={s.src}>
                <a href={s.page} className="underline underline-offset-2" rel="noreferrer">
                  {s.credit}
                </a>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </footer>
  );
}
