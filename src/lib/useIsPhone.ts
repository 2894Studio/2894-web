import { useSyncExternalStore } from "react";

const PHONE = "(max-width: 639px)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(PHONE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

// Pantalla de móvil (menos de 640 px). En servidor se asume escritorio; tras hidratar se ajusta.
export const useIsPhone = () => useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches, () => false);
