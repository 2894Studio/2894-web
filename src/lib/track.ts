import { track as vercelTrack } from "@vercel/analytics";

// Acciones que interesa medir (llegadas a contacto, clics en webs de proyectos…). Solo se envía el nombre del evento y,
// como mucho, el proyecto o canal: nunca datos de la persona. Si la medición no está activa, no hace nada.
type Props = Record<string, string | number | boolean | null>;
export function track(name: string, props?: Props) {
  try {
    vercelTrack(name, props);
  } catch {
    // la medición nunca debe romper la web
  }
}
