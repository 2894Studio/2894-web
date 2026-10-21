import { RevealPanel } from "@/components/RevealPanel";
import { aboutImage, studio } from "@/content/site";

export function About() {
  return (
    <section id="nosotros" className="px-[var(--gutter)] py-[var(--section-y)]" aria-labelledby="nosotros-h">
      <h2 id="nosotros-h" className="sr-only">
        Nosotros
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <RevealPanel
          image={aboutImage.src}
          alt={aboutImage.alt}
          title="Nosotros"
          titleClassName="text-5xl sm:text-7xl"
          sizes="(min-width:768px) 50vw, 100vw"
          className="aspect-[4/5] md:row-span-2 md:aspect-auto md:min-h-[70svh]"
        >
          <p>{studio.intro}</p>
        </RevealPanel>
        {studio.values.map((v) => (
          <RevealPanel key={v.title} image={v.image} alt={v.alt} title={v.title} titleClassName="text-3xl sm:text-5xl" sizes="(min-width:768px) 50vw, 100vw" className="aspect-[4/3]">
            <p>{v.text}</p>
          </RevealPanel>
        ))}
      </div>
    </section>
  );
}
