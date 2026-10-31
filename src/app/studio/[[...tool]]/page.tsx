import { sanityReady } from "../../../../sanity/env";
import { Studio } from "./Studio";

export { metadata, viewport } from "next-sanity/studio";

// Panel de contenidos. Hasta que se conecte el proyecto de Sanity, muestra cómo hacerlo.
export default function StudioPage() {
  if (!sanityReady)
    return (
      <main className="mx-auto grid min-h-svh max-w-xl content-center gap-4 px-6 text-ink">
        <h1 className="text-3xl font-light uppercase tracking-tight">Panel de contenidos</h1>
        <p>
          Falta conectar Sanity. Crea un proyecto gratuito en sanity.io y añade en Vercel la variable
          <code className="mx-1 rounded bg-ink/5 px-1">NEXT_PUBLIC_SANITY_PROJECT_ID</code>
          con su identificador. Después, este panel aparecerá aquí.
        </p>
      </main>
    );
  return <Studio />;
}
