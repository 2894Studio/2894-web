import Image from "next/image";
import { projects } from "@/content/site";

// Galería interactiva: carrusel horizontal con snap (arrastre/gesto en táctil, hover reveal en desktop).
export function Projects() {
  return (
    <section id="proyectos" className="py-[var(--section-y)]" aria-labelledby="proyectos-h">
      <div className="flex items-end justify-between px-[var(--gutter)]">
        <h2 id="proyectos-h" className="text-[clamp(2.5rem,9vw,8rem)] font-bold leading-[0.9] tracking-tighter">
          Proyectos
        </h2>
        <p className="hidden pb-2 text-sm text-muted-foreground sm:block">
          {String(projects.length).padStart(2, "0")} — arrastra →
        </p>
      </div>

      <ul
        className="mt-10 flex scroll-px-[var(--gutter)] snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-6 [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label="Galería de proyectos"
      >
        {projects.map((p, i) => (
          <li key={p.id} className="group w-[78vw] shrink-0 snap-start sm:w-[44vw] lg:w-[28vw]">
            <a href="#" className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt">
              <div className={`relative overflow-hidden rounded-3xl bg-gray-soft ${i % 2 ? "aspect-[4/5] lg:mt-16" : "aspect-[4/5]"}`}>
                <Image
                  src={p.image}
                  alt={`${p.title} — imagen de ejemplo`}
                  fill
                  sizes="(min-width:1024px) 28vw, (min-width:640px) 44vw, 78vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ink/80 to-transparent p-5 text-cloud opacity-100 transition-opacity duration-500 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100">
                  <p className="text-sm">{p.description}</p>
                </div>
              </div>
              <div className="mt-4 flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-medium">{p.title}</h3>
                <span className="text-sm text-muted-foreground">
                  {p.category} · {p.year}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
