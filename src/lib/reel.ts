import { useSyncExternalStore } from "react";

// Estado compartido del showreel: el Hero lo actualiza con los avisos del reproductor
// y la barra inferior (en modo reproductor) lo muestra y envía órdenes.
export type ReelState = { active: boolean; playing: boolean; muted: boolean; time: number; duration: number };
type Commands = { toggle: () => void; toggleSound: () => void; seek: (t: number) => void };

let state: ReelState = { active: true, playing: true, muted: true, time: 0, duration: 0 };
const listeners = new Set<() => void>();
const noop = () => {};
let commands: Commands = { toggle: noop, toggleSound: noop, seek: noop };

export const setReel = (patch: Partial<ReelState>) => {
  const next = { ...state, ...patch };
  if ((Object.keys(patch) as (keyof ReelState)[]).every((k) => next[k] === state[k])) return;
  state = next;
  listeners.forEach((l) => l());
};
export const registerReel = (c: Commands) => {
  commands = c;
};
export const reel = {
  toggle: () => commands.toggle(),
  toggleSound: () => commands.toggleSound(),
  seek: (t: number) => commands.seek(t),
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const useReel = () => useSyncExternalStore(subscribe, () => state, () => state);
