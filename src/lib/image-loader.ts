// Cargador de imágenes de next/image para toda la web.
// - Fotos de Drive (CDN de imágenes de Google, URL terminada en "=w<ancho>"): se piden ya al ancho necesario;
//   Google las redimensiona y las sirve desde su CDN, sin pasar por la web.
// - Resto (imágenes de /stock): se sirven tal cual (el parámetro solo distingue los tamaños en caché).
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  if (/=w\d+$/.test(src)) return src.replace(/=w\d+$/, `=w${Math.min(width, 2400)}`);
  return `${src}?w=${width}`;
}
