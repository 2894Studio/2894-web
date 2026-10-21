import { studio } from "@/content/site";

export function Hero() {
  return (
    <header className="flex min-h-svh flex-col justify-between px-[var(--gutter)] pb-6 pt-6">
      <div className="flex items-start justify-between text-sm font-medium uppercase">
        <span>
          2894<span className="text-cobalt">_</span> Studio
        </span>
        <span className="text-right">Madrid · {studio.facts.founded}</span>
      </div>

      <div className="py-16">
        <h1 className="max-w-[18ch] text-[clamp(2.4rem,8.4vw,8.5rem)] font-light uppercase leading-[0.92] tracking-[-0.045em]">
          {studio.headline}
        </h1>
        <p className="mt-8 text-sm font-medium uppercase leading-tight sm:text-base">
          {studio.twoBeat[0]}
          <br />
          {studio.twoBeat[1]}
        </p>
      </div>

      <div
        aria-hidden
        className="select-none overflow-hidden text-[clamp(4.5rem,25vw,24rem)] font-bold leading-[0.9] tracking-tighter"
      >
        2894<span className="text-cobalt">_</span>
      </div>
    </header>
  );
}
