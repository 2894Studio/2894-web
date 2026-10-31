import { ProjectSphere } from "@/components/ProjectSphere";
import { SectionTitle } from "@/components/SectionTitle";
import type { SphereItem } from "@/lib/projects";

export function Projects({ items }: { items: SphereItem[] }) {
  return (
    <section id="proyectos" aria-labelledby="proyectos-h" className="overflow-hidden py-[var(--section-y)]">
      <SectionTitle id="proyectos-h" text="Proyectos" />
      <div className="mt-6 lg:px-[var(--gutter)]">
        <ProjectSphere items={items} />
      </div>
    </section>
  );
}
