"use client";

import { useEffect, useRef, useState } from "react";
import { VIDEO_RATE, VIDEO_START } from "@/components/ProjectSphere";

// Vídeo de portada de un proyecto: sin sonido, en bucle desde VIDEO_START y a VIDEO_RATE (como en la esfera).
export function CoverVideo({ src, className }: { src: string; className?: string }) {
  const v = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    const rate = () => (el.playbackRate = VIDEO_RATE);
    rate();
    el.addEventListener("play", rate);
    return () => el.removeEventListener("play", rate);
  }, []);
  return (
    <>
    <video
      ref={v}
      src={`${src}#t=${VIDEO_START}`}
      autoPlay
      muted
      playsInline
      controls
      preload="metadata"
      onLoadStart={() => setLoading(true)}
      onWaiting={() => setLoading(true)}
      onCanPlay={() => setLoading(false)}
      onPlaying={() => setLoading(false)}
      onEnded={(e) => {
        e.currentTarget.currentTime = VIDEO_START;
        e.currentTarget.play().catch(() => {});
      }}
      className={className}
    />
    {loading && <span role="status" aria-label="Cargando vídeo" className="loadbar" />}
    </>
  );
}
