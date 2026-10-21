"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Pill } from "@/components/Pill";
import type { Project } from "@/content/site";

export function ProjectDialog({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (project && !d.open) d.showModal();
    if (!project && d.open) d.close();
  }, [project]);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
      aria-label={project ? `Caso: ${project.title}` : "Caso"}
      className="m-auto w-[min(94vw,1000px)] bg-cloud p-0 backdrop:bg-ink/70"
    >
      {project && (
        <div className="grid md:grid-cols-[1.4fr_1fr]">
          <div className="relative min-h-[50svh] md:min-h-[70svh]">
            <Image src={project.image} alt={project.imageAlt} fill sizes="(min-width:768px) 600px, 94vw" className="object-cover" />
          </div>
          <div className="flex flex-col justify-between gap-8 p-6 md:p-8">
            <div>
              <p className="text-sm uppercase tracking-wide text-ink">{project.meta.join(" · ")}</p>
              <h3 className="mt-3 text-3xl font-light uppercase tracking-tight">{project.title}</h3>
              <p className="mt-6 text-sm text-ink">Imagen de stock: {project.credit}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Pill href="#">View case study</Pill>
              <button type="button" autoFocus onClick={onClose} className="spring min-h-11 rounded-full border border-ink px-4 text-sm font-medium uppercase hover:bg-ink hover:text-cloud">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
