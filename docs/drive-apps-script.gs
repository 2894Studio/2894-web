/**
 * 2894_ · Conexión de la web con la carpeta de proyectos de Google Drive (sin Google Cloud).
 *
 * Cómo se usa (una sola vez): ver docs/drive-cms.md. En resumen: script.google.com → Proyecto nuevo →
 * pegar este código → rellenar KEY y ROOT_ID → Implementar → Nueva implementación → Aplicación web
 * (Ejecutar como: yo · Quién tiene acceso: cualquier usuario) → copiar la URL que termina en /exec.
 *
 * Qué hace: cuando la web lo pide (con la clave), lee cada carpeta de proyecto, su Ficha y sus fotos/vídeos,
 * y devuelve la lista. Las fotos y vídeos de los proyectos publicados se comparten "por enlace" para que la
 * web pueda mostrarlos; la carpeta, las Fichas y lo que empieza por "_" siguen privados.
 */
const KEY = "PEGA_AQUI_LA_CLAVE"; // la misma que DRIVE_SCRIPT_KEY en Vercel
const ROOT_ID = "PEGA_AQUI_EL_ID_DE_LA_CARPETA"; // lo que va tras /folders/ en la dirección de "2894_ Proyectos"

function doGet(e) {
  if (!e || !e.parameter || e.parameter.key !== KEY) return json({ error: "No autorizado" });
  const root = DriveApp.getFolderById(ROOT_ID);
  const projects = [];
  const it = root.getFolders();
  while (it.hasNext()) {
    const folder = it.next();
    if (folder.getName().trim().charAt(0) === "_") continue; // borradores
    projects.push(readProject(folder));
  }
  return json({ projects: projects, generated: new Date().toISOString() });
}

function readProject(folder) {
  const files = [];
  let ficha = null;
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    const mime = f.getMimeType();
    if (mime === MimeType.GOOGLE_DOCS) {
      if (!ficha || /^ficha/i.test(f.getName().trim())) ficha = f;
    } else if (isMedia(mime)) files.push(media(f));
  }
  const carousel = [];
  const subs = folder.getFolders();
  while (subs.hasNext()) {
    const sub = subs.next();
    if (!/^(carrusel|carousel)/i.test(sub.getName().trim())) continue;
    const ci = sub.getFiles();
    while (ci.hasNext()) {
      const f = ci.next();
      if (isMedia(f.getMimeType())) carousel.push(media(f));
    }
  }
  return { id: folder.getId(), name: folder.getName(), files: files, carousel: carousel, ficha: ficha ? readDoc(ficha) : null };
}

function isMedia(mime) {
  return /^(image|video)\//.test(mime);
}

function media(f) {
  try {
    if (f.getSharingAccess() !== DriveApp.Access.ANYONE_WITH_LINK) f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // si no se puede compartir (p. ej. política de la organización), la web no podrá mostrar ese archivo
  }
  return { id: f.getId(), name: f.getName(), mimeType: f.getMimeType(), modifiedTime: f.getLastUpdated().toISOString() };
}

function readDoc(f) {
  const id = f.getId();
  const plain = DocumentApp.openById(id).getBody().getText();
  const res = UrlFetchApp.fetch("https://docs.google.com/feeds/download/documents/export/Export?id=" + id + "&exportFormat=html", {
    headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true,
  });
  return { plain: plain, html: res.getResponseCode() === 200 ? res.getContentText() : "" };
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// Para probar desde el editor: Ejecutar → probar (la primera vez pide permiso para leer tu Drive).
function probar() {
  const out = doGet({ parameter: { key: KEY } }).getContent();
  Logger.log(out.slice(0, 2000));
}
