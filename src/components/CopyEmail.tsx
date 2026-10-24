"use client";

import { useState } from "react";

// Copia el email al portapapeles (útil cuando no hay cliente de correo configurado).
export function CopyEmail({ email }: { email: string }) {
  const [label, setLabel] = useState("Copiar email");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setLabel("Copiado");
    } catch {
      setLabel(email);
    }
    window.setTimeout(() => setLabel("Copiar email"), 1800);
  };
  return (
    <button type="button" onClick={copy} className="spring min-h-11 rounded-full border border-current px-4 text-sm hover:bg-cloud hover:text-cobalt">
      <span aria-live="polite">{label}</span>
    </button>
  );
}
