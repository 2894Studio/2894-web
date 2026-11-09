import { Navbar } from "@/components/Navbar";
import { Scene, SceneStack } from "@/components/Scenes";
import { Clients } from "@/components/sections/Clients";
import { Footer } from "@/components/sections/Footer";
import { Intro } from "@/components/sections/Intro";
import { Services } from "@/components/sections/Services";
import { getProjects, toSphere } from "@/lib/projects";

// Cada sección es una escena propia: se suceden como un vídeo guiado por el scroll.
export default async function Home() {
  const items = (await getProjects()).map(toSphere);
  return (
    <>
      <Navbar />
      <SceneStack>
        {/* `contents`: todas las escenas (también el cierre) son hermanas para poder apilarse. */}
        <main className="contents">
          <Scene><Intro items={items} /></Scene>
          {/* Apply: la portada de cada proyecto real */}
          <Scene><Services images={items.filter((i) => i.frames.length).map((i) => ({ src: i.video ? i.frames[0] : i.image, alt: i.title }))} /></Scene>
          <Scene><Clients /></Scene>
        </main>
        <Scene><Footer /></Scene>
      </SceneStack>
    </>
  );
}
