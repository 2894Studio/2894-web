import { studio } from "@/content/site";

export function About() {
  return (
    <section id="nosotros" className="px-[var(--gutter)] py-[var(--section-y)]" aria-labelledby="nosotros-h">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-sm font-medium uppercase tracking-wide text-cobalt">Nosotros</p>
          <h2 id="nosotros-h" className="mt-4 text-[clamp(2rem,5vw,4.5rem)] font-bold leading-[0.95] tracking-tighter">
            Alfabetización en IA para equipos que crean.
          </h2>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p className="text-lg leading-relaxed sm:text-xl">{studio.intro}</p>
          <ul className="mt-8 space-y-3 text-muted-foreground">
            {studio.beyond.map((b) => (
              <li key={b} className="flex gap-3">
                <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cobalt" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-2">
        {studio.values.map((v) => (
          <article key={v.title} className="rounded-3xl bg-gray-soft p-8 md:p-10">
            <h3 className="text-2xl font-bold tracking-tight">{v.title}</h3>
            <p className="mt-4 text-muted-foreground">{v.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
