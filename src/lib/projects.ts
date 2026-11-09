import { cacheLife, cacheTag } from "next/cache";
import { stock } from "@/content/stock";
import { driveReady, fetchCatalog, type CatalogFile, type CatalogProject } from "@/lib/drive";
import { bodyFromHtml, folderInfo, mediaKind, parseFields, pickCover } from "@/lib/ficha";

// Proyectos del estudio. Se leen de Google Drive a través del Apps Script (una carpeta por proyecto, ver docs/drive-cms.md);
// sin Drive configurado, o si falla, se muestran estos de ejemplo. Se refrescan solos cada hora o al
// abrir /api/revalidate?secret=… ("Publicar cambios").
export type Media = { kind: "image" | "video"; src: string; id?: string; mime?: string; poster?: string; width?: number; height?: number; alt: string };
export type ProjectEntry = {
  slug: string;
  title: string;
  category: string;
  client?: string;
  year?: number;
  summary: string;
  link?: string;
  cover: Media;
  media: Media[]; // todas las fotos y vídeos del proyecto, en orden (la portada primero)
  carousel: Media[]; // carrusel opcional bajo el texto (carpeta "Carrusel")
  bodyHtml: string;
};

const img = (i: number, alt: string): Media => {
  const s = stock[i % stock.length];
  return { kind: "image", src: s.src, width: s.w, height: s.h, alt };
};
// TODO: contenido de ejemplo; el equipo lo sustituye desde Drive.
const sample = (slug: string, title: string, category: string, i: number, client?: string): ProjectEntry => {
  const media = [0, 3, 7, 11, 15].map((k) => img(i + k, title));
  return {
    slug,
    title,
    category,
    client,
    summary: "Texto de ejemplo: qué se pidió, cómo lo abordamos y qué cambió para el equipo.",
    cover: media[0],
    media,
    carousel: i % 2 === 0 ? media.slice(1) : [],
    bodyHtml: "<p>Texto de ejemplo del caso. Se edita en la Ficha del proyecto en Google Drive.</p>",
  };
};
const LOCAL: ProjectEntry[] = [
  sample("dproma", "Dproma", "Research", 0, "DPROMA"),
  sample("scamper", "Scamper", "Herramienta", 1),
  sample("pills", "Pills", "Formación", 2),
  sample("site-microinteracciones", "Site de Microinteracciones", "Web", 3),
  sample("storyboard-zara-home", "Storyboard en vídeo para Zara Home", "Vídeo", 4, "Zara Home"),
  sample("formaciones", "Formaciones", "Formación", 5),
  sample("site-ideacion", "Site de Ideación para proyectos creativos", "Web", 6),
];

// Fotos: directamente desde el CDN de imágenes de Google (rápido; el archivo está compartido por enlace). El ancho
// lo ajusta src/lib/image-loader.ts. Vídeos: a través de /api/drive/<id>/<versión>, porque Google no deja que otra
// web los cargue directamente. La versión (fecha de modificación) evita ver en caché un archivo ya cambiado.
const IMG_BASE = process.env.DRIVE_IMG_BASE ?? "https://lh3.googleusercontent.com";
const version = (f: CatalogFile) => Date.parse(f.modifiedTime || "0").toString(36);
const byName = (a: CatalogFile, b: CatalogFile) => a.name.localeCompare(b.name, "es", { numeric: true, sensitivity: "base" });
function toMedia(f: CatalogFile, alt: string): Media | null {
  const kind = mediaKind(f.mimeType);
  if (!kind) return null;
  const img = `${IMG_BASE}/d/${f.id}=w2400`; // la foto, o el fotograma si es un vídeo
  const src = kind === "image" ? img : `/api/drive/${f.id}/${version(f)}`;
  return { kind, src, id: f.id, mime: f.mimeType, poster: kind === "video" ? img.replace(/=w\d+$/, "=w1200") : undefined, alt };
}

function readProject(p: CatalogProject) {
  const info = folderInfo(p.name);
  const fields = parseFields(p.ficha?.plain ?? "");
  const title = fields.title ?? info.label;

  const own = [...p.files].sort(byName).map((f) => ({ f, id: f.id, name: f.name, kind: mediaKind(f.mimeType) })).filter((m) => m.kind) as { f: CatalogFile; id: string; name: string; kind: "image" | "video" }[];
  const coverFile = pickCover(own);
  if (!coverFile) return null; // sin imágenes ni vídeos no se publica
  const media = [coverFile, ...own.filter((m) => m !== coverFile)].map((m) => toMedia(m.f, title)).filter((m): m is Media => !!m);
  const carousel = [...p.carousel].sort(byName).map((f) => toMedia(f, title)).filter((m): m is Media => !!m);

  const entry: ProjectEntry = {
    slug: info.slug || p.id,
    title,
    category: fields.category ?? "",
    client: fields.client,
    year: fields.year,
    summary: fields.summary ?? "",
    link: fields.link,
    cover: media[0],
    media,
    carousel,
    bodyHtml: p.ficha?.html ? bodyFromHtml(p.ficha.html) : "",
  };
  return { order: info.order, entry };
}

export async function getProjects(): Promise<ProjectEntry[]> {
  "use cache";
  cacheTag("projects");
  // Sin conexión con Drive, o si falla, se muestran los ejemplos solo un momento: se vuelve a intentar enseguida
  // (si no, un fallo puntual —p. ej. el script aún sin autorizar— dejaría los ejemplos durante horas).
  if (!driveReady()) {
    cacheLife("minutes");
    return LOCAL;
  }
  try {
    // El script ya omite las carpetas que empiezan por "_" (borradores).
    const read = (await fetchCatalog()).filter((p) => !p.name.trim().startsWith("_")).map(readProject).filter((x) => x !== null);
    read.sort((a, b) => a.order - b.order);
    const list = read.map((x) => x.entry);
    if (!list.length) {
      cacheLife("minutes"); // aún no hay proyectos con fotos o vídeos
      return LOCAL;
    }
    cacheLife("hours");
    return list;
  } catch (e) {
    console.error("Proyectos desde Drive:", e);
    cacheLife("seconds");
    return LOCAL;
  }
}

export async function getProject(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug) ?? null;
}

// Archivo publicado con ese id (para /api/drive: solo se sirve lo que aparece en la web).
export async function findPublishedMedia(id: string): Promise<Media | null> {
  for (const p of await getProjects()) for (const m of [...p.media, ...p.carousel]) if (m.id === id) return m;
  return null;
}

// Lo que necesita la esfera: portada, fotos para el pase al pasar el ratón y, si es de vídeo, el vídeo.
export type SphereItem = {
  id: string;
  title: string;
  category: string;
  image: string; // imagen de portada (o póster del vídeo)
  frames: string[]; // fotos del proyecto para el pase "como vídeo"
  video?: string; // vídeo que se reproduce al pasar el ratón (proyectos de vídeo)
  review: string;
};
export const toSphere = (p: ProjectEntry): SphereItem => {
  const images = p.media.filter((m) => m.kind === "image").map((m) => m.src);
  const firstVideo = p.media.find((m) => m.kind === "video");
  const videoProject = p.cover.kind === "video" || images.length === 0;
  return {
    id: p.slug,
    title: p.title,
    category: p.category,
    image: p.cover.kind === "image" ? p.cover.src : (p.cover.poster ?? images[0] ?? ""),
    frames: images.slice(0, 24),
    video: videoProject ? (p.cover.kind === "video" ? p.cover.src : firstVideo?.src) : undefined,
    review: p.summary,
  };
};
