"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { reel, studio } from "@/content/site";

const src = `https://www.youtube-nocookie.com/embed/${reel.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${reel.youtubeId}&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1`;

const Speaker = ({ muted }: { muted: boolean }) => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
  </svg>
);

const PlayPause = ({ playing }: { playing: boolean }) => (
  <svg aria-hidden viewBox="0 0 24 24" className="size-8" fill="currentColor">
    {playing ? <path d="M7 5h3.5v14H7zm6.5 0H17v14h-3.5z" /> : <path d="M8 5.2v13.6a.6.6 0 0 0 .9.5l10.6-6.8a.6.6 0 0 0 0-1L8.9 4.7a.6.6 0 0 0-.9.5z" />}
  </svg>
);

// Hero = showreel a pantalla completa. Con el scroll se enmarca con bordes redondeados (referencia: cm.studio).
// Clic sobre el vídeo: pausa/reproduce. Botón de sonido: empieza silenciado (el navegador lo exige para el autoplay).
export function Hero() {
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [flash, setFlash] = useState(0);
  const soundAt = useRef(0); // instante del último cambio de sonido: ignora avisos de YouTube aún sin aplicar
  const header = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const player = useRef<HTMLIFrameElement>(null);
  const media = useRef<HTMLDivElement>(null);

  // Muestra el vídeo solo cuando YouTube confirma que está reproduciendo; mientras, el fotograma.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== player.current?.contentWindow || typeof e.data !== "string") return;
      try {
        const d = JSON.parse(e.data);
        const state = d.event === "onStateChange" ? d.info : d.info?.playerState;
        if (state === 1) {
          setLoaded(true);
          setPlaying(true);
        } else if (state === 2) setPlaying(false);
        if (typeof d.info?.muted === "boolean" && performance.now() - soundAt.current > 1500) setMuted(d.info.muted);
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Órdenes a la API del reproductor de YouTube (iframe con enablejsapi=1).
  const send = (func: string, args: unknown[] = []) =>
    player.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  const togglePlay = () => {
    send(playing ? "pauseVideo" : "playVideo");
    setPlaying(!playing);
    setFlash((n) => n + 1);
  };
  const toggleSound = () => {
    soundAt.current = performance.now();
    if (muted) {
      send("unMute");
      send("setVolume", [100]);
      if (!playing) {
        send("playVideo");
        setPlaying(true);
      }
    } else send("mute");
    setMuted(!muted);
  };

  useEffect(() => {
    if (reduced || !header.current || !frame.current) return;
    const ctx = gsap.context(() => {
      // Se enmarca de forma marcada: margen hasta ~6vw, esquinas de 48px y el vídeo se aleja.
      const scrollTrigger = { trigger: header.current, start: "top top", end: "bottom top", scrub: 0.8 };
      const inset = () => Math.min(96, Math.max(24, window.innerWidth * 0.06));
      gsap.to(header.current, { padding: inset, ease: "power1.out", scrollTrigger });
      gsap.to(frame.current, { borderRadius: 48, ease: "power1.out", scrollTrigger });
      gsap.fromTo(media.current, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger });
    });
    ScrollTrigger.refresh();
    return () => ctx.revert();
  }, [reduced]);

  return (
    <header ref={header} className="h-svh bg-cloud">
      <div ref={frame} className="relative h-full overflow-hidden bg-ink [container-type:size]">
        <div ref={media} className="absolute inset-0 [container-type:size]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={reel.poster} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${loaded ? "opacity-0" : "opacity-100"}`} />
        {!reduced && (
          <iframe
            ref={player}
            title="Showreel 2894_"
            aria-hidden
            tabIndex={-1}
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; encrypted-media"
            onLoad={() => player.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening" }), "*")}
            src={src}
            className={`pointer-events-none absolute left-1/2 top-1/2 h-[max(100cqh,56.25cqw)] w-[max(100cqw,177.78cqh)] -translate-x-1/2 -translate-y-1/2 border-0 transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        )}
        </div>
        <div className="absolute inset-0 bg-ink/15" />
        {!reduced && (
          <>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={playing ? "Pausar showreel" : "Reproducir showreel"}
              className="absolute inset-0 z-[1] flex items-center justify-center text-cloud focus-visible:outline-2 focus-visible:-outline-offset-8 focus-visible:outline-cloud"
            >
              {/* Icono central: aparece un instante al pulsar y se queda visible mientras está en pausa. */}
              <span
                key={flash}
                className={`flex size-20 items-center justify-center rounded-full bg-ink/45 backdrop-blur-md transition-opacity duration-700 ${playing ? (flash ? "animate-[hero-flash_.9s_ease-out_forwards]" : "opacity-0") : "opacity-100"}`}
              >
                <PlayPause playing={!playing} />
              </span>
            </button>
            <button
              type="button"
              onClick={toggleSound}
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              aria-pressed={!muted}
              className="spring absolute right-4 top-4 z-[2] flex size-11 items-center justify-center rounded-full bg-ink/45 text-cloud backdrop-blur-md hover:bg-ink/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cloud sm:right-6 sm:top-6"
            >
              <Speaker muted={muted} />
            </button>
          </>
        )}
        <h1 className="pointer-events-none absolute left-5 top-5 z-[2] text-lg font-bold text-cloud sm:left-7 sm:top-7">
          2894_
          <span className="sr-only"> Studio: {studio.headline}</span>
        </h1>
      </div>
    </header>
  );
}
