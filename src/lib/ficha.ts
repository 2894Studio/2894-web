// Lectura de la "Ficha" de cada proyecto (Google Doc) y elección de la portada. Funciones puras (se prueban sin Drive).
//
// Ficha:
//   Título: Dproma
//   Categoría: Research
//   Cliente: DPROMA
//   Año: 2025
//   Resumen: Una o dos frases (la reseña que aparece en la esfera)
//   Enlace: https://… (opcional)
//   ---
//   Texto del proyecto (párrafos, títulos, negrita, cursiva, listas y enlaces del Doc).

export type Fields = { title?: string; category?: string; client?: string; year?: number; summary?: string; link?: string };

const KEYS: Record<string, keyof Fields> = {
  titulo: "title", title: "title",
  categoria: "category", categorias: "category", category: "category",
  cliente: "client", client: "client",
  ano: "year", year: "year",
  resumen: "summary", resena: "summary", summary: "summary",
  enlace: "link", link: "link", url: "link",
};
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const isSep = (line: string) => /^\s*[-—–_]{3,}\s*$/.test(line);

// Campos de la cabecera (texto plano del Doc, hasta la línea "---").
export function parseFields(plain: string): Fields {
  const out: Fields = {};
  for (const raw of plain.replace(/^﻿/, "").split(/\r?\n/)) {
    if (isSep(raw)) break;
    const m = raw.match(/^\s*([^:]{2,20}):\s*(.*)$/);
    if (!m) continue;
    const key = KEYS[norm(m[1])];
    const val = m[2].trim();
    if (!key || !val) continue;
    if (key === "year") {
      const y = parseInt(val, 10);
      if (y > 1900 && y < 3000) out.year = y;
    } else if (key === "link") {
      if (/^https?:\/\//i.test(val)) out.link = val;
    } else out[key] = val;
  }
  return out;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const decode = (s: string) =>
  s.replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

// Google envuelve los enlaces del Doc en https://www.google.com/url?q=…; se recupera el destino real.
function cleanHref(href: string): string | null {
  let h = decode(href);
  try {
    const u = new URL(h);
    if (/(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname === "/url" && u.searchParams.get("q")) h = u.searchParams.get("q")!;
  } catch {
    return null;
  }
  return /^(https?:|mailto:)/i.test(h) ? h : null;
}

// Cuerpo del proyecto: lo que sigue a la línea "---" del HTML exportado, reducido a etiquetas seguras.
// Google marca la negrita y la cursiva con estilos en <span>; se convierten en <strong>/<em>.
export function bodyFromHtml(html: string): string {
  const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html).replace(/<(style|script)\b[\s\S]*?<\/\1>/gi, "");
  // bloques de primer nivel
  const blocks = body.match(/<(p|h[1-6]|ul|ol)\b[^>]*>[\s\S]*?<\/\1>/gi) ?? [];
  const textOf = (b: string) => decode(b.replace(/<[^>]+>/g, "")).trim();
  const sep = blocks.findIndex((b) => isSep(textOf(b)));
  const rest = sep >= 0 ? blocks.slice(sep + 1) : blocks.filter((b) => !/^\s*[^:]{2,20}:/.test(textOf(b)));

  const inline = (s: string): string => {
    let out = "";
    const stack: string[] = [];
    for (const tok of s.split(/(<[^>]+>)/)) {
      if (!tok) continue;
      if (!tok.startsWith("<")) {
        out += esc(decode(tok));
        continue;
      }
      const close = tok.startsWith("</");
      const name = (tok.match(/^<\/?\s*([a-z0-9]+)/i)?.[1] ?? "").toLowerCase();
      if (name === "br") {
        out += "<br>";
        continue;
      }
      if (!close) {
        let open = "";
        if (name === "a") {
          const href = cleanHref(tok.match(/href="([^"]*)"/i)?.[1] ?? "");
          open = href ? `<a href="${esc(href)}" target="_blank" rel="noreferrer">` : "";
          stack.push(href ? "</a>" : "");
        } else if (name === "span" || name === "b" || name === "strong" || name === "i" || name === "em") {
          const style = tok.match(/style="([^"]*)"/i)?.[1] ?? "";
          const bold = name === "b" || name === "strong" || /font-weight:\s*(700|bold|[89]00)/.test(style);
          const ital = name === "i" || name === "em" || /font-style:\s*italic/.test(style);
          open = (bold ? "<strong>" : "") + (ital ? "<em>" : "");
          stack.push((ital ? "</em>" : "") + (bold ? "</strong>" : ""));
        } else continue;
        out += open;
      } else if (["a", "span", "b", "strong", "i", "em"].includes(name)) out += stack.pop() ?? "";
    }
    while (stack.length) out += stack.pop();
    return out.replace(/<(strong|em)><\/\1>/g, "").trim();
  };

  const html2 = rest
    .map((b) => {
      const tag = (b.match(/^<([a-z0-9]+)/i)?.[1] ?? "p").toLowerCase();
      const inner = b.replace(/^<[^>]+>/, "").replace(/<\/[a-z0-9]+>\s*$/i, "");
      if (tag === "ul" || tag === "ol") {
        const items = (inner.match(/<li\b[^>]*>[\s\S]*?<\/li>/gi) ?? []).map((li) => inline(li.replace(/^<li[^>]*>/i, "").replace(/<\/li>$/i, ""))).filter(Boolean);
        return items.length ? `<${tag}>${items.map((i) => `<li>${i}</li>`).join("")}</${tag}>` : "";
      }
      const txt = inline(inner);
      if (!txt) return "";
      const t = tag === "h1" || tag === "h2" ? "h2" : /^h[3-6]$/.test(tag) ? "h3" : "p";
      return `<${t}>${txt}</${t}>`;
    })
    .filter(Boolean)
    .join("\n");
  return html2;
}

// Proyecto a partir del nombre de su carpeta: "01 Dproma" → orden 1, slug "dproma".
export function folderInfo(name: string) {
  const m = name.match(/^\s*(\d+)[\s._-]+(.*)$/);
  const label = (m ? m[2] : name).trim();
  const slug = norm(label).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { order: m ? parseInt(m[1], 10) : 9999, label, slug };
}

export type MediaFile = { id: string; name: string; kind: "image" | "video" };
export const mediaKind = (mime: string): "image" | "video" | null =>
  mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : null;

// Portada: el archivo llamado "portada" (cualquier extensión); si no hay, la primera imagen; si no, el primer vídeo.
export function pickCover<T extends MediaFile>(files: T[]): T | null {
  return (
    files.find((f) => /^(portada|cover)( ?\(\d+\))?(\.[a-z0-9]+)?$/i.test(f.name.trim())) ?? // también "portada (1).mp4"
    files.find((f) => f.kind === "image") ??
    files.find((f) => f.kind === "video") ??
    null
  );
}
