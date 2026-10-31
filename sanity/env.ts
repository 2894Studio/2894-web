// Conexión con Sanity (el gestor de contenidos). Se configura con variables de entorno en Vercel.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = "2025-01-01";
export const sanityReady = projectId.length > 0;
