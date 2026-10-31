import type Lenis from "lenis";

// Instancia compartida del scroll con inercia (la usan el encaje entre escenas y la navegación).
let current: Lenis | null = null;
export const setLenis = (l: Lenis | null) => {
  current = l;
};
export const getLenis = () => current;

// Destino de cada ancla: el inicio de su escena; el contacto, al final de la página (con el cierre ya revelado).
const targetOf = (hash: string) => {
  if (hash === "#top") return 0;
  if (hash === "#contacto") return document.documentElement.scrollHeight - window.innerHeight;
  const el = document.getElementById(decodeURIComponent(hash.slice(1)));
  if (!el) return null;
  // Un ancla marcada con data-anchor vale por sí misma (p. ej. un punto dentro de una escena larga).
  const scene = el.hasAttribute("data-anchor") ? el : (el.closest<HTMLElement>("[data-scene]") ?? el);
  let y = 0;
  for (let n: HTMLElement | null = scene; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
  return y;
};

// Navega a un ancla con el scroll suave; después lleva el foco a la sección (teclado y lectores de pantalla).
export const scrollToHash = (hash: string) => {
  const y = targetOf(hash);
  if (y === null) return false;
  const focus = () => {
    const el = hash === "#top" ? document.querySelector("main") : document.getElementById(hash.slice(1));
    if (!el) return;
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    (el as HTMLElement).focus({ preventScroll: true });
  };
  if (current) {
    const d = Math.abs(y - window.scrollY);
    current.scrollTo(y, { force: true, duration: Math.min(2.2, 0.8 + d / 4000), easing: (t) => 1 - Math.pow(1 - t, 4), onComplete: focus });
  } else {
    window.scrollTo(0, y);
    focus();
  }
  history.replaceState(null, "", hash === "#top" ? location.pathname + location.search : hash);
  return true;
};
