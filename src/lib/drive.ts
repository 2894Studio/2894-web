// Conexión con Google Drive sin Google Cloud: un Apps Script publicado con la cuenta del estudio
// (docs/drive-apps-script.gs) lee la carpeta de proyectos y devuelve su contenido en JSON. El script comparte
// por enlace solo las fotos y vídeos de los proyectos publicados; la carpeta, las Fichas y los borradores
// siguen privados. Variables: DRIVE_SCRIPT_URL (URL /exec del script) y DRIVE_SCRIPT_KEY (su clave).
// DRIVE_IMG_BASE / DRIVE_DL_BASE solo se cambian en pruebas locales con un Drive simulado.

const IMG_BASE = process.env.DRIVE_IMG_BASE ?? "https://lh3.googleusercontent.com";
const DL_BASE = process.env.DRIVE_DL_BASE ?? "https://drive.usercontent.google.com";

export type CatalogFile = { id: string; name: string; mimeType: string; modifiedTime: string };
export type CatalogProject = {
  id: string;
  name: string;
  files: CatalogFile[];
  carousel: CatalogFile[];
  ficha: { plain: string; html: string } | null;
};

export const driveReady = () => Boolean(process.env.DRIVE_SCRIPT_URL && process.env.DRIVE_SCRIPT_KEY);

export async function fetchCatalog(): Promise<CatalogProject[]> {
  const url = new URL(process.env.DRIVE_SCRIPT_URL!);
  url.searchParams.set("key", process.env.DRIVE_SCRIPT_KEY!);
  const res = await fetch(url, { cache: "no-store", redirect: "follow" });
  if (!res.ok) throw new Error(`Drive (script): ${res.status}`);
  const j = (await res.json()) as { projects?: CatalogProject[]; error?: string };
  if (!j.projects) throw new Error(`Drive (script): ${j.error ?? "respuesta inesperada"}`);
  return j.projects;
}

// Imagen (o fotograma de un vídeo) servida por Google a partir de un archivo compartido por enlace.
export function fetchDriveImage(id: string, width = 2400) {
  return fetch(`${IMG_BASE}/d/${encodeURIComponent(id)}=w${width}`, { cache: "no-store", redirect: "follow" });
}

// Bytes de un vídeo (con Range para poder adelantar).
export function fetchDriveFile(id: string, range?: string | null) {
  return fetch(`${DL_BASE}/download?id=${encodeURIComponent(id)}&export=download&confirm=t`, {
    cache: "no-store",
    redirect: "follow",
    headers: range ? { range } : {},
  });
}
