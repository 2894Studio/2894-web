"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bust3DScene } from "@/components/Bust3D";

const NIGHT_KEY = "bust-night";
const NIGHT_BG = "#070a14"; // fondo del modo noche (el mismo que el del escenario)

// Página del busto (easter egg): el busto en 3D centrado, que sigue al ratón (o a la cámara, si se activa).
// Volver es fácil: botón visible arriba a la izquierda (recibe el foco al entrar), tecla Esc y el "atrás" del navegador.
// Modo noche: es el modo por defecto; el interruptor arriba a la derecha pasa a día y recuerda la elección de la persona.
export function BustPage() {
  const router = useRouter();
  const back = useRef<HTMLAnchorElement>(null);
  const [night, setNight] = useState(true); // oscuro por defecto

  const goBack = (e?: { preventDefault: () => void }): boolean => {
    let fromHome = false;
    try {
      fromHome = sessionStorage.getItem("bust-from") === "home";
      sessionStorage.removeItem("bust-from");
    } catch {}
    // Si venimos de la web, se vuelve al mismo punto del cierre; si no (enlace directo), al contacto.
    if (fromHome && window.history.length > 1) {
      e?.preventDefault();
      router.back();
      return true;
    }
    return false;
  };

  useEffect(() => {
    back.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (!document.querySelector("dialog[open]")) {
        if (!goBack()) router.push("/#contacto");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modo noche por defecto: solo pasa a día si la persona lo eligió así antes.
  useEffect(() => {
    try {
      if (localStorage.getItem(NIGHT_KEY) === "0") setNight(false);
    } catch {}
  }, []);

  // Detrás del escenario (rebote del scroll, barra del navegador) también se ve la noche; al salir, todo vuelve a lo suyo.
  useEffect(() => {
    if (!night) return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const prevMeta = meta?.content;
    const prevHtml = document.documentElement.style.backgroundColor;
    const prevBody = document.body.style.backgroundColor;
    if (meta) meta.content = NIGHT_BG;
    document.documentElement.style.backgroundColor = NIGHT_BG;
    document.body.style.backgroundColor = NIGHT_BG;
    return () => {
      if (meta && prevMeta !== undefined) meta.content = prevMeta;
      document.documentElement.style.backgroundColor = prevHtml;
      document.body.style.backgroundColor = prevBody;
    };
  }, [night]);

  const toggleNight = () => {
    const next = !night;
    setNight(next);
    try {
      localStorage.setItem(NIGHT_KEY, next ? "1" : "0");
    } catch {}
  };

  const pill = night
    ? "border-white/15 bg-white/10 text-cloud shadow-[0_8px_30px_rgb(0_0_0/0.35)] hover:bg-cloud hover:text-ink"
    : "border-ink/10 bg-white/85 text-ink shadow-[0_8px_30px_rgb(11_11_13/0.08)] hover:bg-ink hover:text-cloud";

  return (
    <main className="bust-page-in relative">
      <h1 className="sr-only">2894_ Studio · Una nueva forma de diseñar</h1>
      <Link
        ref={back}
        href="/#contacto"
        onClick={goBack}
        className={`spring fixed left-[var(--gutter)] top-[calc(16px+env(safe-area-inset-top,0px))] z-30 inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-sm font-medium backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt ${pill}`}
      >
        <span aria-hidden>←</span> Volver a la web
        <kbd className="ml-1 hidden rounded border border-current/30 px-1.5 text-[11px] opacity-60 sm:inline">Esc</kbd>
      </Link>
      <button
        type="button"
        onClick={toggleNight}
        aria-pressed={night}
        aria-label="Modo noche"
        title={night ? "Pasar a modo día" : "Pasar a modo noche"}
        className={`spring fixed right-[var(--gutter)] top-[calc(16px+env(safe-area-inset-top,0px))] z-30 inline-flex size-12 items-center justify-center rounded-full border backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt ${pill}`}
      >
        {night ? <SunIcon /> : <MoonIcon />}
      </button>
      <Bust3DScene night={night} />
    </main>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </svg>
  );
}
