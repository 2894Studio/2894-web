"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { FINE_POINTER, gsap, REDUCED } from "@/lib/gsap";

// El contenido sigue al cursor con rebote elástico y vuelve a su sitio al salir.
export function Magnetic({ children, strength = 0.3, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia(FINE_POINTER).matches || window.matchMedia(REDUCED).matches) return;
    const opts = { duration: 0.9, ease: "elastic.out(1, 0.4)" };
    const x = gsap.quickTo(el, "x", opts);
    const y = gsap.quickTo(el, "y", opts);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - (r.left + r.width / 2)) * strength);
      y((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      x(0);
      y(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(el);
    };
  }, [strength]);

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}
