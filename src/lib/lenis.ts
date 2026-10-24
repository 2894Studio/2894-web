import type Lenis from "lenis";

// Instancia compartida del scroll con inercia (la usa el encaje entre escenas).
let current: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  current = l;
};
export const getLenis = () => current;
