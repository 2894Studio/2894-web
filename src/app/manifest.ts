import type { MetadataRoute } from "next";

// App instalable (PWA): se añade a la pantalla de inicio y funciona sin conexión gracias a public/sw.js.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "2894_ Studio",
    short_name: "2894_",
    description: "Estudio de IA y diseño. Intelligent tools. Human imagination.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0A46FF",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
