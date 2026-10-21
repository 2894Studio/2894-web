import { Pill } from "@/components/Pill";
import { studio } from "@/content/site";

export function About() {
  return (
    <section id="nosotros" className="px-[var(--gutter)] pb-[var(--section-y)]" aria-labelledby="nosotros-h">
      <h2 id="nosotros-h" className="text-[clamp(2.4rem,9vw,8rem)] font-light uppercase leading-[0.9] tracking-[-0.045em]">
        Nosotros<span className="text-cobalt">.</span>
      </h2>
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <p className="max-w-sm text-lg font-medium uppercase leading-tight sm:text-xl">
          Alfabetización en IA para equipos que crean.
        </p>
        <div>
          <p className="max-w-xl">{studio.intro}</p>
          <ul className="mt-6 space-y-2 text-ink/75">
            {studio.beyond.map((b) => (
              <li key={b}>— {b}</li>
            ))}
          </ul>
          <div className="mt-8">
            <Pill href="#contacto">Get to know us</Pill>
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-2">
        {studio.values.map((v) => (
          <article key={v.title} className="bg-gray-soft p-8 md:p-10">
            <h3 className="text-2xl uppercase tracking-tight">{v.title}</h3>
            <p className="mt-4 text-ink/75">{v.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
