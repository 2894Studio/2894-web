import { defineArrayMember, defineField, defineType } from "sanity";

// Un proyecto del estudio: lo que se ve en la esfera de la portada y en su página de caso.
export const project = defineType({
  name: "project",
  title: "Proyecto",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Título", type: "string", validation: (r) => r.required() }),
    defineField({ name: "slug", title: "Dirección (URL)", type: "slug", options: { source: "title", maxLength: 80 }, validation: (r) => r.required() }),
    defineField({ name: "client", title: "Cliente", type: "string" }),
    defineField({ name: "year", title: "Año", type: "number" }),
    defineField({ name: "categories", title: "Categorías", type: "array", of: [defineArrayMember({ type: "string" })], options: { layout: "tags" } }),
    defineField({ name: "summary", title: "Resumen (aparece al pasar por la esfera)", type: "text", rows: 3, validation: (r) => r.max(280) }),
    defineField({ name: "cover", title: "Portada", type: "image", options: { hotspot: true }, validation: (r) => r.required() }),
    defineField({ name: "video", title: "Vídeo principal", type: "file", options: { accept: "video/*" } }),
    defineField({
      name: "gallery",
      title: "Galería",
      type: "array",
      of: [
        defineArrayMember({ type: "image", options: { hotspot: true }, fields: [defineField({ name: "alt", title: "Descripción", type: "string" })] }),
        defineArrayMember({ name: "galleryVideo", title: "Vídeo", type: "file", options: { accept: "video/*" } }),
      ],
    }),
    defineField({ name: "body", title: "Texto del caso", type: "array", of: [defineArrayMember({ type: "block" })] }),
    defineField({ name: "link", title: "Enlace externo", type: "url" }),
    defineField({ name: "featured", title: "Destacado en la esfera", type: "boolean", initialValue: true }),
    defineField({ name: "order", title: "Orden", type: "number" }),
  ],
  orderings: [{ title: "Orden", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "title", subtitle: "client", media: "cover" } },
});

export const schemaTypes = [project];
