import { ImageFrame } from "@/components/ImageFrame";
import { Pill } from "@/components/Pill";
import { projects } from "@/content/site";

// Featured work: grid de 2 columnas con filete vertical (1 columna en móvil).
export function Projects() {
  return (
    <section id="proyectos" className="px-[var(--gutter)] pb-[var(--section-y)]" aria-labelledby="proyectos-h">
      <h2 id="proyectos-h" className="sr-only">
        Proyectos destacados
      </h2>
      <ul className="grid gap-x-0 gap-y-14 md:grid-cols-2 md:[&>li:nth-child(odd)]:border-r md:[&>li:nth-child(odd)]:border-ink md:[&>li:nth-child(odd)]:pr-3.5 md:[&>li:nth-child(even)]:pl-3.5">
        {projects.map((p, i) => (
          <li key={p.id}>
            <a href="#" className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cobalt">
              <ImageFrame
                scene={p.scene}
                alt={`${p.title} — escena de ejemplo con la pantalla del proyecto`}
                title={p.title}
                tone={p.tone as "cobalt" | "ink" | "sky" | "paper"}
                priority={i < 2}
              />
              <p className="mt-4 text-[11px] uppercase tracking-wide text-ink/70 sm:text-xs">{p.meta.join(" · ")}</p>
              <h3 className="mt-3 text-xl uppercase tracking-tight transition-colors group-hover:text-cobalt sm:text-2xl">
                {p.title}
              </h3>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-14">
        <Pill href="#">Ver todos los proyectos</Pill>
      </div>
    </section>
  );
}
