import { nav, studio } from "@/content/site";
import { stock } from "@/content/stock";

export function Footer() {
  return (
    <footer id="contacto" className="bg-cobalt px-[var(--gutter)] pt-[var(--section-y)] text-cloud">
      <a
        href={`mailto:${studio.email}`}
        className="block break-words text-[clamp(2rem,7.5vw,7rem)] font-light uppercase leading-[0.95] tracking-[-0.04em] text-balance hover:text-sky focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cloud"
      >
        {studio.email}
      </a>
      <a href={`tel:${studio.phone.replace(/\s/g, "")}`} className="mt-4 inline-block min-h-11 py-2 text-xl hover:text-sky">
        {studio.phone}
      </a>

      <div className="mt-16 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {nav.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="spring inline-block min-h-11 py-2 hover:text-sky">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
        <p>{studio.facts.location}</p>
      </div>

      <div aria-hidden className="select-none overflow-hidden pt-10 text-[clamp(4.5rem,25vw,24rem)] font-bold leading-[0.9] tracking-tighter">
        2894<span className="text-sky">_</span>
      </div>

      <details className="pb-8 text-sm">
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
