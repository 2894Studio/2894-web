import { Pill } from "@/components/Pill";
import { nav, studio } from "@/content/site";
import { stock } from "@/content/stock";

export function Footer() {
  return (
    <footer id="contacto" className="bg-cobalt px-[var(--gutter)] pt-[var(--section-y)] text-cloud">
      <h2 className="max-w-4xl text-[clamp(2rem,6vw,5.5rem)] font-light uppercase leading-[0.95] tracking-[-0.04em]">
        Hablemos de IA.
      </h2>
      <p className="mt-6 max-w-xl text-lg">Cuéntanos qué crea tu equipo y dónde la IA puede ayudarle.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Pill href={`mailto:${studio.email}`} variant="light">
          {studio.email}
        </Pill>
        <Pill href={`tel:${studio.phone.replace(/\s/g, "")}`} variant="cobalt" className="bg-ink hover:bg-sky hover:text-ink">
          {studio.phone}
        </Pill>
      </div>

      <div className="mt-16 flex flex-col gap-6 text-base sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {nav.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="py-2 hover:underline">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-cloud">
          {studio.facts.location} · {studio.facts.sector}
        </p>
      </div>

      <div aria-hidden className="select-none overflow-hidden pt-10 text-[clamp(4.5rem,25vw,24rem)] font-bold leading-[0.9] tracking-tighter">
        2894<span className="text-sky">_</span>
      </div>
      <details className="mt-10 pb-8 text-base text-cloud">
        <summary className="min-h-11 cursor-pointer py-3">Créditos de imagen</summary>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {stock.map((s) => (
            <li key={s.src}>
              <a href={s.page} className="underline underline-offset-2" rel="noreferrer">{s.credit}</a>
            </li>
          ))}
        </ul>
      </details>
    </footer>
  );
}
