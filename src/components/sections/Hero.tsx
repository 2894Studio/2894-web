"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { reel, studio } from "@/content/site";

const src = `https://www.youtube-nocookie.com/embed/${reel.youtubeId}?autoplay=1&mute=1&loop=1&playlist=${reel.youtubeId}&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&enablejsapi=1`;

// Hero = showreel a pantalla completa. Con el scroll se enmarca con bordes redondeados (referencia: cm.studio).
export function Hero() {
  const reduced = useReducedMotion();
  const [loaded, setLoaded] = useState(false);
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
        if (d.event === "onStateChange" ? d.info === 1 : d.info?.playerState === 1) setLoaded(true);
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

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
        <h1 className="absolute left-5 top-5 text-lg font-bold text-cloud sm:left-7 sm:top-7">
          2894<span className="text-sky">_</span>
          <span className="sr-only"> Studio: {studio.headline}</span>
        </h1>
      </div>
    </header>
  );
}
