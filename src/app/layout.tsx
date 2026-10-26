import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { PwaRegister } from "@/components/PwaRegister";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "2894_ Studio — Intelligent tools. Human imagination.",
  description:
    "Elevamos a empresas y equipos de diseño a un nuevo nivel de madurez, innovación y propósito mediante alfabetización en IA y su aplicación práctica.",
  applicationName: "2894_",
  // iPhone: al añadirla a la pantalla de inicio se abre a pantalla completa, como una app.
  appleWebApp: { capable: true, title: "2894_", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" }, // iOS anteriores a 17 solo reconocen esta etiqueta
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-cloud text-ink">
        <SmoothScroll />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
