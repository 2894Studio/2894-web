import { Pill } from "@/components/Pill";
import { clients } from "@/content/site";

// Clients: solo marcas grandes. La acción aparece al hover/foco; en táctil siempre visible.
export function Clients() {
  return (
    <section id="clients" className="bg-gray-soft py-[var(--section-y)]" aria-labelledby="clients-h">
      <h2 id="clients-h" className="px-[var(--gutter)] text-[clamp(2.4rem,9vw,7rem)] font-light uppercase leading-[0.9] tracking-[-0.04em] text-balance">
        Clients<span className="text-cobalt">.</span>
      </h2>
      <ul className="mt-12 grid px-[var(--gutter)] sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => (
          <li key={c.name} className="group flex min-h-48 flex-col justify-between gap-8 py-6 pr-6">
            <p className="text-[clamp(2.4rem,6vw,5rem)] font-bold leading-none tracking-tighter text-cobalt transition-colors group-hover:text-ink">{c.name}</p>
            <div className="transition-opacity duration-300 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
              <Pill href="#">{c.cta}</Pill>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
