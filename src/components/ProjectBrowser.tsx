"use client";

import type { MutableRefObject } from "react";
import { ProjectSlider } from "@/components/ProjectSlider";
import { ProjectSphere } from "@/components/ProjectSphere";
import { useIsPhone } from "@/lib/useIsPhone";
import type { SphereItem } from "@/lib/projects";

// Proyectos: esfera 3D en pantallas grandes y carrusel en móvil.
export function ProjectBrowser({
  items,
  controlled,
  cardsRef,
  sizeClass,
}: {
  items: SphereItem[];
  controlled?: boolean;
  cardsRef?: MutableRefObject<(HTMLDivElement | null)[]>;
  sizeClass?: string;
}) {
  const phone = useIsPhone();
  if (phone) return <ProjectSlider items={items} mediaRef={cardsRef} fill={controlled} />;
  return <ProjectSphere items={items} controlled={controlled} cardsRef={cardsRef} sizeClass={sizeClass} />;
}
