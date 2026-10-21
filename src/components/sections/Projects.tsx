import { ProjectSphere } from "@/components/ProjectSphere";

export function Projects() {
  return (
    <section id="proyectos" aria-labelledby="proyectos-h" className="overflow-hidden py-[var(--section-y)]">
      <h2 id="proyectos-h" className="px-[var(--gutter)] text-[clamp(2.4rem,9vw,7rem)] font-light uppercase leading-[0.9] tracking-[-0.04em] text-balance">
        Proyectos<span className="text-cobalt">.</span>
      </h2>
      <div className="mt-6">
        <ProjectSphere />
      </div>
    </section>
  );
}
