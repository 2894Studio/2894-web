import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { dataset, projectId } from "./sanity/env";
import { schemaTypes } from "./sanity/schemaTypes/project";

// Panel de contenidos de 2894_ en /studio: el equipo crea y edita proyectos sin tocar código.
export default defineConfig({
  name: "default",
  title: "2894_ · Contenidos",
  basePath: "/studio",
  projectId: projectId || "sin-configurar",
  dataset,
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
