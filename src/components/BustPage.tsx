"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BustScene } from "@/components/sections/BustScene";

// Página del busto (easter egg): el busto centrado, que sigue al ratón (o a la cámara, si se activa).
// Volver es fácil: botón visible arriba a la izquierda (recibe el foco al entrar), tecla Esc y el "atrás" del navegador.
export function BustPage() {
  const router = useRouter();
  const back = useRef<HTMLAnchorElement>(null);

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

  return (
    <main className="bust-page-in relative">
      <h1 className="sr-only">2894_ Studio · Una nueva forma de diseñar</h1>
      <Link
        ref={back}
        href="/#contacto"
        onClick={goBack}
        className="spring fixed left-[var(--gutter)] top-[calc(16px+env(safe-area-inset-top,0px))] z-30 inline-flex min-h-12 items-center gap-2 rounded-full border border-ink/10 bg-white/85 px-5 text-sm font-medium text-ink shadow-[0_8px_30px_rgb(11_11_13/0.08)] backdrop-blur-md hover:bg-ink hover:text-cloud focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt"
      >
        <span aria-hidden>←</span> Volver a la web
        <kbd className="ml-1 hidden rounded border border-current/30 px-1.5 text-[11px] opacity-60 sm:inline">Esc</kbd>
      </Link>
      <BustScene standalone />
    </main>
  );
}
