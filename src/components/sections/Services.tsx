import { Pill } from "@/components/Pill";
import { services, studio } from "@/content/site";

export function Services() {
  return (
    <section id="servicios" className="bg-cobalt px-[var(--gutter)] py-[var(--section-y)] text-cloud" aria-labelledby="servicios-h">
      <h2 id="servicios-h" className="text-[clamp(2.4rem,9vw,8rem)] font-light uppercase leading-[0.9] tracking-[-0.045em]">
        Discover. Apply. Grow<span className="text-sky">.</span>
      </h2>
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <p className="max-w-md text-sm font-medium uppercase leading-snug sm:text-base">{studio.servicesSummary}</p>
        <div>
          <Pill href="#contacto" variant="light">Get in touch</Pill>
        </div>
      </div>

      <ol className="mt-16 grid gap-10 md:grid-cols-3 md:gap-8">
        {services.map((s, i) => (
          <li key={s.key} className="border-t border-cloud/40 pt-5">
            <p className="text-xs uppercase text-cloud/60">{String(i + 1).padStart(2, "0")}</p>
            <h3 className="mt-6 text-3xl uppercase tracking-tight sm:text-4xl">{s.key}</h3>
            <p className="mt-4 max-w-xs text-cloud/85">{s.text}</p>
            <ul className="mt-6 space-y-1 text-sm uppercase tracking-wide">
              {s.items.map((it) => (
                <li key={it}>— {it}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
