"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { reel } from "@/content/site";

const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => {
  const mq = window.matchMedia(RM);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

const embed = (extra: string) =>
  `https://www.youtube-nocookie.com/embed/${reel.youtubeId}?${extra}`;

// Hero = showreel (referencia: mendesaltaren). Vídeo a pantalla completa en marco redondeado sobre cobalto.
export function Hero() {
  const motion = !useSyncExternalStore(subscribeRM, () => window.matchMedia(RM).matches, () => true);
  const [loaded, setLoaded] = useState(false);
  const [muted, setMuted] = useState(true);
  const [open, setOpen] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // Muestra el iframe solo cuando YouTube confirma que está reproduciendo (si el embed no está disponible, queda el poster).
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow || typeof e.data !== "string") return;
      try {
        const d = JSON.parse(e.data);
        if (d.event === "onStateChange" ? d.info === 1 : d.info?.playerState === 1) setLoaded(true);
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const send = (func: string) =>
    frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");

  const toggleSound = () => {
    send(muted ? "unMute" : "mute");
    setMuted((m) => !m);
  };

  return (
    <header className="bg-cobalt p-2 sm:p-4">
      <div className="relative h-[calc(100svh-1rem)] overflow-hidden rounded-[1.25rem] bg-ink [container-type:size] sm:h-[calc(100svh-2rem)] sm:rounded-[1.75rem]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={reel.poster}
          alt=""
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${loaded ? "opacity-0" : "opacity-100"}`}
        />
        {motion && (
          <iframe
            ref={frame}
            title="Showreel 2894_"
            aria-hidden
            tabIndex={-1}
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; encrypted-media"
            onLoad={() => frame.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), "*")}
            src={embed(
              `autoplay=1&mute=1&loop=1&playlist=${reel.youtubeId}&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1`,
            )}
            className={`pointer-events-none absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-ink/20" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5 text-sm font-medium uppercase text-cloud sm:p-7">
          <span>
            2894<span className="text-sky">_</span> Studio
          </span>
          <span>Madrid · 2025</span>
        </div>

        <div className="absolute bottom-24 right-5 flex gap-2 sm:bottom-24 sm:right-7">
          {motion && (
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={!muted}
              className="min-h-11 rounded-full bg-cloud/90 px-4 text-xs font-medium uppercase tracking-wide text-ink backdrop-blur transition-colors hover:bg-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cloud"
            >
              Sound {muted ? "off" : "on"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-11 rounded-full bg-cobalt px-5 text-xs font-medium uppercase tracking-wide text-cloud transition-colors hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cloud"
          >
            ▶ {reel.label}
          </button>
        </div>
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && setOpen(false)}
        aria-label="Showreel"
        className="m-auto w-[min(94vw,1200px)] rounded-2xl bg-ink p-0 backdrop:bg-ink/80"
      >
        {open && (
          <div className="relative aspect-video w-full">
            <iframe
              title="Showreel 2894_ completo"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              src={embed("autoplay=1&rel=0&modestbranding=1&playsinline=1")}
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 min-h-11 rounded-full bg-cloud px-4 text-xs font-medium uppercase"
        >
          Close —
        </button>
      </dialog>
    </header>
  );
}
