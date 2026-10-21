"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";

type Props = {
  image: string;
  alt: string;
  title: string;
  titleClassName?: string;
  className?: string;
  sizes?: string;
  children?: ReactNode;
};

// Imagen protagonista: el texto de apoyo aparece al pasar el ratón, enfocar con teclado o tocar.
// Siempre está en el DOM, así que los lectores de pantalla lo leen.
export function RevealPanel({ image, alt, title, titleClassName = "text-4xl sm:text-6xl", className = "", sizes = "(min-width:768px) 33vw, 100vw", children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <article data-open={open} className={`group relative isolate overflow-hidden bg-ink text-cloud ${className}`}>
      <Image src={image} alt={alt} fill sizes={sizes} className="-z-10 object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 group-data-[open=true]:scale-105" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
      <div className="absolute inset-0 -z-10 bg-ink/15 transition-colors duration-500 group-hover:bg-ink/70 group-focus-within:bg-ink/70 group-data-[open=true]:bg-ink/70" />
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-cloud"
      >
        <span className="sr-only">{open ? "Ocultar" : "Mostrar"} detalles de {title}</span>
      </button>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-6 sm:p-8">
        <h3 className={`font-light uppercase leading-[0.95] tracking-[-0.04em] text-balance ${titleClassName}`}>{title}</h3>
        <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-500 ease-out group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100 group-data-[open=true]:grid-rows-[1fr] group-data-[open=true]:opacity-100">
          <div className="overflow-hidden">
            <div className="max-w-md pt-4 text-lg">{children}</div>
          </div>
        </div>
      </div>
    </article>
  );
}
