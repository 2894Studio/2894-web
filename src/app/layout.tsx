import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
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
        {children}
      </body>
    </html>
  );
}
