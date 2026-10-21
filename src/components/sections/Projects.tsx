import { ProjectCloud } from "@/components/ProjectCloud";

// Nube de proyectos (referencia: gionatannese.com). El título del proyecto solo aparece en hover/foco.
export function Projects() {
  return (
    <section id="proyectos" aria-labelledby="proyectos-h" className="py-[var(--section-y)]">
      <h2 id="proyectos-h" className="px-[var(--gutter)] text-[clamp(2.4rem,9vw,7rem)] font-light uppercase leading-[0.9] tracking-[-0.04em] text-balance">
        Proyectos<span className="text-cobalt">.</span>
      </h2>
      <ProjectCloud />
    </section>
  );
}
