import { Navbar } from "@/components/Navbar";
import { Scene, SceneStack } from "@/components/Scenes";
import { Clients } from "@/components/sections/Clients";
import { Footer } from "@/components/sections/Footer";
import { Intro, type IntroVariant } from "@/components/sections/Intro";
import { Services } from "@/components/sections/Services";
import { getProjects, toSphere } from "@/lib/projects";

// Cada sección es una escena propia: se suceden como un vídeo guiado por el scroll.
// `variant` elige la apertura (la de la portada o la alternativa en /alternativa).
export async function HomeView({ variant = "logo" }: { variant?: IntroVariant }) {
  const items = (await getProjects()).map(toSphere);
  return (
    <>
      <Navbar />
      <SceneStack>
        {/* `contents`: todas las escenas (también el cierre) son hermanas para poder apilarse. */}
        <main className="contents">
          <Scene><Intro items={items} variant={variant} /></Scene>
          <Scene><Services /></Scene>
          <Scene><Clients /></Scene>
        </main>
        <Scene><Footer /></Scene>
      </SceneStack>
    </>
  );
}
