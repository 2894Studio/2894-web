// Cargador de imágenes de next/image para toda la web.
// - Fotos de Drive (/api/drive/<id>/<versión>): se piden ya al ancho necesario (Google las redimensiona y el
//   CDN de Vercel las guarda). Así no pasan por el optimizador de Vercel, que en las vistas previas protegidas
//   no puede volver a pedir la imagen a la propia web.
// - Resto (imágenes de /stock): se sirven tal cual (el parámetro solo distingue los tamaños en caché).
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (src.startsWith("/api/drive/")) return `${src}/w${Math.min(width, 2400)}`;
  return `${src}?w=${width}`;
}
