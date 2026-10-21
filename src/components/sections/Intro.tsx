import { studio } from "@/content/site";

export function Intro() {
  return (
    <section className="overflow-hidden bg-cobalt px-[var(--gutter)] pb-4 pt-[var(--section-y)] text-cloud" aria-labelledby="intro-h">
      <h1
        id="intro-h"
        className="text-[clamp(2.4rem,8.4vw,8.5rem)] font-light uppercase leading-[0.92] tracking-[-0.04em] text-balance"
      >
        {studio.headline}
      </h1>
      <p className="mt-8 max-w-xl text-lg font-medium uppercase leading-tight text-cloud sm:text-xl">
        {studio.subline}
        <br />
        {studio.twoBeat[0]} {studio.twoBeat[1]}
      </p>
      <div
        aria-hidden
        className="mt-16 select-none text-[clamp(4.5rem,25vw,24rem)] font-bold leading-[0.9] tracking-tighter text-sky"
      >
        2894_
      </div>
    </section>
  );
}
