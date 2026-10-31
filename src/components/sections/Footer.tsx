"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { nav, studio } from "@/content/site";
import { stock } from "@/content/stock";

// Letras con máscara para revelarlas; el guion del logo parpadea (.blink).
const Chars = ({ text }: { text: string }) => (
  <>
    {text.split("").map((ch, i) => (
      <span key={i} className="-mx-[0.02em] -mb-[0.12em] -mt-[0.06em] inline-block overflow-hidden px-[0.02em] pb-[0.12em] pt-[0.06em] align-bottom">
        <span data-char className={`inline-block ${ch === "_" ? "blink" : ""}`}>
          {ch === " " ? " " : ch}
        </span>
      </span>
    ))}
  </>
);

const WhatsAppIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-6" fill="currentColor">
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3a8.2 8.2 0 1 1 6.9 3.9Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

const whatsappHref = `https://wa.me/${studio.whatsapp}?text=${encodeURIComponent(studio.whatsappText)}`;
const mailHref = `mailto:${studio.email}?subject=${encodeURIComponent("Proyecto con 2894_")}`;

// Cierre: el fondo pasa de blanco a azul de forma gradual (igual al bajar que al subir) y después aparece el contacto.
// WhatsApp es la vía principal; el correo abre directamente un mensaje nuevo.
export function Footer() {
  const reduced = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !root.current || !stage.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        // Scrub más largo y suave: el color acompaña al scroll sin saltos en ningún sentido.
        scrollTrigger: { trigger: root.current, start: "top 60%", end: "bottom bottom", scrub: 1.4 },
      });
      // Blanco → azul cielo muy claro → azul cielo → cobalto: la transición pasa por tonos intermedios.
      tl.to(stage.current, { keyframes: { backgroundColor: ["#ffffff", "#e9f1fd", "#9ec5ff", "#0a46ff"], easeEach: "sine.inOut" }, duration: 1.4 }, 0)
        .to(stage.current, { color: "#ffffff", duration: 0.5, ease: "sine.inOut" }, 0.7)
        .from("[data-head] [data-char]", { yPercent: 110, stagger: 0.03, duration: 0.5, ease: "power2.out" }, 1.0)
        .from("[data-reveal]", { y: 24, opacity: 0, stagger: 0.1, duration: 0.4, ease: "power2.out" }, 1.25)
        .from("[data-mark] [data-char]", { yPercent: 110, stagger: 0.05, duration: 0.6, ease: "power3.out" }, 1.35)
        .to({}, { duration: 0.3 });
    }, root);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <footer ref={root} id="contacto" className={reduced ? "" : "h-[240svh]"}>
      <div ref={stage} className={`flex flex-col px-[var(--gutter)] pt-[clamp(4rem,10vh,8rem)] ${reduced ? "bg-cobalt text-cloud" : "sticky top-0 h-svh bg-cloud text-ink"}`}>
        <h2 data-head className="text-[clamp(2.6rem,9vw,8rem)] font-light uppercase leading-none tracking-[-0.04em]">
          <span className="sr-only">Hablemos</span>
          <span aria-hidden>
            <Chars text="Hablemos" />
          </span>
        </h2>

        <div data-reveal className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="spring inline-flex min-h-14 items-center gap-3 rounded-full bg-cloud px-7 text-lg font-medium text-cobalt hover:bg-ink hover:text-cloud focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cloud"
          >
            <WhatsAppIcon />
            Escríbenos por WhatsApp
          </a>
          <a href={mailHref} className="inline-flex min-h-11 items-center text-lg underline decoration-1 underline-offset-[6px] hover:text-sky focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cloud">
            {studio.email}
          </a>
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
          <p>
            {studio.facts.location} · {studio.phone}
          </p>
        </div>

        <div data-mark aria-hidden className="mt-auto select-none whitespace-nowrap text-[clamp(4.5rem,25vw,24rem)] font-bold leading-none tracking-tighter">
          <Chars text="2894_" />
        </div>

        <details data-reveal className="relative pb-24 text-sm">
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
