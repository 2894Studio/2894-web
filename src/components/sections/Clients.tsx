import { Pill } from "@/components/Pill";
import { brands, clients } from "@/content/site";

// Featured clients: 4–5 columnas en desktop, carrusel con snap en móvil/tablet.
export function Clients() {
  return (
    <section id="clients" className="py-[var(--section-y)]" aria-labelledby="clients-h">
      <h2 id="clients-h" className="px-[var(--gutter)] text-[clamp(2.4rem,9vw,8rem)] font-light uppercase leading-[0.9] tracking-[-0.045em]">
        Featured clients<span className="text-cobalt">.</span>
      </h2>
      <ul
        className="mt-14 flex scroll-px-[var(--gutter)] snap-x snap-mandatory gap-8 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:none] lg:grid lg:grid-cols-5 lg:overflow-visible [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label="Casos de clientes"
      >
        {clients.map((c) => (
          <li key={c.name} className="flex w-[78vw] shrink-0 snap-start flex-col sm:w-[42vw] lg:w-auto">
            <p className="text-3xl font-bold tracking-tighter text-cobalt">{c.name}</p>
            <p className="mt-8 flex-1 text-lg leading-snug text-ink/85">{c.text}</p>
            <div className="mt-10">
              <Pill href="#">{c.cta}</Pill>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-20 px-[var(--gutter)]">
        <p className="text-xs font-medium uppercase tracking-wide text-ink/60">Brands we&apos;ve worked with</p>
        <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-2xl uppercase tracking-tight sm:text-4xl">
          {brands.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
