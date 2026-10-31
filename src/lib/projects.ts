import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId, sanityReady } from "../../sanity/env";
import { stock } from "@/content/stock";

// Proyectos del estudio. Si Sanity está conectado se leen de allí (el equipo los edita en /studio);
// si no, se usan estos de ejemplo. La web se regenera sola cuando Sanity avisa de un cambio (/api/revalidate).
export type Media = { type: "image" | "video"; url: string; alt?: string };
export type ProjectEntry = {
  slug: string;
  title: string;
  client?: string;
  year?: number;
  categories: string[];
  summary: string;
  cover: { url: string; alt: string };
  video?: string;
  gallery: Media[];
  body: string[];
  link?: string;
};

const sample = (slug: string, title: string, categories: string[], i: number, client?: string): ProjectEntry => ({
  slug,
  title,
  client,
  categories,
  // TODO: el equipo sustituye este texto desde /studio
  summary: "Texto de ejemplo: qué se pidió, cómo lo abordamos y qué cambió para el equipo.",
  cover: { url: stock[i].src, alt: stock[i].title },
  gallery: [],
  body: ["Texto de ejemplo del caso. Se edita desde el panel de contenidos."],
});

const LOCAL: ProjectEntry[] = [
  sample("dproma", "Dproma", ["Research", "Diseño de servicio"], 0, "DPROMA"),
  sample("scamper", "Scamper", ["Herramienta", "IA aplicada"], 1),
  sample("pills", "Pills", ["Formación", "Contenido"], 2),
  sample("site-microinteracciones", "Site de Microinteracciones", ["Web", "Interacción"], 3),
  sample("storyboard-zara-home", "Storyboard en vídeo para Zara Home", ["Vídeo", "IA generativa"], 4, "Zara Home"),
  sample("formaciones", "Formaciones", ["Formación", "Alfabetización en IA"], 5),
  sample("site-ideacion", "Site de Ideación para proyectos creativos", ["Web", "Ideación"], 6),
];

const QUERY = `*[_type == "project" && defined(slug.current)] | order(order asc, _createdAt desc){
  "slug": slug.current, title, client, year, "categories": coalesce(categories, []), "summary": coalesce(summary, ""),
  "cover": { "url": cover.asset->url, "alt": coalesce(title, "") }, "video": video.asset->url,
  "gallery": coalesce(gallery[]{ "type": select(_type == "galleryVideo" => "video", "image"), "url": asset->url, alt }, []),
  "body": coalesce(body[_type == "block"]{ "t": pt::text(@) }.t, []), link
}`;

export async function getProjects(): Promise<ProjectEntry[]> {
  "use cache";
  cacheTag("projects");
  cacheLife("hours");
  if (!sanityReady) return LOCAL;
  try {
    const client = createClient({ projectId, dataset, apiVersion, useCdn: true });
    const list = await client.fetch<ProjectEntry[]>(QUERY);
    return list.length ? list : LOCAL;
  } catch {
    return LOCAL;
  }
}

export async function getProject(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug) ?? null;
}

// Lo que necesita la esfera de la portada.
export type SphereItem = { id: string; title: string; category: string; image: string; review: string };
export const toSphere = (p: ProjectEntry): SphereItem => ({
  id: p.slug,
  title: p.title,
  category: p.categories[0] ?? "",
  image: p.cover.url,
  review: p.summary,
});
