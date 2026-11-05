import type { NextConfig } from "next";

// STATIC_EXPORT=1 genera una web estática en out/ (para Netlify Drop u otro hosting de archivos).
// REL_ASSETS=1 además usa rutas relativas, para servirla desde una subcarpeta.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? { output: "export", trailingSlash: true, images: { unoptimized: true }, ...(process.env.REL_ASSETS === "1" ? { assetPrefix: "." } : {}) }
    : {
        cacheComponents: true,
        partialPrefetching: true,
        // Imágenes locales y las de los proyectos, servidas desde Drive por /api/drive/<id>/<versión>.
        images: { localPatterns: [{ pathname: "/stock/**" }, { pathname: "/brand/**" }, { pathname: "/api/drive/**" }] },
      }),
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
