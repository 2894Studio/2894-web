import { Navbar } from "@/components/Navbar";
import { About } from "@/components/sections/About";
import { Clients } from "@/components/sections/Clients";
import { Footer } from "@/components/sections/Footer";
import { Hero } from "@/components/sections/Hero";
import { Projects } from "@/components/sections/Projects";
import { ReelBlock } from "@/components/sections/ReelBlock";
import { Services } from "@/components/sections/Services";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Projects />
        <ReelBlock />
        <Services />
        <About />
        <Clients />
      </main>
      <Footer />
    </>
  );
}
