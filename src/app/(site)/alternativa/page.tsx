import type { Metadata } from "next";
import { HomeView } from "@/components/HomeView";

// Versión alternativa de la apertura para comparar: showreel con la frase abajo → cielo → busto, sin el logo.
export const metadata: Metadata = { title: "2894_ Studio · versión alternativa", robots: { index: false } };

export default function Alternativa() {
  return <HomeView variant="directo" />;
}
