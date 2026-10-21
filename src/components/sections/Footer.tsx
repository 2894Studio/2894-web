import { Pill } from "@/components/Pill";
import { nav, studio } from "@/content/site";

export function Footer() {
  return (
    <footer id="contacto" className="bg-ink px-[var(--gutter)] pt-[var(--section-y)] text-cloud">
      <p className="text-sm font-medium uppercase tracking-wide text-cloud/60">Contacto</p>
      <h2 className="mt-4 max-w-4xl text-[clamp(2rem,6vw,5.5rem)] font-light uppercase leading-[0.95] tracking-[-0.04em]">
        Hablemos de lo que tu equipo puede crear con IA.
      </h2>
      <div className="mt-8 flex flex-wrap gap-3">
        <Pill href={`mailto:${studio.email}`} variant="light">
          {studio.email}
        </Pill>
        <Pill href={`tel:${studio.phone.replace(/\s/g, "")}`} variant="dark">
          {studio.phone}
        </Pill>
      </div>

      <div className="mt-16 flex flex-col gap-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {nav.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="py-2 hover:underline">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="text-cloud/70">
          {studio.facts.location} · {studio.facts.sector}
        </p>
      </div>

      <div aria-hidden className="select-none overflow-hidden pt-10 text-[clamp(4.5rem,25vw,24rem)] font-bold leading-[0.9] tracking-tighter">
        2894<span className="text-cobalt">_</span>
      </div>
    </footer>
  );
}
