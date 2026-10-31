import { revalidateTag } from "next/cache";

// Sanity llama aquí (webhook) al publicar: la web vuelve a leer los proyectos.
export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (!process.env.SANITY_REVALIDATE_SECRET || secret !== process.env.SANITY_REVALIDATE_SECRET) return new Response("No autorizado", { status: 401 });
  revalidateTag("projects", "max");
  return Response.json({ ok: true });
}
