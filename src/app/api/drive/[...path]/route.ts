import { driveReady, fetchDriveFile, fetchDriveImage } from "@/lib/drive";
import { findPublishedMedia } from "@/lib/projects";

// Sirve las fotos y vídeos de los proyectos publicados desde Drive.
//   /api/drive/<id>/<versión>          → la foto, o el vídeo (con Range: se puede adelantar)
//   /api/drive/<id>/<versión>/poster   → fotograma de un vídeo
//   …/w<ancho>                         → la foto (o el fotograma) a ese ancho
// Solo archivos que aparecen en la web. La versión cambia cuando el archivo cambia en Drive, así que la
// respuesta se guarda en caché "para siempre" en el CDN y en el navegador.
const CACHE = "public, max-age=86400, s-maxage=31536000, immutable";
const notFound = () => new Response("No encontrado", { status: 404 });

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const [id, , ...rest] = (await params).path;
  const extra = rest.includes("poster") ? "poster" : undefined;
  const w = Number(rest.find((r) => /^w\d+$/.test(r))?.slice(1)) || 0; // ancho pedido (cargador de imágenes)
  if (!driveReady() || !id || !/^[\w-]{10,}$/.test(id)) return notFound();
  const media = await findPublishedMedia(id);
  if (!media) return notFound();

  if (media.kind === "image" || extra === "poster") {
    const r = await fetchDriveImage(id, Math.min(w || (extra === "poster" ? 1600 : 2400), 2400));
    const type = r.headers.get("content-type") ?? "";
    if (!r.ok || !type.startsWith("image/")) return notFound();
    return new Response(r.body, { headers: { "content-type": type, "cache-control": CACHE } });
  }

  const r = await fetchDriveFile(id, req.headers.get("range"));
  const type = r.headers.get("content-type") ?? "";
  if ((!r.ok && r.status !== 206) || type.startsWith("text/html")) return new Response("No disponible", { status: 502 });
  // Drive suele responder "application/octet-stream": se usa el tipo real del archivo.
  const headers = new Headers({ "content-type": media.mime ?? (type.startsWith("video/") ? type : "video/mp4"), "accept-ranges": "bytes", "cache-control": CACHE });
  for (const h of ["content-length", "content-range"]) {
    const v = r.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(r.body, { status: r.status, headers });
}
