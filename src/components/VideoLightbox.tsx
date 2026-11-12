"use client";

import { useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/lenis";

// Vídeo de un proyecto a pantalla completa, con sonido y controles (se abre al pulsar un proyecto de vídeo).
// <dialog> nativo: atrapa el foco, se cierra con Esc y devuelve el foco a la tarjeta al cerrar.
export function VideoLightbox({ video, title, onClose }: { video: { src: string; poster?: string } | null; title: string; onClose: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const d = dlg.current;
    if (!d || !video) return;
    setLoading(true);
    d.showModal();
    getLenis()?.stop();
    return () => {
      getLenis()?.start();
      if (d.open) d.close();
    };
  }, [video]);

  return (
    <dialog
      ref={dlg}
      aria-label={`Vídeo: ${title}`}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-ink/90 backdrop:backdrop-blur-sm"
    >
      {video && (
        <div className="relative flex h-full w-full items-center justify-center p-[clamp(1rem,4vw,3rem)]" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <video
            key={video.src}
            src={video.src}
            poster={video.poster}
            autoPlay
            controls
            playsInline
            preload="auto"
            onWaiting={() => setLoading(true)}
            onCanPlay={() => setLoading(false)}
            onPlaying={() => setLoading(false)}
            className="max-h-full max-w-full rounded-2xl bg-ink shadow-2xl"
          />
          {loading && <span role="status" aria-label="Cargando vídeo" className="loadbar" />}
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="spring absolute right-[clamp(1rem,3vw,2rem)] top-[clamp(1rem,3vw,2rem)] min-h-11 rounded-full bg-cloud px-5 text-sm font-medium uppercase text-ink hover:bg-cobalt hover:text-cloud"
          >
            Cerrar
          </button>
        </div>
      )}
    </dialog>
  );
}
