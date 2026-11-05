import { revalidateTag } from "next/cache";

// "Publicar cambios": vuelve a leer los proyectos de Drive al momento (si no, se refrescan solos cada hora).
// Se usa abriendo /api/revalidate?secret=<REVALIDATE_SECRET> (se puede guardar como marcador).
async function handle(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || secret !== expected) return new Response("No autorizado", { status: 401 });
  revalidateTag("projects", "max");
  return new Response("Listo: la web vuelve a leer los proyectos de Drive. Recarga la página en unos segundos.", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
export const GET = handle;
export const POST = handle;
