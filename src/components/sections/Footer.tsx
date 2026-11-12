"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { legal, nav, partners, studio } from "@/content/site";
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
  <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.1-1.3A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-3-.2-.3a8.2 8.2 0 1 1 6.9 3.9Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
  </svg>
);

const MailIcon = () => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </svg>
);

const whatsappHref = `https://wa.me/${studio.whatsapp}?text=${encodeURIComponent(studio.whatsappText)}`;
const mailHref = `mailto:${studio.email}?subject=${encodeURIComponent("Proyecto con 2894_")}`;

// Cierre: el fondo pasa de blanco a azul de forma gradual (igual al bajar que al subir) y después aparece el contacto.
// Primero el contacto (correo y teléfono, con acción directa); la navegación queda al final.
export function Footer() {
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
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
    <footer id="contacto">
      <div ref={root} className={reduced ? "" : "h-[240svh]"}>
      <div ref={stage} className={`flex flex-col px-[var(--gutter)] pt-[clamp(4rem,10vh,8rem)] ${reduced ? "bg-cobalt text-cloud" : "sticky top-0 h-svh bg-cloud text-ink"}`}>
        <h2 data-head className="text-[clamp(2.6rem,9vw,8rem)] font-light uppercase leading-none tracking-[-0.04em]">
          <span className="sr-only">Contacto</span>
          <span aria-hidden>
            <Chars text="Contacto" />
          </span>
        </h2>

        {/* Lo importante primero: correo y teléfono, cada uno con su acción directa */}
        <dl className="mt-8 grid max-w-3xl gap-3">
          <div data-reveal className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-current/25 pt-4">
            <div>
              <dt className="text-sm opacity-75">Correo</dt>
              <dd className="text-[clamp(1.25rem,2.6vw,1.75rem)] font-medium">{studio.email}</dd>
            </div>
            <a href={mailHref} className="spring inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-cloud px-6 text-base font-medium text-cobalt hover:bg-ink hover:text-cloud focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cloud">
              <MailIcon />
              Enviar correo
            </a>
          </div>
          <div data-reveal className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-current/25 pt-4">
            <div>
              <dt className="text-sm opacity-75">Teléfono</dt>
              <dd className="text-[clamp(1.25rem,2.6vw,1.75rem)] font-medium">
                <a href={`tel:${studio.phone.replace(/\s/g, "")}`} className="underline decoration-1 underline-offset-[6px] hover:text-sky">
                  {studio.phone}
                </a>
              </dd>
            </div>
            <a href={whatsappHref} target="_blank" rel="noreferrer" className="spring inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-cloud px-6 text-base font-medium text-cobalt hover:bg-ink hover:text-cloud focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cloud">
              <WhatsAppIcon />
              WhatsApp
            </a>
          </div>
        </dl>

        <div data-mark aria-hidden className="mt-auto select-none whitespace-nowrap text-[clamp(4.5rem,25vw,24rem)] font-bold leading-none tracking-tighter">
          <Chars text="2894_" />
        </div>

        {/* Al final de todo: navegación, ubicación y créditos */}
        <div data-reveal className="flex flex-wrap items-center gap-x-6 gap-y-1 pb-6 text-sm">
          <ul className="flex flex-wrap gap-x-5">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="inline-block min-h-11 py-3 hover:text-sky">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
          <p>{studio.facts.location}</p>
          <details className="relative">
            <summary className="min-h-11 cursor-pointer py-3">Créditos de imagen</summary>
            <ul className="absolute bottom-full left-0 grid max-h-[50svh] w-[min(640px,calc(100vw-32px))] gap-1 overflow-auto rounded-2xl bg-cobalt p-4 text-cloud sm:grid-cols-2">
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
      </div>
      </div>

      {/* Pie legal: colaboraciones, dirección y políticas. */}
      <div className="bg-cobalt px-[var(--gutter)] pb-[calc(7rem+env(safe-area-inset-bottom,0px))] pt-10 text-cloud">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-cloud/25 pt-8">
          <p className="text-sm uppercase tracking-wide opacity-80">Colaboramos con</p>
          <ul className="flex flex-wrap items-center gap-x-10 gap-y-4">
            {partners.map((pt) => (
              <li key={pt.name}>
                <a href={pt.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center opacity-90 hover:opacity-100">
                  {pt.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logos SVG locales en blanco
                    <img src={pt.logo} alt={pt.name} className={`${pt.h} w-auto brightness-0 invert`} />
                  ) : (
                    <span className="text-2xl font-bold tracking-tight">{pt.name}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8 flex flex-wrap items-start justify-between gap-x-8 gap-y-4 text-sm">
          <address className="not-italic opacity-90">
            {legal.owner || "2894_ Studio"}
            <br />
            {legal.street ? `${legal.street}, ${legal.postalCode} ${legal.city}` : legal.city}
          </address>
          <ul className="flex flex-wrap gap-x-6">
            {[
              ["Aviso legal", "/aviso-legal"],
              ["Privacidad", "/privacidad"],
              ["Cookies", "/cookies"],
            ].map(([label, href]) => (
              <li key={href}>
                <a href={href} className="inline-block min-h-11 py-3 underline-offset-4 hover:underline">
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <p className="py-3 opacity-80">© 2026 2894_ Studio</p>
        </div>
      </div>
    </footer>
  );
}
