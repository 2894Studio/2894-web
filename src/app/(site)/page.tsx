import { Navbar } from "@/components/Navbar";
import { Scene, SceneStack } from "@/components/Scenes";
import { BustScene } from "@/components/sections/BustScene";
import { Clients } from "@/components/sections/Clients";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { Services } from "@/components/sections/Services";
import { getClientMedia, getProjects, toSphere } from "@/lib/projects";

// Cada sección es una escena propia: se suceden como un vídeo guiado por el scroll.
// Orden: showreel → proyectos → Discover/Apply/Grow → clientes → busto (easter egg) → cierre.
export default async function Home() {
  const [items, clientMedia] = await Promise.all([getProjects().then((l) => l.map(toSphere)), getClientMedia()]);
  return (
    <>
      <Navbar />
      <SceneStack>
        {/* `contents`: todas las escenas (también el cierre) son hermanas para poder apilarse. */}
        <main className="contents">
          <Scene><Hero /></Scene>
          <Scene><Projects items={items} /></Scene>
          {/* Apply: la portada de cada proyecto real */}
          <Scene><Services images={items.filter((i) => i.frames.length).map((i) => ({ src: i.video ? i.frames[0] : i.image, alt: i.title }))} /></Scene>
          <Scene><Clients media={clientMedia} /></Scene>
          <Scene><BustScene /></Scene>
        </main>
        <Scene><Footer /></Scene>
      </SceneStack>
    </>
  );
}
