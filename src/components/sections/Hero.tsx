"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { registerReel, setReel } from "@/lib/reel";
import { reel, studio } from "@/content/site";

// Hero = showreel a pantalla completa, servido desde la propia web en calidad adaptativa (HLS: 1080p/720p/480p,
// cada visitante recibe la mejor que permite su conexión). Con el scroll se enmarca con bordes redondeados.
// Sin botones sobre el vídeo: clic en él pausa/reproduce y play/pausa y sonido están en la barra inferior
// (src/lib/reel.ts). Empieza silenciado (el navegador lo exige para la reproducción automática).
export function Hero({ managed = false }: { managed?: boolean }) {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const header = useRef<HTMLElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);

  // Carga el vídeo: HLS nativo (Safari) o hls.js (resto).
  useEffect(() => {
    const v = video.current;
    if (!v || reduced) return;
    let hls: { destroy: () => void } | null = null;
    let cancelled = false;
    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = reel.hls;
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled) return;
        if (!Hls.isSupported()) return; // navegador muy antiguo: se queda el fotograma
        // Máxima calidad: arranca suponiendo buena conexión (empieza en 1080p) y solo baja si de verdad no llega.
        const h = new Hls({ capLevelToPlayerSize: false, startLevel: -1, abrEwmaDefaultEstimate: 12_000_000, abrBandWidthUpFactor: 0.9, maxBufferLength: 30 });
        h.loadSource(reel.hls);
        h.attachMedia(v);
        hls = h;
      });
    }
    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [reduced]);

  // Estado del reproductor para la barra.
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    const sync = () => setReel({ playing: !v.paused, muted: v.muted, time: v.currentTime, duration: Number.isFinite(v.duration) ? v.duration : 0 });
    const events = ["play", "pause", "volumechange", "timeupdate", "loadedmetadata"] as const;
    events.forEach((e) => v.addEventListener(e, sync));
    return () => events.forEach((e) => v.removeEventListener(e, sync));
  }, []);

  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };
  useEffect(() => {
    registerReel({
      toggle: togglePlay,
      toggleSound: () => {
        const v = video.current;
        if (!v) return;
        v.muted = !v.muted;
        if (!v.muted) {
          v.volume = 1;
          if (v.paused) v.play().catch(() => {});
        }
      },
      seek: (t) => {
        if (video.current) video.current.currentTime = t;
      },
    });
  });

  // Play/pausa y sonido en la barra solo arriba del todo: tras el primer scroll se pliegan (vuelven al subir).
  useEffect(() => {
    if (managed) return; // dentro de una escena gestionada, el estado "activo" lo marca ella según el scroll
    const update = () => setReel({ active: window.scrollY < 40 });
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [managed]);

  useEffect(() => {
    if (reduced || managed || !header.current || !frame.current) return;
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
  }, [reduced, managed]);

  return (
    <header ref={header} data-reel-header className={managed ? "absolute inset-0" : "h-svh bg-cloud"}>
      <div ref={frame} data-reel-frame className="relative h-full overflow-hidden bg-ink">
        <div ref={media} data-reel-media className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={reel.poster} alt="" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`} />
          {!reduced && (
            <video
              ref={video}
              aria-hidden
              tabIndex={-1}
              poster={reel.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onPlaying={() => setReady(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <div className="absolute inset-0 bg-ink/15" />
        {/* Sin botones sobre el vídeo: un clic en él pausa/reproduce (los controles accesibles están en la barra). */}
        {!reduced && <div aria-hidden onClick={togglePlay} className="absolute inset-0 z-[1]" />}
        <h1 className="sr-only">2894_ Studio: {studio.headline}</h1>
      </div>
    </header>
  );
}
