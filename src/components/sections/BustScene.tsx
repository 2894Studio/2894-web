"use client";

import { useEffect, useRef, useState } from "react";
import { CloudSky, SKY_DEFAULTS, type SkyControls } from "@/components/CloudSky";
import { HeadFollow, type LookTarget } from "@/components/HeadFollow";
import { startFaceTracking, type FaceTracker } from "@/lib/faceTracking";
import { useReducedMotion } from "@/lib/useReducedMotion";

// Easter egg al final de la web (después de Clientes, antes del cierre): el cielo llena la pantalla y, con el
// scroll, la cámara se aleja: el cielo era la frente del busto (máscara con su silueta) y aparece el busto con
// "2894_ Studio" y "Una nueva forma de diseñar" a los lados. El busto sigue al ratón; la cámara es opcional.
const TRACK_SVH = 300;
const IMG_W = 1063, IMG_H = 1518;
const BBOX = [0.206, 0.108, 0.752, 0.882]; // figura dentro del PNG del busto
const FOCUS = [0.5, 0.3]; // punto de la frente desde el que se aleja la cámara
const FOCUS_R = 0.24; // radio (fracción del ancho) del círculo opaco alrededor de FOCUS
// Colores muestreados de la pintura del busto, para que el cielo y el busto sean el mismo cielo.
const BUST_SKY = "linear-gradient(180deg,#0a62ae 0%,#0b84ca 58%,#4ea6d8 100%)";
const CLOUD_LIT = "#f6f3ea";
const CLOUD_SHADE = "#a7b7cc";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type CamState = "off" | "asking" | "on" | "denied";

export function BustScene() {
  const reduced = useReducedMotion();
  if (reduced) return <StaticBust />;
  return <ScrollBust />;
}

function ScrollBust() {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const sky = useRef<HTMLDivElement>(null);
  const sides = useRef<HTMLDivElement>(null);
  const bust = useRef<HTMLDivElement>(null);
  const camUi = useRef<HTMLDivElement>(null);
  const mirrorVideo = useRef<HTMLDivElement>(null);
  const look = useRef<LookTarget>({ active: false, x: 0, y: 0 });
  const skyCtrl = useRef<SkyControls>({ ...SKY_DEFAULTS, size: 1.7 });
  const tracker = useRef<FaceTracker | null>(null);
  const [skyOn, setSkyOn] = useState(false);
  const [cam, setCam] = useState<CamState>("off");

  // Cámara opcional: solo si la persona la activa. La imagen se procesa en el dispositivo y no se guarda.
  const startCam = () => {
    setCam("asking");
    startFaceTracking(
      (x, y) => {
        look.current.active = true;
        look.current.x = x;
        look.current.y = y;
      },
      () => (look.current.active = false),
    )
      .then((t) => {
        tracker.current = t;
        mirrorVideo.current?.replaceChildren(t.video);
        setCam("on");
      })
      .catch(() => setCam("denied"));
  };
  const stopCam = () => {
    tracker.current?.stop();
    tracker.current = null;
    look.current.active = false;
    setCam("off");
  };

  useEffect(() => {
    const st = stage.current, tr = track.current;
    if (!st || !tr) return;
    let raf = 0, W = 0, H = 0, bh = 0, bw = 0, inView = false;

    const measure = () => {
      W = st.clientWidth;
      H = st.clientHeight;
      // Busto grande: la figura ocupa ~3/4 del alto (o ~82 % del ancho en pantallas estrechas).
      bh = Math.min(H * 0.95, ((W * 0.82) / (BBOX[2] - BBOX[0])) * IMG_H / IMG_W);
      bw = bh * IMG_W / IMG_H;
      if (bust.current) {
        const b = bust.current.style;
        b.width = `${bw}px`;
        b.height = `${bh}px`;
        b.left = `${(W - bw) / 2}px`;
        b.top = `${(H - bh) / 2}px`;
        b.transformOrigin = `${FOCUS[0] * bw}px ${FOCUS[1] * bh}px`;
      }
      // Textos laterales pegados al contorno del busto, con un margen prudente y centrados en su altura.
      const l = sides.current?.querySelector<HTMLElement>('[data-side="l"]'), rgt = sides.current?.querySelector<HTMLElement>('[data-side="r"]');
      if (l && rgt) {
        const wide = W >= 640;
        const gap = clamp(W * 0.03, 24, 56);
        const figL = (W - bw) / 2 + BBOX[0] * bw, figR = (W - bw) / 2 + BBOX[2] * bw;
        const figCy = (H - bh) / 2 + ((BBOX[1] + BBOX[3]) / 2) * bh;
        Object.assign(l.style, wide ? { left: "auto", right: `${W - figL + gap}px`, top: `${figCy}px`, transform: "translateY(-50%)" } : { left: "", right: "", top: "", transform: "" });
        Object.assign(rgt.style, wide ? { right: "auto", left: `${figR + gap}px`, top: `${figCy}px`, transform: "translateY(-50%)" } : { left: "", right: "", top: "", transform: "" });
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(st);
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (!inView && tracker.current) stopCam(); // la cámara se apaga al salir de la escena
    });
    io.observe(tr);

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!inView) return;
      const r = tr.getBoundingClientRect();
      const p = clamp(-r.top / (r.height - window.innerHeight), 0, 1);
      const cx = W / 2, cy = H / 2;

      // Zoom out: la silueta del busto (máscara) pasa de cubrir toda la pantalla a su tamaño final;
      // el punto de la frente viaja del centro de la pantalla a su sitio en el busto.
      const k = smooth(seg(p, 0.06, 0.6));
      const s0 = (Math.hypot(W, H) / 2 / (FOCUS_R * bw)) * 1.08;
      const s = Math.exp(lerp(Math.log(s0), 0, k));
      const t = s0 > 1 ? (1 / s - 1 / s0) / (1 - 1 / s0) : 1;
      const fxF = (W - bw) / 2 + FOCUS[0] * bw, fyF = (H - bh) / 2 + FOCUS[1] * bh;
      const X = lerp(cx, fxF, t), Y = lerp(cy, fyF, t);
      if (sky.current) {
        const m = sky.current.style;
        const size = `${bw * s}px ${bh * s}px`, pos = `${X - FOCUS[0] * bw * s}px ${Y - FOCUS[1] * bh * s}px`;
        m.setProperty("mask-size", size);
        m.setProperty("-webkit-mask-size", size);
        m.setProperty("mask-position", pos);
        m.setProperty("-webkit-mask-position", pos);
        m.opacity = String(1 - smooth(seg(k, 0.9, 1)));
      }
      skyCtrl.current.size = lerp(1.7, 0.8, k);
      const skyVisible = k < 1;
      setSkyOn((v) => (v === skyVisible ? v : skyVisible));

      // La pintura del busto aparece encima del cielo con la misma escala y posición.
      const bustIn = smooth(seg(k, 0.55, 0.92));
      if (bust.current) {
        bust.current.style.opacity = String(bustIn);
        bust.current.style.visibility = bustIn > 0 ? "visible" : "hidden";
        bust.current.style.transform = `translate(${X - fxF}px,${Y - fyF}px) scale(${s})`;
        bust.current.style.filter = s < 1.6 ? "drop-shadow(0 0 1px rgb(10 50 120 / 0.35)) drop-shadow(0 18px 36px rgb(11 11 13 / 0.12))" : "";
      }
      const done = smooth(seg(k, 0.85, 1));
      if (sides.current) sides.current.style.opacity = String(done);
      if (camUi.current) {
        camUi.current.style.opacity = String(done);
        camUi.current.style.pointerEvents = done > 0.5 ? "auto" : "none";
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      tracker.current?.stop();
    };
  }, []);

  return (
    <section ref={track} aria-label="2894_ Studio, una nueva forma de diseñar" className="relative" style={{ height: `${TRACK_SVH}svh` }}>
      <div ref={stage} className="sticky top-0 h-svh overflow-hidden bg-cloud">
        {/* Cielo = la pintura del busto; su silueta se reduce en el zoom out */}
        <div
          ref={sky}
          aria-hidden
          className="absolute inset-0 [mask-image:url(/brand/head.webp)] [mask-repeat:no-repeat] [-webkit-mask-image:url(/brand/head.webp)] [-webkit-mask-repeat:no-repeat]"
          style={{ backgroundImage: BUST_SKY, maskSize: "4000% 4000%", maskPosition: "50% 30%" }}
        >
          <CloudSky active={skyOn} lit={CLOUD_LIT} shade={CLOUD_SHADE} controls={skyCtrl} />
        </div>

        {/* "2894_ Studio" y la frase, sutiles, a los lados del busto (en móvil, arriba) */}
        <p className="sr-only">2894_ Studio. Una nueva forma de diseñar</p>
        <div ref={sides} aria-hidden className="pointer-events-none absolute inset-0 text-[11px] font-medium uppercase leading-[1.5] tracking-[0.22em] text-ink/55 opacity-0 sm:text-xs">
          <span data-side="l" className="absolute left-[var(--gutter)] top-[calc(20px+env(safe-area-inset-top,0px))] block sm:text-right">
            2894<span className="blink">_</span>
            <br />
            Studio
          </span>
          <span data-side="r" className="absolute right-[var(--gutter)] top-[calc(20px+env(safe-area-inset-top,0px))] block text-right sm:text-left">
            Una nueva forma
            <br />
            de diseñar
          </span>
        </div>

        {/* Busto: sigue al ratón (o a la cámara, si se activa) */}
        <div ref={bust} className="invisible absolute opacity-0 will-change-transform">
          <HeadFollow src="/brand/head.webp" depth="/brand/head-depth.png" alt="Busto de 2894_: una cabeza azul con nubes" className="h-full w-full" target={look} />
        </div>

        {/* Cámara opcional */}
        <div ref={camUi} className="absolute bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-[var(--gutter)] z-20 flex flex-col items-end gap-2 opacity-0">
          {/* El espejo existe siempre (oculto) para poder colocar la imagen de la cámara en cuanto llega. */}
          <div hidden={cam !== "on"} className="w-[clamp(150px,18vw,240px)] overflow-hidden rounded-3xl border border-white/60 bg-ink shadow-[0_12px_40px_rgb(11_11_13/0.18)] max-sm:w-[132px]">
            <div ref={mirrorVideo} aria-hidden className="relative aspect-[4/3] w-full [&>video]:absolute [&>video]:inset-0 [&>video]:h-full [&>video]:w-full [&>video]:-scale-x-100 [&>video]:object-cover" />
            <button type="button" onClick={stopCam} className="flex min-h-11 w-full items-center justify-center bg-white/90 text-xs font-medium text-ink hover:bg-white">
              Desactivar cámara
            </button>
          </div>
          {cam !== "on" && (
            <>
              <button
                type="button"
                onClick={startCam}
                disabled={cam === "asking"}
                className="spring inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 bg-white/80 px-4 text-sm font-medium text-ink backdrop-blur-md hover:bg-ink hover:text-cloud disabled:opacity-60"
              >
                {cam === "asking" ? "Esperando permiso…" : "Que el busto te mire (cámara)"}
              </button>
              <p className="max-w-[16rem] text-right text-xs text-ink/60">
                {cam === "denied" ? "Sin acceso a la cámara: el busto sigue al ratón." : "Opcional. La imagen se procesa en tu dispositivo y no se guarda."}
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// Movimiento reducido: el busto quieto con los textos.
function StaticBust() {
  return (
    <section aria-label="2894_ Studio, una nueva forma de diseñar" className="grid min-h-svh place-items-center gap-8 bg-cloud px-[var(--gutter)] py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-ink/60">2894_ Studio · Una nueva forma de diseñar</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/head.webp" alt="Busto de 2894_: una cabeza azul con nubes" className="h-[70svh] w-auto" />
    </section>
  );
}
