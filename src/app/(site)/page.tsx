import { Navbar } from "@/components/Navbar";
import { Scene, SceneStack } from "@/components/Scenes";
import { Clients } from "@/components/sections/Clients";
import { Footer } from "@/components/sections/Footer";
import { Opening } from "@/components/sections/Opening";
import { Services } from "@/components/sections/Services";
import { getClientMedia, getProjects, toSphere } from "@/lib/projects";

// Cada sección es una escena propia: se suceden como un vídeo guiado por el scroll.
// Orden: showreel y proyectos (una escena) → clientes → Discover/Apply/Grow → cierre (con el busto en trama de puntos como easter egg).
export default async function Home() {
  const [items, clientMedia] = await Promise.all([getProjects().then((l) => l.map(toSphere)), getClientMedia()]);
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
          <Scene><Services images={items.filter((i) => i.frames.length).map((i) => ({ src: i.video ? i.frames[0] : i.image, alt: i.title }))} /></Scene>
        </main>
        <Scene><Footer /></Scene>
      </SceneStack>
    </>
  );
}
