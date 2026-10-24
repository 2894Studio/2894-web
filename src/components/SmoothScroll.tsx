"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, REDUCED, ScrollTrigger } from "@/lib/gsap";
import { scrollToHash, setLenis } from "@/lib/lenis";

// Scroll con inercia (momentum) para toda la página, sincronizado con ScrollTrigger.
export function SmoothScroll() {
  // Todas las anclas internas pasan por scrollToHash; los enlaces "#" (casos aún sin página) no mueven la vista.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const hash = a.getAttribute("href")!;
      if (hash === "#" || scrollToHash(hash)) e.preventDefault();
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (window.matchMedia(REDUCED).matches) return;
    const lenis = new Lenis({ lerp: 0.09 });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      setLenis(null);
      lenis.destroy();
    };
  }, []);
  return null;
}
