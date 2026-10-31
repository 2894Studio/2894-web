"use client";

import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

// El panel de Sanity se ejecuta solo en el navegador.
export function Studio() {
  return <NextStudio config={config} />;
}
