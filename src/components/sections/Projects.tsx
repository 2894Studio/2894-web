import { ProjectCloud } from "@/components/ProjectCloud";

// Nube de proyectos (referencia: gionatannese.com).
export function Projects() {
  return (
    <section id="proyectos" aria-labelledby="proyectos-h" className="py-[var(--section-y)]">
      <div className="flex items-end justify-between px-[var(--gutter)]">
        <h2 id="proyectos-h" className="text-[clamp(2.4rem,9vw,8rem)] font-light uppercase leading-[0.9] tracking-[-0.04em] text-balance">
          Proyectos<span className="text-cobalt">.</span>
        </h2>
      </div>
      <ProjectCloud />
    </section>
  );
}
