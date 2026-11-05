import { driveReady, fetchMedia, fetchThumbnail, getFile, isInsideRoot, mediaKindOf } from "@/lib/drive";

// Sirve las fotos y vídeos de los proyectos desde la carpeta privada de Drive.
//   /api/drive/<id>/<versión>          → el archivo (con Range: los vídeos se pueden adelantar)
//   /api/drive/<id>/<versión>/poster   → fotograma de un vídeo (miniatura de Drive)
// Solo archivos dentro de la carpeta de proyectos. La versión cambia cuando el archivo cambia en Drive,
// así que la respuesta se puede guardar en caché "para siempre" en el CDN y en el navegador.
const CACHE = "public, max-age=86400, s-maxage=31536000, immutable";

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const [id, , kind] = (await params).path;
  if (!driveReady() || !id || !/^[\w-]{10,}$/.test(id)) return new Response("No encontrado", { status: 404 });
  const file = await getFile(id);
  if (!file || !mediaKindOf(file.mimeType) || !(await isInsideRoot(file))) return new Response("No encontrado", { status: 404 });

  if (kind === "poster") {
    if (!file.thumbnailLink) return new Response("Sin fotograma", { status: 404 });
    const t = await fetchThumbnail(file.thumbnailLink);
    if (!t.ok) return new Response("Sin fotograma", { status: 404 });
    return new Response(t.body, { headers: { "content-type": t.headers.get("content-type") ?? "image/jpeg", "cache-control": CACHE } });
  }

  const res = await fetchMedia(id, req.headers.get("range"));
  if (!res.ok && res.status !== 206) return new Response("No disponible", { status: 502 });
  const headers = new Headers({ "content-type": file.mimeType, "accept-ranges": "bytes", "cache-control": CACHE });
  for (const h of ["content-length", "content-range"]) {
    const v = res.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(res.body, { status: res.status, headers });
}
