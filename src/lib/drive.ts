// Acceso de solo lectura a Google Drive con una cuenta de servicio (sin dependencias: JWT firmado con node:crypto).
// La carpeta de proyectos es privada y se comparte con el email de la cuenta de servicio como "Lector".
// Variables: GOOGLE_SERVICE_ACCOUNT_JSON (clave de la cuenta) y DRIVE_PROJECTS_FOLDER_ID (id de la carpeta raíz).
// DRIVE_API_BASE / DRIVE_TOKEN_URL solo sirven para pruebas locales con un Drive simulado.
import { createSign } from "node:crypto";

const API = process.env.DRIVE_API_BASE ?? "https://www.googleapis.com";
const TOKEN_URL = process.env.DRIVE_TOKEN_URL ?? "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/drive.readonly";

export const FOLDER = "application/vnd.google-apps.folder";
export const GDOC = "application/vnd.google-apps.document";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  parents?: string[];
  thumbnailLink?: string;
  imageMediaMetadata?: { width?: number; height?: number };
  videoMediaMetadata?: { width?: number; height?: number };
};

export const rootFolder = () => process.env.DRIVE_PROJECTS_FOLDER_ID ?? "";
export const driveReady = () => Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && rootFolder());

type Key = { client_email: string; private_key: string };
let cached: { token: string; exp: number } | null = null;

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "{}") as Key;
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${head}.${claim}`);
  const jwt = `${head}.${claim}.${b64url(signer.sign(key.private_key.replace(/\\n/g, "\n")))}`;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Drive: token ${res.status}`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), authorization: `Bearer ${await accessToken()}` },
    cache: "no-store",
  });
  return res;
}

const FIELDS = "id,name,mimeType,modifiedTime,parents,thumbnailLink,imageMediaMetadata(width,height),videoMediaMetadata(width,height)";

// Contenido de una carpeta (sin papelera), en orden natural por nombre ("2" antes que "10").
export async function listFolder(id: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let page = "";
  do {
    const q = new URLSearchParams({
      q: `'${id}' in parents and trashed = false`,
      fields: `nextPageToken,files(${FIELDS})`,
      orderBy: "name_natural",
      pageSize: "1000",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      ...(page ? { pageToken: page } : {}),
    });
    const res = await api(`/drive/v3/files?${q}`);
    if (!res.ok) throw new Error(`Drive: list ${res.status}`);
    const j = (await res.json()) as { files: DriveFile[]; nextPageToken?: string };
    out.push(...j.files);
    page = j.nextPageToken ?? "";
  } while (page);
  return out;
}

export async function getFile(id: string): Promise<DriveFile | null> {
  const res = await api(`/drive/v3/files/${encodeURIComponent(id)}?fields=${FIELDS}&supportsAllDrives=true`);
  return res.ok ? ((await res.json()) as DriveFile) : null;
}

// Google Doc exportado (texto o HTML).
export async function exportDoc(id: string, mime: "text/plain" | "text/html"): Promise<string> {
  const res = await api(`/drive/v3/files/${encodeURIComponent(id)}/export?mimeType=${encodeURIComponent(mime)}`);
  if (!res.ok) throw new Error(`Drive: export ${res.status}`);
  return res.text();
}

// Bytes del archivo (con Range para que los vídeos se puedan adelantar).
export function fetchMedia(id: string, range?: string | null) {
  return api(`/drive/v3/files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`, range ? { headers: { range } } : {});
}

// Miniatura de Drive (sirve de póster para los vídeos). Pide una versión grande.
export async function fetchThumbnail(link: string, size = 1600) {
  return fetch(link.replace(/=s\d+$/, `=s${size}`), { headers: { authorization: `Bearer ${await accessToken()}` }, cache: "no-store" });
}

// ¿El archivo está dentro de la carpeta de proyectos (y no en un borrador)? proyecto/archivo o proyecto/Carrusel/archivo
const inside = new Map<string, boolean>();
export async function isInsideRoot(file: DriveFile): Promise<boolean> {
  const root = rootFolder();
  let parents = file.parents ?? [];
  for (let depth = 0; depth < 4; depth++) {
    if (parents.includes(root)) return true;
    const p = parents[0];
    if (!p) return false;
    if (inside.has(p)) return inside.get(p)!;
    const meta = await getFile(p);
    if (!meta || meta.name.trim().startsWith("_")) return false; // borradores: no se sirven
    const ok = (meta.parents ?? []).includes(root);
    if (ok) {
      inside.set(p, true);
      return true;
    }
    parents = meta.parents ?? [];
  }
  return false;
}

export const mediaKindOf = (mime: string) => mime.startsWith("image/") || mime.startsWith("video/");
