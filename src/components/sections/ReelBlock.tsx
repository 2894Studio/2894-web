import { reel } from "@/content/site";

// Bloque grande "PLAY REEL". Con URL (mp4) reproduce el vídeo; si no, muestra placeholder.
export function ReelBlock() {
  const isFile = /\.(mp4|webm|mov)(\?|$)/i.test(reel.url);
  return (
    <section aria-label="Showreel" className="relative aspect-[4/3] w-full overflow-hidden bg-gray-soft sm:aspect-[16/8]">
      {reel.url && isFile ? (
        <video className="h-full w-full object-cover" src={reel.url} poster={reel.poster} autoPlay muted loop playsInline preload="metadata" />
      ) : reel.url ? (
        <iframe
          className="h-full w-full"
          src={reel.url}
          title="Showreel 2894_"
          allow="autoplay; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reel.poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 grayscale" loading="lazy" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-ink px-6 py-3 text-sm font-medium uppercase tracking-wide text-paper">
              ▶ {reel.label}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
