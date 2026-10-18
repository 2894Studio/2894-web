import { Pill } from "@/components/Pill";
import { clients } from "@/content/site";

// Carrusel de clients: tarjetas logo + texto + pill (referencia visual del brief).
export function Clients() {
  return (
    <section id="clients" className="bg-gray-soft py-[var(--section-y)]" aria-labelledby="clients-h">
      <h2 id="clients-h" className="px-[var(--gutter)] text-[clamp(2.5rem,9vw,8rem)] font-bold leading-[0.9] tracking-tighter">
        Clients
      </h2>
      <ul
        className="mt-12 flex scroll-px-[var(--gutter)] snap-x snap-mandatory gap-8 overflow-x-auto px-[var(--gutter)] pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label="Casos de clientes"
      >
        {clients.map((c) => (
          <li key={c.name} className="flex w-[80vw] shrink-0 snap-start flex-col sm:w-[40vw] lg:w-[24vw]">
            <p className="text-4xl font-bold tracking-tighter">{c.name}</p>
            <p className="mt-8 flex-1 text-lg leading-snug text-ink/80">{c.text}</p>
            <div className="mt-10">
              <Pill href="#">{c.cta}</Pill>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
