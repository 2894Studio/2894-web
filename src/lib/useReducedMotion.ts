import { useSyncExternalStore } from "react";
import { REDUCED } from "./gsap";

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

// En servidor asumimos movimiento reducido: se activa el movimiento tras hidratar.
export const useReducedMotion = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => true);
