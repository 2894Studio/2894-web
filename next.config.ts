import type { NextConfig } from "next";

// STATIC_EXPORT=1 genera una web estática en out/ (para Netlify Drop u otro hosting de archivos).
// REL_ASSETS=1 además usa rutas relativas, para servirla desde una subcarpeta.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? { output: "export", trailingSlash: true, ...(process.env.REL_ASSETS === "1" ? { assetPrefix: "." } : {}) }
    : { cacheComponents: true, partialPrefetching: true }),
  // Imágenes servidas tal cual (ya optimizadas en public/): URLs fijas que el service worker puede guardar sin conexión.
  images: { unoptimized: true },
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
