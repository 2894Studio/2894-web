import type { Metadata } from "next";
import { BustPage } from "@/components/BustPage";

export const metadata: Metadata = { title: "Una nueva forma de diseñar · 2894_ Studio" };

// Easter egg: se llega haciendo clic en el busto en trama del cierre.
export default function Busto() {
  return <BustPage />;
}
