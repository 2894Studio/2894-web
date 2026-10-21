import { RevealPanel } from "@/components/RevealPanel";
import { services } from "@/content/site";

export function Services() {
  return (
    <section id="servicios" className="bg-cobalt px-[var(--gutter)] py-[var(--section-y)] text-cloud" aria-labelledby="servicios-h">
      <h2 id="servicios-h" className="text-[clamp(2.4rem,9vw,7rem)] font-light uppercase leading-[0.9] tracking-[-0.04em] text-balance">
        Discover. Apply. Grow<span className="text-sky">.</span>
      </h2>
      <div className="mt-12 grid gap-3 md:grid-cols-3">
        {services.map((s) => (
          <RevealPanel key={s.key} image={s.image} alt={s.alt} title={s.key} className="aspect-[4/5] md:aspect-[3/4]">
            <ul>
              {s.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </RevealPanel>
        ))}
      </div>
    </section>
  );
}
