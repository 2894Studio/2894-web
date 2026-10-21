"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, REDUCED, ScrollTrigger } from "@/lib/gsap";

// Scroll con inercia (momentum) para toda la página, sincronizado con ScrollTrigger.
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia(REDUCED).matches) return;
    const lenis = new Lenis({ lerp: 0.09, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
