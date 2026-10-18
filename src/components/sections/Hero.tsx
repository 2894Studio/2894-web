import SplitText from "@/components/SplitText";
import { studio } from "@/content/site";

// Showreel: define NEXT_PUBLIC_SHOWREEL_URL (MP4) para activar el vídeo. Mientras tanto, placeholder.
const SHOWREEL = process.env.NEXT_PUBLIC_SHOWREEL_URL;

export function Hero() {
  return (
    <header className="relative flex min-h-svh flex-col justify-between overflow-hidden bg-ink text-cloud">
      <div aria-hidden className="absolute inset-0">
        {SHOWREEL ? (
          <video
            className="h-full w-full object-cover"
            src={SHOWREEL}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(120%_90%_at_70%_20%,var(--sky-blue),var(--deep-cobalt)_55%,var(--ink-black))]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-ink/30" />
      </div>

      <div className="relative z-10 flex items-start justify-between px-[var(--gutter)] pt-6 text-sm font-medium">
        <span>{studio.name} Studio</span>
        <span className="text-right">
          Madrid · {studio.facts.founded}
        </span>
      </div>

      <div className="relative z-10 px-[var(--gutter)]">
        <SplitText
          text={studio.tagline}
          tag="h1"
          textAlign="left"
          splitType="words"
          delay={80}
          className="max-w-3xl text-[clamp(1.5rem,4.2vw,3.25rem)] font-light leading-[1.1]"
        />
        <p className="mt-4 max-w-xl text-sm text-cloud/80 sm:text-base">{studio.positioning}</p>
        <div className="mt-6 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-cloud/80">
          <span className="inline-block h-px w-10 bg-cloud/60" /> Scroll
        </div>
      </div>

      <div
        aria-hidden
        className="relative z-10 select-none overflow-hidden px-[var(--gutter)] pb-[0.04em] text-[clamp(4.5rem,25vw,24rem)] font-bold leading-[0.9] tracking-tighter"
      >
        2894<span className="text-sky">_</span>
      </div>
    </header>
  );
}
