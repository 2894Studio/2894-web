import { Navbar } from "@/components/Navbar";
import { Scene, SceneStack } from "@/components/Scenes";
import { Clients } from "@/components/sections/Clients";
import { Footer } from "@/components/sections/Footer";
import { Opening } from "@/components/sections/Opening";
import { Services } from "@/components/sections/Services";
import { getClientMedia, getProjects, toSphere } from "@/lib/projects";
import { clients } from "@/content/site";

// Cada sección es una escena propia: se suceden como un vídeo guiado por el scroll.
// Orden: showreel y proyectos (una escena) → clientes → Discover/Apply/Grow → cierre (con el busto en trama de puntos como easter egg).
export default async function Home() {
  const [items, media] = await Promise.all([getProjects().then((l) => l.map(toSphere)), getClientMedia()]);
  // Pase de cada cliente: sus fotos de Drive o, si no tiene, las del proyecto que hicimos con él.
  const frames = { ...media.frames };
  const videos: Record<string, string> = {};
  for (const c of clients) {
    const key = c.name.toLowerCase();
    const proj = c.project && items.find((i) => i.id === c.project);
    if (frames[key] || !proj) continue;
    if (proj.frames.length) frames[key] = proj.frames;
    else if (proj.video) videos[key] = proj.video; // proyecto solo de vídeo (p. ej. MOA)
  }
  const clientMedia = { ...media, frames, videos };
  return (
    <>
      <Navbar />
      <SceneStack>
        {/* `contents`: todas las escenas (también el cierre) son hermanas para poder apilarse. */}
        <main className="contents">
          {/* Showreel con el cielo por debajo → Proyectos */}
          <Scene><Opening items={items} /></Scene>
          <Scene><Clients media={clientMedia} /></Scene>
          {/* Apply: la portada de cada proyecto real */}
          <Scene><Services images={items.filter((i) => i.image).map((i) => ({ src: i.image, alt: i.title }))} /></Scene>
        </main>
        <Scene><Footer /></Scene>
      </SceneStack>
    </>
  );
}
