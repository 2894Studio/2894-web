import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export const FINE_POINTER = "(hover: hover) and (pointer: fine)";
export const REDUCED = "(prefers-reduced-motion: reduce)";

// Curva con rebote para pulsaciones y hovers (el "elástico" de la marca).
export const SPRING = "cubic-bezier(.34,1.56,.64,1)";
