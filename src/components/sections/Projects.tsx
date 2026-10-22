import { ProjectSphere } from "@/components/ProjectSphere";
import { SectionTitle } from "@/components/SectionTitle";

export function Projects() {
  return (
    <section id="proyectos" aria-labelledby="proyectos-h" className="overflow-hidden py-[var(--section-y)]">
      <SectionTitle id="proyectos-h" text="Proyectos" />
      <div className="mt-6 lg:px-[var(--gutter)]">
        <ProjectSphere />
      </div>
    </section>
  );
}
