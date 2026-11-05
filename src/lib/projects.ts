import { cacheLife, cacheTag } from "next/cache";
import { stock } from "@/content/stock";
import { driveReady, exportDoc, FOLDER, GDOC, listFolder, rootFolder, type DriveFile } from "@/lib/drive";
import { bodyFromHtml, folderInfo, mediaKind, parseFields, pickCover } from "@/lib/ficha";

// Proyectos del estudio. Se leen de Google Drive (una carpeta por proyecto, ver docs/drive-cms.md);
// sin Drive configurado, o si falla, se muestran estos de ejemplo. Se refrescan solos cada hora o al
// abrir /api/revalidate?secret=… ("Publicar cambios").
export type Media = { kind: "image" | "video"; src: string; poster?: string; width?: number; height?: number; alt: string };
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

// Las imágenes y vídeos se sirven a través de /api/drive (la carpeta es privada). La versión (fecha de
// modificación) va en la ruta: si el archivo cambia en Drive, cambia la URL y no se ve el antiguo en caché.
const version = (f: DriveFile) => Date.parse(f.modifiedTime || "0").toString(36);
function toMedia(f: DriveFile, alt: string): Media | null {
  const kind = mediaKind(f.mimeType);
  if (!kind) return null;
  const base = `/api/drive/${f.id}/${version(f)}`;
  const meta = kind === "image" ? f.imageMediaMetadata : f.videoMediaMetadata;
  return { kind, src: base, poster: kind === "video" && f.thumbnailLink ? `${base}/poster` : undefined, width: meta?.width, height: meta?.height, alt };
}

async function readProject(folder: DriveFile) {
  const info = folderInfo(folder.name);
  const files = await listFolder(folder.id);
  const ficha = files.find((f) => f.mimeType === GDOC && /^(ficha|info|texto)/i.test(f.name.trim())) ?? files.find((f) => f.mimeType === GDOC);
  const [plain, html] = ficha ? await Promise.all([exportDoc(ficha.id, "text/plain"), exportDoc(ficha.id, "text/html")]) : ["", ""];
  const fields = parseFields(plain);
  const title = fields.title ?? info.label;

  const own = files.filter((f) => mediaKind(f.mimeType)).map((f) => ({ f, id: f.id, name: f.name, kind: mediaKind(f.mimeType)! }));
  const coverFile = pickCover(own);
  if (!coverFile) return null; // sin imágenes ni vídeos no se publica
  const ordered = [coverFile, ...own.filter((m) => m !== coverFile)];
  const media = ordered.map((m) => toMedia(m.f, title)).filter((m): m is Media => !!m);

  const carouselFolder = files.find((f) => f.mimeType === FOLDER && /^carrusel|^carousel/i.test(f.name.trim()));
  const carousel = carouselFolder
    ? (await listFolder(carouselFolder.id)).map((f) => toMedia(f, title)).filter((m): m is Media => !!m)
    : [];

  const entry: ProjectEntry = {
    slug: info.slug || folder.id,
    title,
    category: fields.category ?? "",
    client: fields.client,
    year: fields.year,
    summary: fields.summary ?? "",
    link: fields.link,
    cover: media[0],
    media,
    carousel,
    bodyHtml: html ? bodyFromHtml(html) : "",
  };
  return { order: info.order, entry };
}

export async function getProjects(): Promise<ProjectEntry[]> {
  "use cache";
  cacheTag("projects");
  cacheLife("hours");
  if (!driveReady()) return LOCAL;
  try {
    // Carpetas de proyecto; las que empiezan por "_" (borradores) no se publican.
    const folders = (await listFolder(rootFolder())).filter((f) => f.mimeType === FOLDER && !f.name.trim().startsWith("_"));
    const read = (await Promise.all(folders.map(readProject))).filter((x) => x !== null);
    read.sort((a, b) => a.order - b.order);
    const list = read.map((x) => x.entry);
    return list.length ? list : LOCAL;
  } catch (e) {
    console.error("Proyectos desde Drive:", e);
    return LOCAL;
  }
}

export async function getProject(slug: string) {
  return (await getProjects()).find((p) => p.slug === slug) ?? null;
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
