import { services } from "@/content/site";

export function Services() {
  return (
    <section id="servicios" className="bg-ink py-[var(--section-y)] text-cloud" aria-labelledby="servicios-h">
      <div className="px-[var(--gutter)]">
        <p className="text-sm font-medium uppercase tracking-wide text-sky">Approach</p>
        <h2 id="servicios-h" className="mt-4 text-[clamp(2.5rem,9vw,8rem)] font-bold leading-[0.9] tracking-tighter">
          Discover. Apply. Grow<span className="text-cobalt">.</span>
        </h2>
      </div>

      <ol className="mt-14 border-t border-cloud/15">
        {services.map((s, i) => (
          <li
            key={s.key}
            className="grid gap-6 border-b border-cloud/15 px-[var(--gutter)] py-10 md:grid-cols-12 md:gap-8 md:py-14"
          >
            <span className="text-sm text-cloud/50 md:col-span-1">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="text-[clamp(2rem,5vw,4.5rem)] font-bold leading-none tracking-tight md:col-span-5">{s.key}</h3>
            <div className="md:col-span-6">
              <p className="max-w-md text-cloud/70">{s.text}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {s.items.map((it) => (
                  <li key={it} className="rounded-full border border-cloud/25 px-4 py-2 text-sm">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
