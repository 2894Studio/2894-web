import { Navbar } from "@/components/Navbar";
import { Scene, SceneStack } from "@/components/Scenes";
import { Clients } from "@/components/sections/Clients";
import { Footer } from "@/components/sections/Footer";
import { Intro } from "@/components/sections/Intro";
import { Services } from "@/components/sections/Services";

// Cada sección es una escena propia: se suceden como un vídeo guiado por el scroll.
export default function Home() {
  return (
    <>
      <Navbar />
      <SceneStack>
        {/* `contents`: todas las escenas (también el cierre) son hermanas para poder apilarse. */}
        <main className="contents">
          <Scene><Intro /></Scene>
          <Scene><Services /></Scene>
          <Scene><Clients /></Scene>
        </main>
        <Scene><Footer /></Scene>
      </SceneStack>
    </>
  );
}
